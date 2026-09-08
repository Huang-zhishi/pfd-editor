param([int]$Port = 8090)
$ErrorActionPreference = 'Continue'
# 轻量静态服务器（无 API 代理，实时数据功能不可用——完整功能请用 node server.js）
$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix"
$ct = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.png'='image/png'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.otf'='font/otf'; '.ttf'='font/ttf'; '.gif'='image/gif' }
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $resp = $ctx.Response
    $url = $req.Url.AbsolutePath.TrimStart('/')
    if ($url -eq '') { $url = 'index.html' }
    $file = Join-Path $root ($url -replace '/','\')
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $resp.ContentType = if ($ct.ContainsKey($ext)) { $ct[$ext] } else { 'application/octet-stream' }
      $resp.ContentLength64 = $bytes.Length
      $resp.AddHeader('Access-Control-Allow-Origin','*')
      if ($req.HttpMethod -ne 'HEAD') {
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
      }
      $resp.StatusCode = 200
      Write-Host "200 $url"
    } else {
      $resp.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $resp.ContentLength64 = $body.Length
      if ($req.HttpMethod -ne 'HEAD') { $resp.OutputStream.Write($body,0,$body.Length) }
      Write-Host "404 $url"
    }
    $resp.Close()
  } catch {
    Write-Host "ERR $_"
  }
}
