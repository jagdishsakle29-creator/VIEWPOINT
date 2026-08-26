#!/usr/bin/env python3
"""
SHASAH Local Development & API Server
Serves static assets and provides API endpoints for wallet, deposits, and game sync.
"""
import os
import sys
import json
import mimetypes
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000
WEB_ROOT = os.path.dirname(os.path.abspath(__file__))

class DevServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # Handle API routes
        if parsed.path.startswith('/api/'):
            params = urllib.parse.parse_qs(parsed.query)
            action = params.get('action', [''])[0]
            
            if 'balance' in parsed.path or action == 'get_balance':
                return self._send_json({
                    "success": True,
                    "balance": 1000.00,
                    "user": {"userId": "guest_local", "username": "Player", "balance": 1000.00}
                })
            elif action in ['admin_get_pending', 'get_members']:
                return self._send_json({
                    "success": True,
                    "deposits": [],
                    "withdrawals": [],
                    "members": []
                })
            else:
                return self._send_json({"success": True, "message": "API OK"})

        # Serve static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            body = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            body = {}

        if parsed.path.startswith('/api/'):
            # Simulate deposit / wallet / sync
            if 'deposit' in parsed.path or 'sync' in parsed.path:
                amount = float(body.get('amount') or 100)
                utr = body.get('utr') or 'DEMO_UTR_12345'
                return self._send_json({
                    "success": True,
                    "message": "Deposit recorded successfully",
                    "deposit": {
                        "id": f"DEP-{os.urandom(4).hex()}",
                        "amount": amount,
                        "utr": utr,
                        "status": "PENDING"
                    }
                })
            elif 'withdraw' in parsed.path:
                amount = float(body.get('amount') or 200)
                return self._send_json({
                    "success": True,
                    "message": "Withdrawal request received",
                    "withdrawal": {
                        "id": f"WTH-{os.urandom(4).hex()}",
                        "amount": amount,
                        "status": "PENDING"
                    }
                })
            else:
                return self._send_json({"success": True, "result": body})

        self._send_json({"success": True})

if __name__ == '__main__':
    print(f"🚀 Starting SHASAH Local Dev Server on http://localhost:{PORT}")
    server = HTTPServer(('0.0.0.0', PORT), DevServerHandler)
    server.serve_forever()
