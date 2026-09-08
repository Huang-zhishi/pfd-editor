/* ============================================================
 * PFD Editor · 本地开发服务器（server.js）
 *   - 静态文件服务（项目根目录，含 /editor /preview /demo 别名）
 *   - /api/* 反向代理到后端传感器服务，绕过浏览器 CORS 限制
 * 配置（环境变量，可选）：
 *   PORT        监听端口，默认 8090
 *   API_TARGET  后端地址，默认 http://192.168.1.78
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
  '/demo': '/demo.html',
};

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
  // API 代理
  if (req.url.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      handleOptions(req, res);
    } else {
      proxyRequest(req, res);
    }
    return;
  }

  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  
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
  console.log('  Demo:    http://localhost:' + PORT + '/demo');
  console.log('  Preview: http://localhost:' + PORT + '/preview');
  console.log('  API:     /api/* -> ' + API_TARGET + '/api/*');
  console.log('========================================');
});
