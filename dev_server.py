#!/usr/bin/env python3
"""
VIEWPOINT Local Development & API Server
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
STATE_FILE = os.path.join(WEB_ROOT, 'data', 'dev_state.json')

def load_dev_state():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return {"wallets": {}, "deposits": [], "withdrawals": []}

def save_dev_state(state):
    try:
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2)
    except Exception:
        pass

class DevServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # Handle API routes
        if parsed.path.startswith('/api/'):
            params = urllib.parse.parse_qs(parsed.query)
            action = params.get('action', [''])[0]
            uid = params.get('userId', [None])[0] or params.get('telegram_id', [None])[0] or self.headers.get('X-User-Id') or 'guest_default'
            
            state = load_dev_state()
            user_wallet = state["wallets"].get(uid)
            
            if 'balance' in parsed.path or action == 'get_balance' or parsed.path == '/api/user':
                current_bal = user_wallet.get('balance', 0.00) if user_wallet else 0.00
                return self._send_json({
                    "success": True,
                    "balance": current_bal,
                    "user": {"userId": uid, "username": "Player", "balance": current_bal}
                })
            elif action in ['admin_get_pending', 'get_members']:
                return self._send_json({
                    "success": True,
                    "deposits": state.get("deposits", []),
                    "withdrawals": state.get("withdrawals", []),
                    "members": list(state.get("wallets", {}).values())
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
            action = body.get('action', '')
            uid = body.get('userId') or body.get('telegram_id') or self.headers.get('X-User-Id') or 'guest_default'
            state = load_dev_state()
            init_bal = 0.00
            try:
                if body.get('balance') is not None:
                    init_bal = float(body.get('balance'))
            except (ValueError, TypeError):
                init_bal = 0.00
            if uid not in state["wallets"]:
                state["wallets"][uid] = {"userId": uid, "balance": init_bal, "currency": "₹"}

            wallet = state["wallets"][uid]

            if action in ['update_balance', 'sync_balance', 'set_balance']:
                if 'balance' in body and body['balance'] is not None:
                    try:
                        wallet['balance'] = round(float(body['balance']), 2)
                        save_dev_state(state)
                    except (ValueError, TypeError):
                        pass
                return self._send_json({"success": True, "balance": wallet['balance']})

            if 'dragontiger' in parsed.path or action in ['dragontiger_play', 'dt_play']:
                import random
                suits = [{'name': 'spades', 'symbol': '♠', 'isRed': False}, {'name': 'hearts', 'symbol': '♥', 'isRed': True}, {'name': 'diamonds', 'symbol': '♦', 'isRed': True}, {'name': 'clubs', 'symbol': '♣', 'isRed': False}]
                ranks = [{'name': 'A', 'value': 1}, {'name': '2', 'value': 2}, {'name': '3', 'value': 3}, {'name': '4', 'value': 4}, {'name': '5', 'value': 5}, {'name': '6', 'value': 6}, {'name': '7', 'value': 7}, {'name': '8', 'value': 8}, {'name': '9', 'value': 9}, {'name': '10', 'value': 10}, {'name': 'J', 'value': 11}, {'name': 'Q', 'value': 12}, {'name': 'K', 'value': 13}]
                d_rank = random.choice(ranks)
                d_suit = random.choice(suits)
                t_rank = random.choice(ranks)
                t_suit = random.choice(suits)
                winner = 'D' if d_rank['value'] > t_rank['value'] else ('T' if t_rank['value'] > d_rank['value'] else 'TIE')
                bets = body.get('bets', {})
                payout = 0
                if bets.get('dragon') and winner == 'D':
                    payout += bets['dragon'] * 2.0
                elif bets.get('dragon') and winner == 'TIE':
                    payout += bets['dragon'] * 0.5
                if bets.get('tiger') and winner == 'T':
                    payout += bets['tiger'] * 2.0
                elif bets.get('tiger') and winner == 'TIE':
                    payout += bets['tiger'] * 0.5
                if bets.get('tie') and winner == 'TIE':
                    payout += bets['tie'] * 12.0
                wallet['balance'] = round(wallet.get('balance', 0) + payout, 2)
                save_dev_state(state)
                return self._send_json({
                    "success": True,
                    "dragon_card": {
                        "rank": d_rank['name'],
                        "value": d_rank['value'],
                        "suit": d_suit['symbol'],
                        "suitName": d_suit['name'],
                        "isRed": d_suit['isRed'],
                        "isBig": d_rank['value'] >= 8,
                        "isSmall": d_rank['value'] <= 6,
                        "isSeven": d_rank['value'] == 7
                    },
                    "tiger_card": {
                        "rank": t_rank['name'],
                        "value": t_rank['value'],
                        "suit": t_suit['symbol'],
                        "suitName": t_suit['name'],
                        "isRed": t_suit['isRed'],
                        "isBig": t_rank['value'] >= 8,
                        "isSmall": t_rank['value'] <= 6,
                        "isSeven": t_rank['value'] == 7
                    },
                    "winner": winner,
                    "payout": payout,
                    "balance": wallet['balance']
                })

            # Real casino deposit handling: PENDING upon submission, balance ONLY added when approved by admin
            if action in ['submit_deposit', 'create_deposit']:
                amount = float(body.get('amount') or 0)
                utr = body.get('utr') or ''
                upi_val = body.get('upiId') or 'adrenox1@axl'
                dep_id = body.get('id') or f"DEP-{os.urandom(4).hex().upper()}"
                dep_obj = {
                    "id": dep_id,
                    "amount": amount,
                    "utr": utr,
                    "upiId": upi_val,
                    "status": "PENDING",
                    "userId": uid
                }
                state.setdefault("deposits", []).append(dep_obj)
                save_dev_state(state)
                return self._send_json({
                    "success": True,
                    "message": "Deposit submitted for admin approval",
                    "deposit": dep_obj,
                    "balance": wallet['balance']
                })
            elif action in ['approve_dep', 'admin_approve_deposit', 'approve_deposit']:
                dep_id = body.get('id') or body.get('deposit_id')
                amt_override = body.get('amount') or body.get('amt')
                dep_found = None
                for d in state.get("deposits", []):
                    if d.get("id") == dep_id:
                        dep_found = d
                        break
                dep_amount = float(amt_override if amt_override is not None else (dep_found.get('amount', 0) if dep_found else 0))
                if dep_found:
                    dep_found['status'] = 'APPROVED'
                    dep_found['amount'] = dep_amount
                target_uid = (dep_found.get('userId') if dep_found else None) or body.get('userId') or uid
                if target_uid not in state["wallets"]:
                    state["wallets"][target_uid] = {"userId": target_uid, "balance": 0.0, "currency": "₹"}
                target_wallet = state["wallets"][target_uid]
                target_wallet['balance'] = round(target_wallet.get('balance', 0) + dep_amount, 2)
                save_dev_state(state)
                return self._send_json({
                    "success": True,
                    "message": "Deposit approved and credited",
                    "balance": target_wallet['balance']
                })
            elif action in ['reject_dep', 'admin_reject_deposit', 'reject_deposit']:
                dep_id = body.get('id') or body.get('deposit_id')
                for d in state.get("deposits", []):
                    if d.get("id") == dep_id:
                        d['status'] = 'REJECTED'
                        break
                save_dev_state(state)
                return self._send_json({"success": True, "message": "Deposit rejected"})
            elif 'withdraw' in parsed.path or action == 'withdraw':
                amount = float(body.get('amount') or 200)
                if wallet.get('balance', 0) >= amount:
                    wallet['balance'] = round(wallet['balance'] - amount, 2)
                wth_obj = {
                    "id": f"WTH-{os.urandom(4).hex()}",
                    "amount": amount,
                    "status": "APPROVED",
                    "userId": uid
                }
                state.setdefault("withdrawals", []).append(wth_obj)
                save_dev_state(state)
                return self._send_json({
                    "success": True,
                    "message": "Withdrawal request processed",
                    "withdrawal": wth_obj,
                    "balance": wallet['balance']
                })
            else:
                if 'balance' in body:
                    wallet['balance'] = round(float(body['balance']), 2)
                    save_dev_state(state)
                return self._send_json({"success": True, "balance": wallet.get('balance', 0.0), "result": body})

        self._send_json({"success": True})

if __name__ == '__main__':
    print(f"🚀 Starting VIEWPOINT Local Dev Server on http://localhost:{PORT}")
    server = HTTPServer(('0.0.0.0', PORT), DevServerHandler)
    server.serve_forever()
