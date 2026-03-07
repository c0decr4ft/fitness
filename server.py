#!/usr/bin/env python3
"""FORGE Fitness App Server - serves the app and syncs accounts across devices."""
import json, os, threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forge_cloud.json')
lock = threading.Lock()

def load_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

class ForgeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self._api_get()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self._api_post()

    do_PUT = do_POST

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def _json_response(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body)

    def _api_get(self):
        key = self.path[5:]
        with lock:
            data = load_data()
        if key == 'directory':
            self._json_response(data.get('_dir', {}))
        elif key.startswith('account/'):
            username = key[8:]
            acc = data.get('accounts', {}).get(username)
            self._json_response(acc if acc else {}, 200 if acc else 404)
        elif key == 'all':
            self._json_response(data.get('_dir', {}))
        else:
            self._json_response({'error': 'not found'}, 404)

    def _api_post(self):
        key = self.path[5:]
        body = self._read_body()
        with lock:
            data = load_data()
            if key.startswith('account/'):
                username = key[8:]
                if 'accounts' not in data:
                    data['accounts'] = {}
                data['accounts'][username] = body
                if '_dir' not in data:
                    data['_dir'] = {}
                data['_dir'][username] = True
                save_data(data)
                self._json_response({'ok': True, 'user': username})
            else:
                self._json_response({'error': 'bad request'}, 400)

    def log_message(self, fmt, *args):
        if '/api/' in (args[0] if args else ''):
            super().log_message(fmt, *args)

if __name__ == '__main__':
    import socket
    port = 8765
    ip = ''
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
    except:
        ip = 'localhost'

    server = HTTPServer(('0.0.0.0', port), ForgeHandler)
    print(f'\n  FORGE Fitness Server running!')
    print(f'  Local:   http://localhost:{port}')
    print(f'  Network: http://{ip}:{port}')
    print(f'\n  Open the Network URL on your phone to use the app!')
    print(f'  All accounts are shared between devices.\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
