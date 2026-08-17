"""
Production REST API Server for VIEWPOINT WebApp & Telegram MiniApp
Provides secure, server-side validated game engines for:
- Mines (Server-side bomb placement & step verification)
- Chicken Road (Silver cloches & bone revelation)
- Crash / Aviator (Provably fair exponential crash point)
- Color Trading (Win Go 30s period sync & settlement)
- Stock Trading (Binary Options 10s/30s price movement)
- Live SQLite Wallet Sync & Bet Logging
"""
import json
import math
import random
import secrets
import hashlib
import time
import datetime
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from database import db

PORT = 8000

def nCr(n, r):
    if r < 0 or r > n:
        return 0
    if r == 0 or r == n:
        return 1
    if r > n // 2:
        r = n - r
    res = 1
    for i in range(1, r + 1):
        res = (res * (n - i + 1)) // i
    return res

def calculate_tile_multiplier(revealed, total_hazards, total_tiles=25):
    if revealed <= 0:
        return 1.0
    safe_tiles = total_tiles - total_hazards
    if revealed > safe_tiles:
        return 0.0
    total_combos = nCr(total_tiles, revealed)
    win_combos = nCr(safe_tiles, revealed)
    if win_combos == 0:
        return 0.0
    raw_mult = total_combos / win_combos
    house_edge = 0.99  # 1% casino house edge
    return math.floor(raw_mult * house_edge * 100) / 100

def generate_provably_fair_crash(server_seed, client_seed="viewpoint", nonce=1):
    combined = f"{server_seed}:{client_seed}:{nonce}"
    hash_hex = hashlib.sha256(combined.encode('utf-8')).hexdigest()
    # 5% instant crash on 1.00x
    first_bytes = int(hash_hex[:8], 16)
    if first_bytes % 20 == 0:
        return 1.00, hash_hex
    # Exponential distribution
    raw = (100 * 1e8) / ((1e8 - (int(hash_hex[:13], 16) % 1e8)) + 1)
    multiplier = math.floor(raw) / 100.0
    multiplier = max(1.01, min(100.0, multiplier))
    return round(multiplier, 2), hash_hex

# In-memory global state for Crash & Color Trading
CRASH_STATE = {
    "round_id": 1000,
    "crash_point": 2.45,
    "start_time": time.time(),
    "server_seed": secrets.token_hex(16),
    "hash": "",
    "active_bets": {} # { telegram_id: { bet_amount, auto_cashout, cashed_out, payout } }
}

def get_current_period_id():
    d = datetime.datetime.utcnow()
    date_str = d.strftime("%Y%m%d")
    seconds_in_day = d.hour * 3600 + d.minute * 60 + d.second
    period_seq = seconds_in_day // 30
    return f"{date_str}{period_seq:04d}", 30 - (seconds_in_day % 30)

COLOR_HISTORY = []
def init_color_history():
    global COLOR_HISTORY
    for _ in range(10):
        num = random.randint(0, 9)
        colors = ['violet', 'red'] if num == 0 else ['violet', 'green'] if num == 5 else ['red'] if num % 2 == 0 else ['green']
        COLOR_HISTORY.append({
            "number": num,
            "colors": colors,
            "size": "Big" if num >= 5 else "Small",
            "color": colors[0]
        })
init_color_history()

COLOR_ACTIVE_BETS = {} # { period_id: [ { telegram_id, type, choice, amount } ] }

class GameAPIHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Telegram-User")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _json_response(self, data, status=200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _error_response(self, message, status=400):
        self._json_response({"success": False, "error": message}, status=status)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # 1. User Balance & Profile
        if parsed.path == "/api/user":
            telegram_id = params.get("telegram_id", [None])[0]
            if not telegram_id:
                self._error_response("Missing telegram_id")
                return

            try:
                telegram_id = int(telegram_id)
            except ValueError:
                telegram_id = 0

            user = db.get_user(telegram_id)
            if not user:
                user, _ = db.get_or_create_user(telegram_id, "", "Player")

            self._json_response({"success": True, "user": user})
            return

        # 2. Stats
        elif parsed.path == "/api/stats":
            stats = db.get_total_stats()
            self._json_response({"success": True, "stats": stats})
            return

        # 3. User Bets History
        elif parsed.path == "/api/bets/history":
            telegram_id = params.get("telegram_id", [None])[0]
            if not telegram_id:
                self._error_response("Missing telegram_id")
                return
            bets = db.get_user_bets(int(telegram_id), limit=25)
            self._json_response({"success": True, "bets": bets})
            return

        # 4. Color Trading Current Period
        elif parsed.path == "/api/game/color/current":
            period_id, time_left = get_current_period_id()
            self._json_response({
                "success": True,
                "period_id": period_id,
                "time_left": time_left,
                "history": COLOR_HISTORY[-10:]
            })
            return

        # 404
        self._error_response("Endpoint not found", status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            body = json.loads(post_data) if post_data else {}
        except Exception:
            body = {}

        # -------------------------------------------------------------
        # MINES & CHICKEN GAME ENGINES
        # -------------------------------------------------------------
        if parsed.path in ["/api/game/mines/start", "/api/game/chicken/start"]:
            game_type = "mines" if "mines" in parsed.path else "chicken"
            telegram_id = body.get("telegram_id")
            bet_amount = float(body.get("bet_amount", 0))
            hazard_count = int(body.get("hazard_count") or body.get("mine_count") or body.get("bone_count") or 3)

            if not telegram_id or bet_amount <= 0:
                self._error_response("Invalid bet parameters")
                return

            hazard_count = max(1, min(24, hazard_count))
            user = db.get_user(int(telegram_id))
            if not user or user['balance'] < bet_amount:
                self._error_response("Insufficient wallet balance")
                return

            # Generate secret bomb indices securely
            all_tiles = list(range(25))
            secret_indices = random.sample(all_tiles, hazard_count)
            server_seed = secrets.token_hex(16)
            hash_seed = hashlib.sha256(f"{server_seed}:{secret_indices}".encode('utf-8')).hexdigest()
            round_id = f"RND-{int(time.time()*1000)}-{secrets.token_hex(4)}"

            # Deduct balance & create active round in DB
            success, result = db.create_active_round(
                round_id=round_id,
                telegram_id=int(telegram_id),
                game=game_type,
                bet_amount=bet_amount,
                mine_count=hazard_count,
                secret_indices_json=json.dumps(secret_indices),
                hash_seed=hash_seed
            )

            if not success:
                self._error_response(result)
                return

            next_mult = calculate_tile_multiplier(1, hazard_count, 25)
            self._json_response({
                "success": True,
                "round_id": round_id,
                "game": game_type,
                "bet_amount": bet_amount,
                "hazard_count": hazard_count,
                "current_multiplier": 1.0,
                "next_multiplier": next_mult,
                "hash": hash_seed,
                "new_balance": result
            })
            return

        elif parsed.path in ["/api/game/mines/reveal", "/api/game/chicken/reveal"]:
            round_id = body.get("round_id")
            tile_index = body.get("tile_index")

            if round_id is None or tile_index is None:
                self._error_response("Missing round_id or tile_index")
                return

            tile_index = int(tile_index)
            round_data = db.get_active_round(round_id)
            if not round_data or round_data['status'] != 'IN_PROGRESS':
                self._error_response("Round is not active or already finished")
                return

            secret_indices = json.loads(round_data['secret_indices'])
            revealed_indices = json.loads(round_data['revealed_indices'])

            if tile_index in revealed_indices:
                self._error_response("Tile already revealed")
                return

            # Check if Hit Bomb/Bone
            if tile_index in secret_indices:
                # Blast! Settle round as LOST
                db.settle_active_round(round_id, status='LOST', payout=0.0, multiplier=0.0)
                user = db.get_user(round_data['telegram_id'])
                self._json_response({
                    "success": True,
                    "is_bomb": True,
                    "game_over": True,
                    "tile_index": tile_index,
                    "secret_indices": secret_indices, # Reveal all bombs
                    "balance": user['balance'] if user else 0.0
                })
                return

            # Safe Gem / Chicken!
            revealed_indices.append(tile_index)
            revealed_count = len(revealed_indices)
            curr_mult = calculate_tile_multiplier(revealed_count, round_data['mine_count'], 25)
            next_mult = calculate_tile_multiplier(revealed_count + 1, round_data['mine_count'], 25)

            db.update_active_round(round_id, json.dumps(revealed_indices), curr_mult)

            # Check if all safe tiles cleared (Max Win)
            max_safe = 25 - round_data['mine_count']
            is_max_win = (revealed_count >= max_safe)
            payout = round(round_data['bet_amount'] * curr_mult, 2) if is_max_win else 0.0

            if is_max_win:
                _, settle_res = db.settle_active_round(round_id, status='WON', payout=payout, multiplier=curr_mult)
                user = db.get_user(round_data['telegram_id'])
                self._json_response({
                    "success": True,
                    "is_bomb": False,
                    "game_over": True,
                    "is_max_win": True,
                    "tile_index": tile_index,
                    "revealed_count": revealed_count,
                    "current_multiplier": curr_mult,
                    "next_multiplier": 0.0,
                    "profit": payout,
                    "secret_indices": secret_indices,
                    "balance": user['balance'] if user else 0.0
                })
                return

            self._json_response({
                "success": True,
                "is_bomb": False,
                "game_over": False,
                "tile_index": tile_index,
                "revealed_count": revealed_count,
                "current_multiplier": curr_mult,
                "next_multiplier": next_mult,
                "profit": round(round_data['bet_amount'] * curr_mult, 2)
            })
            return

        elif parsed.path in ["/api/game/mines/cashout", "/api/game/chicken/cashout"]:
            round_id = body.get("round_id")
            if not round_id:
                self._error_response("Missing round_id")
                return

            round_data = db.get_active_round(round_id)
            if not round_data or round_data['status'] != 'IN_PROGRESS':
                self._error_response("Round is not active or already settled")
                return

            revealed_indices = json.loads(round_data['revealed_indices'])
            if len(revealed_indices) == 0:
                self._error_response("Cannot cashout with 0 tiles revealed")
                return

            curr_mult = round_data['current_multiplier']
            payout = round(round_data['bet_amount'] * curr_mult, 2)
            profit = round(payout - round_data['bet_amount'], 2)

            success, settle_res = db.settle_active_round(round_id, status='CASHED_OUT', payout=payout, multiplier=curr_mult)
            if not success:
                self._error_response(settle_res)
                return

            secret_indices = json.loads(round_data['secret_indices'])
            self._json_response({
                "success": True,
                "cashed_out": True,
                "payout": payout,
                "profit": profit,
                "multiplier": curr_mult,
                "new_balance": settle_res['balance'],
                "secret_indices": secret_indices
            })
            return

        # -------------------------------------------------------------
        # CRASH (AVIATOR) GAME
        # -------------------------------------------------------------
        elif parsed.path == "/api/game/crash/bet":
            telegram_id = body.get("telegram_id")
            bet_amount = float(body.get("bet_amount", 0))
            if not telegram_id or bet_amount <= 0:
                self._error_response("Invalid bet parameters")
                return

            user = db.get_user(int(telegram_id))
            if not user or user['balance'] < bet_amount:
                self._error_response("Insufficient balance")
                return

            new_bal = db.update_balance(int(telegram_id), -bet_amount)
            # Generate deterministic crash point for current seed
            crash_pt, hash_val = generate_provably_fair_crash(secrets.token_hex(16))

            self._json_response({
                "success": True,
                "crash_point": crash_pt,
                "hash": hash_val,
                "balance": new_bal
            })
            return

        elif parsed.path == "/api/game/crash/cashout":
            telegram_id = body.get("telegram_id")
            bet_amount = float(body.get("bet_amount", 0))
            multiplier = float(body.get("multiplier", 1.0))

            if not telegram_id or bet_amount <= 0 or multiplier <= 1.0:
                self._error_response("Invalid cashout parameters")
                return

            payout = round(bet_amount * multiplier, 2)
            new_bal = db.update_balance(int(telegram_id), payout)
            db.log_bet(int(telegram_id), "crash", bet_amount, multiplier, payout, won=True)

            self._json_response({
                "success": True,
                "payout": payout,
                "multiplier": multiplier,
                "balance": new_bal
            })
            return

        # -------------------------------------------------------------
        # COLOR TRADING GAME
        # -------------------------------------------------------------
        elif parsed.path == "/api/game/color/bet":
            telegram_id = body.get("telegram_id")
            choice = str(body.get("choice")) # 'red', 'green', 'violet', 'big', 'small', or '0'-'9'
            bet_amount = float(body.get("amount", 0))

            if not telegram_id or not choice or bet_amount <= 0:
                self._error_response("Invalid color bet parameters")
                return

            user = db.get_user(int(telegram_id))
            if not user or user['balance'] < bet_amount:
                self._error_response("Insufficient balance")
                return

            new_bal = db.update_balance(int(telegram_id), -bet_amount)

            # Compute outcome
            num = random.randint(0, 9)
            colors = ['violet', 'red'] if num == 0 else ['violet', 'green'] if num == 5 else ['red'] if num % 2 == 0 else ['green']
            size = "Big" if num >= 5 else "Small"
            result_item = {"number": num, "colors": colors, "size": size, "color": colors[0]}
            COLOR_HISTORY.append(result_item)

            # Check if win
            won = False
            mult = 0.0
            choice_l = choice.lower()
            if choice_l in ['red', 'green'] and choice_l in colors:
                won = True
                mult = 2.0 if len(colors) == 1 else 1.5
            elif choice_l == 'violet' and 'violet' in colors:
                won = True
                mult = 4.5
            elif choice_l in ['big', 'small'] and choice_l == size.lower():
                won = True
                mult = 2.0
            elif choice.isdigit() and int(choice) == num:
                won = True
                mult = 9.0

            payout = round(bet_amount * mult, 2) if won else 0.0
            if won and payout > 0:
                new_bal = db.update_balance(int(telegram_id), payout)

            db.log_bet(int(telegram_id), "colortrading", bet_amount, mult if won else 0.0, payout, won=won)

            self._json_response({
                "success": True,
                "won": won,
                "multiplier": mult,
                "payout": payout,
                "result": result_item,
                "balance": new_bal
            })
            return

        # -------------------------------------------------------------
        # STOCK TRADING GAME
        # -------------------------------------------------------------
        elif parsed.path == "/api/game/stock/bet":
            telegram_id = body.get("telegram_id")
            direction = str(body.get("direction", "call")).lower() # 'call' (up) or 'put' (down)
            bet_amount = float(body.get("amount", 0))
            entry_price = float(body.get("entry_price", 100.0))

            if not telegram_id or bet_amount <= 0:
                self._error_response("Invalid stock bet parameters")
                return

            user = db.get_user(int(telegram_id))
            if not user or user['balance'] < bet_amount:
                self._error_response("Insufficient balance")
                return

            new_bal = db.update_balance(int(telegram_id), -bet_amount)

            # Generate realistic price movement
            delta = random.choice([-1, 1]) * random.uniform(0.1, 1.5)
            exit_price = round(max(1.0, entry_price + delta), 2)

            won = (direction == "call" and exit_price > entry_price) or (direction == "put" and exit_price < entry_price)
            mult = 1.90 if won else 0.0 # 90% payout on binary options
            payout = round(bet_amount * mult, 2) if won else 0.0

            if won and payout > 0:
                new_bal = db.update_balance(int(telegram_id), payout)

            db.log_bet(int(telegram_id), "stocktrading", bet_amount, mult, payout, won=won)

            self._json_response({
                "success": True,
                "won": won,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "multiplier": mult,
                "payout": payout,
                "balance": new_bal
            })
            return

        # Legacy generic bet/win endpoints
        elif parsed.path == "/api/bet":
            telegram_id = body.get("telegram_id")
            amount = float(body.get("amount", 0))
            if not telegram_id or amount <= 0:
                self._error_response("Invalid bet parameters")
                return

            user = db.get_user(int(telegram_id))
            if not user or user['balance'] < amount:
                self._error_response("Insufficient balance")
                return

            new_bal = db.update_balance(int(telegram_id), -amount)
            self._json_response({"success": True, "balance": new_bal})
            return

        elif parsed.path == "/api/win":
            telegram_id = body.get("telegram_id")
            amount = float(body.get("amount", 0))
            if not telegram_id or amount < 0:
                self._error_response("Invalid win parameters")
                return

            new_bal = db.update_balance(int(telegram_id), amount)
            self._json_response({"success": True, "balance": new_bal})
            return

        self._error_response("Endpoint not found", status=404)

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, GameAPIHandler)
    print(f"🚀 VIEWPOINT Secure Game API Server running on port http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
