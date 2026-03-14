#!/usr/bin/env python3
"""FORGE Fitness App Server - serves the app and syncs accounts to the cloud."""
import json, os, threading, urllib.request, urllib.error
from urllib.parse import parse_qs
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'forge_cloud.json')
# React build output; use client/dist if it exists, else serve from project root (dev)
CLIENT_DIST = os.path.join(BASE_DIR, 'client', 'dist')
CLOUD_DIR_ID = '019cc742-cdc5-7356-b86c-b65689ea51fd'
BLOB_API = 'https://jsonblob.com/api/jsonBlob'
lock = threading.Lock()


def load_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return {}


def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)


def blob_get(blob_id):
    """GET a jsonblob by ID (server-side, no CORS issues)."""
    try:
        req = urllib.request.Request(f'{BLOB_API}/{blob_id}',
                                     headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f'  [cloud] GET blob {blob_id} failed: {e}')
        return None


def blob_create(obj):
    """POST to create a new jsonblob. Returns the blob ID."""
    try:
        body = json.dumps(obj).encode()
        req = urllib.request.Request(BLOB_API, data=body, method='POST',
                                     headers={'Content-Type': 'application/json',
                                              'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            loc = resp.getheader('Location') or resp.getheader('X-jsonblob-Id') or ''
            blob_id = loc.rsplit('/', 1)[-1] if '/' in loc else loc
            if not blob_id:
                blob_id = resp.getheader('X-jsonblob-Id', '')
            return blob_id if blob_id else None
    except Exception as e:
        print(f'  [cloud] CREATE blob failed: {e}')
        return None


def blob_put(blob_id, obj):
    """PUT to update an existing jsonblob."""
    try:
        body = json.dumps(obj).encode()
        req = urllib.request.Request(f'{BLOB_API}/{blob_id}', data=body, method='PUT',
                                     headers={'Content-Type': 'application/json',
                                              'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        print(f'  [cloud] PUT blob {blob_id} failed: {e}')
        return False


def cloud_get_directory():
    """Read the cloud directory (username → blob_id mapping)."""
    data = blob_get(CLOUD_DIR_ID)
    return data if data and isinstance(data, dict) else {'_forge_dir': True}


def cloud_save_directory(directory):
    """Write the cloud directory back."""
    return blob_put(CLOUD_DIR_ID, directory)


def cloud_upload_account(username, account_data):
    """Upload an account to the cloud. Returns True on success."""
    directory = cloud_get_directory()
    blob_id = directory.get(username)

    if blob_id:
        ok = blob_put(blob_id, account_data)
        if ok:
            print(f'  [cloud] Updated {username} (blob {blob_id})')
        return ok
    else:
        blob_id = blob_create(account_data)
        if blob_id:
            directory[username] = blob_id
            cloud_save_directory(directory)
            print(f'  [cloud] Created {username} → blob {blob_id}')
            return True
        return False


def cloud_download_account(username):
    """Download an account from the cloud by username. Returns dict or None."""
    directory = cloud_get_directory()
    blob_id = directory.get(username)
    if not blob_id or blob_id is True:
        return None
    acc = blob_get(blob_id)
    if acc and isinstance(acc, dict) and acc.get('u') == username:
        return acc
    return None


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
            self._serve_static()

    def _serve_static(self):
        """Serve React build from client/dist when built; else fall back to SimpleHTTPRequestHandler."""
        if not os.path.isdir(CLIENT_DIST):
            # No React build: use default file serving (original index.html, etc.)
            super().do_GET()
            return
        path = self.path.split('?')[0]
        path = path.lstrip('/') or 'index.html'
        filepath = os.path.join(CLIENT_DIST, path)
        if os.path.isfile(filepath):
            self.send_response(200)
            ext = os.path.splitext(path)[1]
            ctype = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.ico': 'image/x-icon',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
            }.get(ext, 'application/octet-stream')
            self.send_header('Content-Type', ctype)
            self.end_headers()
            with open(filepath, 'rb') as f:
                self.wfile.write(f.read())
        else:
            # SPA fallback: serve index.html for client-side routing
            index_path = os.path.join(CLIENT_DIST, 'index.html')
            if os.path.isfile(index_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                with open(index_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404)

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
        path = self.path.split('?')[0].rstrip('/')
        key = path[5:] if len(path) > 5 else ''

        if key == 'health':
            self._json_response({'ok': True, 'cloud': True})
            return

        if key == 'users':
            qs = parse_qs(
                self.path.split('?', 1)[1] if '?' in self.path else ''
            )
            query = (qs.get('q', [''])[0] or '').strip().lower()
            usernames = set()
            directory = cloud_get_directory()
            for u in directory.keys():
                if isinstance(u, str) and not u.startswith('_'):
                    usernames.add(u)
            with lock:
                data = load_data()
            for u in data.get('accounts', {}).keys():
                if isinstance(u, str) and not u.startswith('_'):
                    usernames.add(u)
            for p in data.get('community_posts', []):
                u = p.get('user') if isinstance(p, dict) else None
                if u and isinstance(u, str) and not u.startswith('_'):
                    usernames.add(u)
            usernames = [
                u for u in usernames
                if not query or query in u.lower()
            ]
            usernames.sort(key=str.lower)
            self._json_response({'users': usernames})
            return

        if key == 'community/feed':
            with lock:
                data = load_data()
            posts = data.get('community_posts', [])
            self._json_response({'posts': posts[:100]})
            return

        if key.startswith('account/'):
            username = urllib.request.unquote(key[8:])

            with lock:
                data = load_data()
            local_acc = data.get('accounts', {}).get(username)

            if local_acc:
                self._json_response(local_acc)
                return

            cloud_acc = cloud_download_account(username)
            if cloud_acc:
                with lock:
                    data = load_data()
                    if 'accounts' not in data:
                        data['accounts'] = {}
                    data['accounts'][username] = cloud_acc
                    save_data(data)
                self._json_response(cloud_acc)
                print(f'  [sync] Fetched {username} from cloud → cached locally')
                return

            self._json_response({'error': 'not found'}, 404)
            return

        self._json_response({'error': 'not found'}, 404)

    def _api_post(self):
        path = self.path.split('?')[0].rstrip('/')
        key = path[5:] if len(path) > 5 else ''
        body = self._read_body()

        if key.startswith('account/'):
            username = urllib.request.unquote(key[8:])

            with lock:
                data = load_data()
                if 'accounts' not in data:
                    data['accounts'] = {}
                data['accounts'][username] = body
                save_data(data)

            threading.Thread(target=cloud_upload_account, args=(username, body),
                             daemon=True).start()

            self._json_response({'ok': True, 'user': username})
            return

        if key == 'community/post':
            post = body
            if not isinstance(post, dict) or not post.get('user') or not post.get('ts'):
                self._json_response({'error': 'bad request'}, 400)
                return
            with lock:
                data = load_data()
                if 'community_posts' not in data:
                    data['community_posts'] = []
                data['community_posts'].insert(0, post)
                data['community_posts'] = data['community_posts'][:200]
                save_data(data)
            self._json_response({'ok': True})
            return

        self._json_response({'error': 'bad request'}, 400)

    def log_message(self, fmt, *args):
        msg = args[0] if args else ''
        if '/api/' in msg:
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
    except Exception:
        ip = 'localhost'

    print()
    print('  ┌─────────────────────────────────────────┐')
    print('  │       FORGE Fitness Server running!      │')
    print('  ├─────────────────────────────────────────┤')
    print(f'  │  Local:   http://localhost:{port}          │')
    print(f'  │  Network: http://{ip}:{port}       │')
    print('  ├─────────────────────────────────────────┤')
    print('  │  Accounts sync to the cloud             │')
    print('  │  automatically via jsonblob.com         │')
    print('  └─────────────────────────────────────────┘')
    print()

    # Sync all existing local accounts to the cloud on startup
    with lock:
        startup_data = load_data()
    accounts = startup_data.get('accounts', {})
    if accounts:
        print(f'  Syncing {len(accounts)} local account(s) to cloud...')
        for uname, acc in accounts.items():
            ok = cloud_upload_account(uname, acc)
            status = '✓' if ok else '✗'
            print(f'    {status} {uname}')
        print()

    server = HTTPServer(('0.0.0.0', port), ForgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
