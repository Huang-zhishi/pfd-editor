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
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + filePath);
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    }
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
  const reqPath = decodeURIComponent(req.url.split('?')[0]);

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
  
  let filePath = path.join(ROOT, urlPath);
  
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

server.listen(PORT, () => {
  console.log('========================================');
  console.log('  PFD Editor Server Started (with API proxy)');
  console.log('========================================');
  console.log('  Editor:  http://localhost:' + PORT + '/editor');
  console.log('  Preview: http://localhost:' + PORT + '/preview');
  console.log('  API:     /api/* -> ' + API_TARGET + '/api/*');
  console.log('  项目库:  ' + PROJECT_DIR);
  console.log('========================================');
});
