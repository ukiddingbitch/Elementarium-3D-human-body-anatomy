"""Local-only static server; standard library, no dependency installation."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import functools
import sys
import webbrowser
import urllib.parse

BASE = Path(__file__).resolve().parent.parent
ROOT = BASE / 'content' if (BASE / 'content' / 'index.html').is_file() else BASE

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
        '.js':'text/javascript', '.mjs':'text/javascript',
        '.wasm':'application/wasm', '.glb':'model/gltf-binary',
        '.json':'application/json', '.woff2':'font/woff2'}

    def guess_type(self, path):
        name = Path(path).name
        if name in ('LICENSE', 'NOTICE') or name.endswith('-LICENSE'):
            return 'text/plain; charset=utf-8'
        return super().guess_type(path)

    def do_GET(self):
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        # Runtime and launcher are not part of the web application.
        if any(part.startswith('.') or part in ('runtime','source','tools') for part in path.split('/')):
            self.send_error(404)
            return
        if path.endswith('/') and path not in ('/', '/anatomy/'):
            self.send_error(404)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Elementarium', 'browser-3.3.1')
        self.send_header('X-Content-Type-Options', 'nosniff')
        # Enforce local loading: all scripts, fonts, models and data are bundled.
        self.send_header('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'")
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv)>1 else 0
    server = ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Handler, directory=str(ROOT)))
    url = f'http://127.0.0.1:{server.server_port}/'
    print('Elementarium', flush=True)
    print('Local: '+url, flush=True)
    print('Elementarium is ready.', flush=True)
    if '--no-browser' not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

