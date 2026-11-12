const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wasm':'application/wasm','.glb':'model/gltf-binary','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const CSP = "default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'";

function createBrowserServer(root = path.resolve(__dirname, '../content')) {
  return http.createServer((request, response) => {
    if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405, {'Allow':'GET, HEAD'}).end(); return;}
    let pathname;
    try {pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);} catch {response.writeHead(400).end(); return;}
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part=>part.startsWith('.'))) {response.writeHead(404).end(); return;}
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {response.writeHead(404).end(); return;}
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {response.writeHead(404).end(); return;}
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'text/plain; charset=utf-8',
        'Content-Length': stat.size,
        'Cache-Control':'no-store',
        'Content-Security-Policy':CSP,
        'X-Content-Type-Options':'nosniff',
        'X-Elementarium':'browser-3.3.0'
      });
      if (request.method==='HEAD') {response.end(); return;}
      fs.createReadStream(file).on('error', ()=>response.destroy()).pipe(response);
    });
  });
}

if (require.main === module) {
  const args = process.argv.slice(2), index = args.indexOf('--port');
  const port = index < 0 ? 17868 : Number(args[index+1]);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid port.');
  const server = createBrowserServer();
  server.on('error', error=>{console.error(`Cannot start browser server: ${error.message}\nUse npm run browser -- --port 17869 to select another port.`); process.exitCode=1;});
  server.listen(port, '127.0.0.1', ()=>{
    const url = `http://127.0.0.1:${server.address().port}/`;
    console.log(`Elementarium: ${url}\nPress Ctrl+C to stop.`);
    if (!args.includes('--no-open')) {
      const command = process.platform==='win32' ? 'rundll32.exe' : process.platform==='darwin' ? 'open' : 'xdg-open';
      const parameters = process.platform==='win32' ? ['url.dll,FileProtocolHandler', url] : [url];
      const opener = spawn(command, parameters, {stdio:'ignore', windowsHide:true, detached:true});
      opener.on('error', ()=>console.log(`Open ${url} in your browser.`));
      opener.unref();
    }
  });
}
module.exports = {createBrowserServer};
