/* ============================================================
 * PFD Editor · 本地开发服务器（server.js）
 *   - 静态文件服务（项目根目录，含 /editor /preview 别名）
 *   - /api/* 反向代理到后端传感器服务，绕过浏览器 CORS 限制
 * 配置（环境变量，可选）：
 *   PORT        监听端口，默认 8090
 *   API_TARGET  后端地址，默认 http://192.168.1.78
 *   PROJECT_DIR 项目库存放目录，默认 <项目根>/projects
 * 启动：node server.js（或 PowerShell：$env:PORT=9000; node server.js）
 * ============================================================ */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8090;
const ROOT = __dirname;
// 后端 API 目标（2026-09 切换至局域网后端）
const API_TARGET = process.env.API_TARGET || 'http://192.168.1.78';

/* 监听地址（审计 3.2）：默认只监听回环地址 —— 原来 server.listen(PORT) 未指定 host，
   等于绑 0.0.0.0，把「无鉴权的项目库接口」直接暴露给整个局域网。
   需要局域网访问时显式设置 HOST=0.0.0.0（deploy.sh / docker-compose 已显式设置）。 */
const HOST = process.env.HOST || '127.0.0.1';

/* 项目库接口访问令牌（审计 3.1）：PFD_API_TOKEN 为空时不鉴权（向后兼容），
   设置后所有 /pfd-api/* 请求必须带 X-PFD-Token 头。
   令牌会自动注入到对外提供的 HTML 页面里（见 sendFile），前端据此自动带上，
   无需人工配置；对直接调用 API 的脚本则需自行携带。 */
const API_TOKEN = process.env.PFD_API_TOKEN || '';
const TOKEN_HEADER = 'x-pfd-token';

function isExposed(){ return HOST !== '127.0.0.1' && HOST !== 'localhost' && HOST !== '::1'; }

function authOk(req){
  if (!API_TOKEN) return true;
  const got = req.headers[TOKEN_HEADER];
  return typeof got === 'string' && got.length === API_TOKEN.length && got === API_TOKEN;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const ALIASES = {
  '/': '/editor.html',
  '/editor': '/editor.html',
  '/preview': '/preview.html',
};

// 项目库默认目录（可用 PROJECT_DIR 环境变量覆盖），不存在时自动创建
const PROJECT_DIR = process.env.PROJECT_DIR || path.join(ROOT, 'projects');
try {
  fs.mkdirSync(PROJECT_DIR, { recursive: true });
} catch (e) {
  console.error('[PROJECTS] 无法创建项目目录:', e.message);
}

// 项目库文件接口。前缀刻意避开 /api/*，后者已被反向代理到后端传感器服务
const PROJECT_API = '/pfd-api/projects';
const PROJECT_MAX_BYTES = 10 * 1024 * 1024;

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

// 校验项目文件名：仅接受单层文件名且以 .json 结尾，杜绝路径穿越
function resolveProjectFile(name) {
  const raw = String(name || '').trim();
  if (!raw || raw !== path.basename(raw)) return null;
  if (!/\.json$/i.test(raw)) return null;
  return path.join(PROJECT_DIR, raw);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > PROJECT_MAX_BYTES) {
        reject(new Error('内容过大（>10MB）'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleProjectsApi(req, res, urlPath) {
  const rest = urlPath.slice(PROJECT_API.length);
  // 鉴权（审计 3.1）：原来列目录/读/写/删全部零鉴权，局域网内任何人都能读写删除全部项目。
  if (!authOk(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', 'WWW-Authenticate': 'X-PFD-Token' });
    res.end(JSON.stringify({ success: false, error: '未授权：缺少或错误的 X-PFD-Token' }));
    return;
  }
  try {
    // GET /pfd-api/projects —— 列出目录下全部 .json（按修改时间倒序）
    if (req.method === 'GET' && (rest === '' || rest === '/')) {
      // 审计 §5.8：原来用 readdirSync/statSync 在异步 handler 里做同步 IO，会阻塞事件循环。
      // 改为异步 + 单个文件失败（列表期间被删/无权限）只跳过该条，不让整表 500。
      const names = await fs.promises.readdir(PROJECT_DIR);
      const stats = await Promise.all(names.filter((n) => /\.json$/i.test(n)).map(async (n) => {
        try {
          const st = await fs.promises.stat(path.join(PROJECT_DIR, n));
          return { name: n, size: st.size, mtime: st.mtimeMs };
        } catch (e) {
          return null;
        }
      }));
      const files = stats.filter(Boolean).sort((a, b) => b.mtime - a.mtime);
      sendJSON(res, 200, { success: true, dir: PROJECT_DIR, files });
      return;
    }

    const name = decodeURIComponent(rest.replace(/^\//, ''));
    const full = resolveProjectFile(name);
    if (!full) {
      sendJSON(res, 400, { success: false, error: '非法文件名（仅允许 .json 且不能包含路径）' });
      return;
    }

    if (req.method === 'GET') {
      fs.readFile(full, 'utf8', (err, txt) => {
        if (err) { sendJSON(res, 404, { success: false, error: '项目不存在' }); return; }
        sendJSON(res, 200, { success: true, name, content: txt });
      });
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      JSON.parse(body);   // 先校验为合法 JSON，避免把损坏内容写进项目库
      fs.writeFile(full, body, 'utf8', (err) => {
        if (err) { sendJSON(res, 500, { success: false, error: '写入失败：' + err.message }); return; }
        console.log('[PROJECTS] 保存', name);
        sendJSON(res, 200, { success: true, name, mtime: Date.now() });
      });
      return;
    }

    if (req.method === 'DELETE') {
      fs.unlink(full, (err) => {
        if (err) { sendJSON(res, 404, { success: false, error: '项目不存在' }); return; }
        console.log('[PROJECTS] 删除', name);
        sendJSON(res, 200, { success: true, name });
      });
      return;
    }

    sendJSON(res, 405, { success: false, error: '不支持的方法' });
  } catch (e) {
    // 审计 §5.8：400 只用于"客户端数据有问题"；服务端自身故障（IO 失败等）必须是 5xx，
    // 否则客户端会把服务端错误当成自己请求的问题，无法做重试/告警分流。
    const msg = (e && e.message) || String(e);
    const isClientError = (e && e.name === 'SyntaxError') || /非法文件名|内容过大|不支持的方法/.test(msg);
    console.error('[PROJECTS] ' + (isClientError ? '请求错误' : '服务端错误') + '：', msg);
    sendJSON(res, isClientError ? 400 : 500, { success: false, error: msg });
  }
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 审计 1.4：原来把服务器绝对路径回显在 404 响应里（信息泄漏），只回资源名
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + path.basename(filePath));
      return;
    }
    let body = data;
    /* 令牌注入（审计 3.1 配套）：启用鉴权时把令牌注入到 HTML 页面，
       前端据此自动带上 X-PFD-Token，无需人工配置；对页面以外的资源不注入。 */
    if (API_TOKEN && (ext === '.html' || ext === '.htm')) {
      const inject = '<script>window.__PFD_TOKEN=' + JSON.stringify(API_TOKEN) + ';<\/script>';
      const txt = data.toString('utf8');
      const at = txt.lastIndexOf('</body>');
      body = Buffer.from(at >= 0 ? txt.slice(0, at) + inject + txt.slice(at) : txt + inject, 'utf8');
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(body);
  });
}

// API 代理：将 /api/* 请求转发到后端，绕过浏览器 CORS 限制
function proxyRequest(req, res) {
  const targetUrl = API_TARGET + req.url;
  console.log('[PROXY]', req.method, req.url, '->', targetUrl);

  const parsedUrl = new URL(targetUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const transport = isHttps ? https : http;
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedUrl.hostname,
      origin: API_TARGET,
      referer: API_TARGET + '/',
    },
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    // 添加 CORS 头，允许前端访问
    const headers = { ...proxyRes.headers };
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('[PROXY ERROR]', e.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Proxy error: ' + e.message }));
    }
  });

  req.pipe(proxyReq);
}

// OPTIONS 预检请求直接通过
function handleOptions(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

const server = http.createServer((req, res) => {
  /* 请求路径解析必须包住异常（审计 2.1/2.2）：
     decodeURIComponent 对畸形百分号编码（例如 GET /%）会抛 URIError，原实现位于处理器顶层
     且无 try/catch —— 实测一条未认证请求即可让进程退出（http=000），构成远程 DoS。 */
  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    console.warn('[HTTP] 非法请求路径已拒绝：', req.url);
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // 项目库文件接口（须在 /api/* 代理之前判断）
  if (reqPath === PROJECT_API || reqPath.startsWith(PROJECT_API + '/')) {
    handleProjectsApi(req, res, reqPath);
    return;
  }

  // API 代理
  if (req.url.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      handleOptions(req, res);
    } else {
      proxyRequest(req, res);
    }
    return;
  }

  // 项目库存放目录不对外静态暴露，读写一律走上面的接口
  if (reqPath === '/projects' || reqPath.startsWith('/projects/')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  let urlPath = reqPath;

  // 别名映射
  if (ALIASES[urlPath]) urlPath = ALIASES[urlPath];

  /* 路径穿越防护（审计 1.1/1.3）：把解析结果收敛回 ROOT 之内。
     原实现直接 path.join(ROOT, urlPath) —— '..' 会被归一化并逃出根目录，实测：
       · GET /%2e%2e%2fscada_layout_editor.html → 200，读到 web 根目录之外的文件；
       · GET /../RS/projects/x.json → 200，绕过上面 /projects 的 403。
     必须在 decodeURIComponent 之后、任何 fs 调用之前做这个判断。 */
  const resolved = path.resolve(ROOT, '.' + urlPath);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    console.warn('[HTTP] 越界路径已拒绝：', req.url);
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  /* 上面的 /projects 前缀判断作用在原始 URL 上，可被规范化路径绕过
     （实测 GET /../RS/projects/x.json 解析后落在 PROJECT_DIR 内却被放行）。
     这里按【解析后的真实路径】再判一次 —— 项目库只允许走 /pfd-api/projects 接口。 */
  const projectDirResolved = path.resolve(PROJECT_DIR);
  if (resolved === projectDirResolved || resolved.startsWith(projectDirResolved + path.sep)) {
    console.warn('[HTTP] 拒绝直接访问项目库目录：', req.url);
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  let filePath = resolved;

  // 如果路径没有扩展名，尝试添加.html
  if (!path.extname(urlPath)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      sendFile(res, htmlPath);
      return;
    }
  }

  sendFile(res, filePath);
});

/* 进程级兜底（审计 2.1）：任何未捕获异常都不该让服务"静默消失"。
   记录后优雅退出，交由容器 restart: unless-stopped / systemd Restart=on-failure 拉起。 */
process.on('uncaughtException', (e) => {
  console.error('[FATAL] 未捕获异常：', (e && e.stack) || e);
  try { server.close(() => process.exit(1)); } catch (err) {}
  setTimeout(() => process.exit(1), 3000).unref();
});
process.on('unhandledRejection', (e) => {
  console.error('[FATAL] 未处理的 Promise 拒绝：', (e && e.stack) || e);
});

server.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log('  PFD Editor Server Started (with API proxy)');
  console.log('========================================');
  console.log('  监听:    ' + HOST + ':' + PORT + (isExposed() ? '  （对外暴露）' : '  （仅本机）'));
  console.log('  Editor:  http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + '/editor');
  console.log('  Preview: http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + '/preview');
  console.log('  API:     /api/* -> ' + API_TARGET + '/api/*');
  console.log('  项目库:  ' + PROJECT_DIR);
  console.log('  鉴权:    ' + (API_TOKEN ? '已启用（X-PFD-Token）' : '未启用'));
  console.log('========================================');
  // 审计 3.1/3.2 的组合告警：对外监听 + 无鉴权 = 项目库对同网段任何人可读写删
  if (isExposed() && !API_TOKEN) {
    console.warn('  ⚠️  当前监听 ' + HOST + ' 且未设置 PFD_API_TOKEN：');
    console.warn('      /pfd-api/projects 对同网段任何人可列目录/读写/删除，请二选一：');
    console.warn('      1) 去掉 HOST（默认仅监听 127.0.0.1）；');
    console.warn('      2) 设置 PFD_API_TOKEN=<强随机串> 启用接口鉴权。');
  }
});
