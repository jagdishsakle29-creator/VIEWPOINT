"""
SQLite Database Manager for VIEWPOINT Telegram Bot & Web Game
Stores users, persistent balances, referrals, deposits, withdrawals, and bet logs.
"""
import sqlite3
import datetime
from pathlib import Path
from config import DB_PATH, DAILY_BONUS_AMOUNT, REFERRAL_BONUS_AMOUNT

class Database:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    telegram_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    balance REAL DEFAULT 1000.0,
                    referred_by INTEGER,
                    total_deposited REAL DEFAULT 0.0,
                    total_withdrawn REAL DEFAULT 0.0,
                    last_daily_claim TEXT,
                    is_banned INTEGER DEFAULT 0,
                    joined_at TEXT
                )
            """)

            # Deposits table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS deposits (
                    id TEXT PRIMARY KEY,
                    telegram_id INTEGER,
                    amount REAL,
                    utr TEXT,
                    upi_id TEXT,
                    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
                    created_at TEXT,
                    updated_at TEXT,
                    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
                )
            """)

            # Withdrawals table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS withdrawals (
                    id TEXT PRIMARY KEY,
                    telegram_id INTEGER,
                    amount REAL,
                    fee REAL,
                    net_payout REAL,
                    receiver TEXT,
                    channel TEXT DEFAULT 'UPI',
                    status TEXT DEFAULT 'PENDING', -- PENDING, PAID, REJECTED
                    created_at TEXT,
                    updated_at TEXT,
                    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
                )
            """)

            # Bet logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bets (
                    id TEXT PRIMARY KEY,
                    telegram_id INTEGER,
                    game TEXT,
                    bet_amount REAL,
                    multiplier REAL,
                    payout REAL,
                    won INTEGER,
                    created_at TEXT,
                    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
                )
            """)

            # Active Game Rounds table (Server-side validated state)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS active_games (
                    round_id TEXT PRIMARY KEY,
                    telegram_id INTEGER,
                    game TEXT,
                    bet_amount REAL,
                    mine_count INTEGER,
                    secret_indices TEXT, -- JSON array of hidden bomb indices
                    revealed_indices TEXT, -- JSON array of revealed safe tiles
                    current_multiplier REAL DEFAULT 1.0,
                    hash_seed TEXT,
                    status TEXT DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, WON, LOST, CASHED_OUT
                    created_at TEXT,
                    updated_at TEXT,
                    FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
                )
            """)
            conn.commit()

    def get_or_create_user(self, telegram_id, username="", first_name="", referrer_id=None):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
            user = cursor.fetchone()

            if user:
                # Update username / first_name if changed
                cursor.execute("""
                    UPDATE users 
                    SET username = ?, first_name = ? 
                    WHERE telegram_id = ?
                """, (username, first_name, telegram_id))
                conn.commit()
                return dict(user), False

            # New user registration
            valid_referrer = None
            if referrer_id and referrer_id != telegram_id:
                cursor.execute("SELECT telegram_id FROM users WHERE telegram_id = ?", (referrer_id,))
                if cursor.fetchone():
                    valid_referrer = referrer_id

            initial_balance = 1000.0  # Starting demo/welcome balance
            cursor.execute("""
                INSERT INTO users (telegram_id, username, first_name, balance, referred_by, joined_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (telegram_id, username, first_name, initial_balance, valid_referrer, now))
            
            # Reward referrer if exists
            if valid_referrer:
                cursor.execute("""
                    UPDATE users 
                    SET balance = balance + ? 
                    WHERE telegram_id = ?
                """, (REFERRAL_BONUS_AMOUNT, valid_referrer))

            conn.commit()

            cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
            new_user = cursor.fetchone()
            return dict(new_user), True

    def get_user(self, telegram_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_balance(self, telegram_id, amount_delta):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users 
                SET balance = MAX(0, balance + ?) 
                WHERE telegram_id = ?
            """, (amount_delta, telegram_id))
            conn.commit()
            cursor.execute("SELECT balance FROM users WHERE telegram_id = ?", (telegram_id,))
            row = cursor.fetchone()
            return row['balance'] if row else 0.0

    def claim_daily_bonus(self, telegram_id):
        now = datetime.datetime.utcnow()
        now_str = now.isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT balance, last_daily_claim FROM users WHERE telegram_id = ?", (telegram_id,))
            user = cursor.fetchone()
            if not user:
                return False, "User not found"

            last_claim_str = user['last_daily_claim']
            if last_claim_str:
                last_claim = datetime.datetime.fromisoformat(last_claim_str)
                diff = (now - last_claim).total_seconds()
                if diff < 86400: # 24 hours
                    remaining_hours = int((86400 - diff) // 3600)
                    remaining_mins = int(((86400 - diff) % 3600) // 60)
                    return False, f"Aap pehle hi claim kar chuke hain! Agla bonus {remaining_hours}h {remaining_mins}m baad milega."

            cursor.execute("""
                UPDATE users 
                SET balance = balance + ?, last_daily_claim = ? 
                WHERE telegram_id = ?
            """, (DAILY_BONUS_AMOUNT, now_str, telegram_id))
            conn.commit()
            return True, f"🎉 Badhai ho! Aapko ₹{DAILY_BONUS_AMOUNT:.2f} Daily Bonus mil gaya!"

    def get_referral_stats(self, telegram_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE referred_by = ?", (telegram_id,))
            count = cursor.fetchone()['count']
            earnings = count * REFERRAL_BONUS_AMOUNT
            return {"count": count, "earnings": earnings}

    def create_deposit_request(self, deposit_id, telegram_id, amount, utr, upi_id):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO deposits (id, telegram_id, amount, utr, upi_id, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)
            """, (deposit_id, telegram_id, amount, utr, upi_id, now, now))
            conn.commit()

    def get_deposit(self, deposit_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM deposits WHERE id = ?", (deposit_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def approve_deposit(self, deposit_id):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM deposits WHERE id = ? AND status = 'PENDING'", (deposit_id,))
            dep = cursor.fetchone()
            if not dep:
                return False, "Deposit request not found or already processed"

            cursor.execute("UPDATE deposits SET status = 'APPROVED', updated_at = ? WHERE id = ?", (now, deposit_id))
            cursor.execute("""
                UPDATE users 
                SET balance = balance + ?, total_deposited = total_deposited + ? 
                WHERE telegram_id = ?
            """, (dep['amount'], dep['amount'], dep['telegram_id']))
            conn.commit()
            return True, dep

    def reject_deposit(self, deposit_id):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM deposits WHERE id = ? AND status = 'PENDING'", (deposit_id,))
            dep = cursor.fetchone()
            if not dep:
                return False, "Deposit request not found or already processed"

            cursor.execute("UPDATE deposits SET status = 'REJECTED', updated_at = ? WHERE id = ?", (now, deposit_id))
            conn.commit()
            return True, dep

    def create_withdrawal_request(self, withdraw_id, telegram_id, amount, receiver, channel="UPI"):
        now = datetime.datetime.utcnow().isoformat()
        fee = round(amount * 0.08, 2)
        net_payout = round(amount - fee, 2)

        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Deduct balance first
            cursor.execute("SELECT balance FROM users WHERE telegram_id = ?", (telegram_id,))
            user = cursor.fetchone()
            if not user or user['balance'] < amount:
                return False, "Insufficient balance"

            cursor.execute("UPDATE users SET balance = balance - ? WHERE telegram_id = ?", (amount, telegram_id))
            cursor.execute("""
                INSERT INTO withdrawals (id, telegram_id, amount, fee, net_payout, receiver, channel, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
            """, (withdraw_id, telegram_id, amount, fee, net_payout, receiver, channel, now, now))
            conn.commit()
            return True, {"id": withdraw_id, "amount": amount, "fee": fee, "net_payout": net_payout, "receiver": receiver}

    def get_withdrawal(self, withdraw_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM withdrawals WHERE id = ?", (withdraw_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def approve_withdrawal(self, withdraw_id):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM withdrawals WHERE id = ? AND status = 'PENDING'", (withdraw_id,))
            wth = cursor.fetchone()
            if not wth:
                return False, "Withdrawal not found or already processed"

            cursor.execute("UPDATE withdrawals SET status = 'PAID', updated_at = ? WHERE id = ?", (now, withdraw_id))
            cursor.execute("UPDATE users SET total_withdrawn = total_withdrawn + ? WHERE telegram_id = ?", (wth['amount'], wth['telegram_id']))
            conn.commit()
            return True, wth

    def reject_withdrawal(self, withdraw_id):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM withdrawals WHERE id = ? AND status = 'PENDING'", (withdraw_id,))
            wth = cursor.fetchone()
            if not wth:
                return False, "Withdrawal not found or already processed"

            # Refund funds back to user
            cursor.execute("UPDATE withdrawals SET status = 'REJECTED', updated_at = ? WHERE id = ?", (now, withdraw_id))
            cursor.execute("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", (wth['amount'], wth['telegram_id']))
            conn.commit()
            return True, wth

    def get_all_user_ids(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT telegram_id FROM users WHERE is_banned = 0")
            return [row['telegram_id'] for row in cursor.fetchall()]

    def get_total_stats(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total_users, SUM(balance) as total_bal, SUM(total_deposited) as total_dep, SUM(total_withdrawn) as total_wth FROM users")
            row = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) as pending_dep FROM deposits WHERE status = 'PENDING'")
            p_dep = cursor.fetchone()['pending_dep']
            cursor.execute("SELECT COUNT(*) as pending_wth FROM withdrawals WHERE status = 'PENDING'")
            p_wth = cursor.fetchone()['pending_wth']
            return {
                "total_users": row['total_users'] or 0,
                "total_balance": row['total_bal'] or 0.0,
                "total_deposited": row['total_dep'] or 0.0,
                "total_withdrawn": row['total_wth'] or 0.0,
                "pending_deposits": p_dep,
                "pending_withdrawals": p_wth
            }

    # --- Active Game Rounds & Bets ---
    def create_active_round(self, round_id, telegram_id, game, bet_amount, mine_count, secret_indices_json, hash_seed):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Deduct bet amount atomically
            cursor.execute("UPDATE users SET balance = balance - ? WHERE telegram_id = ? AND balance >= ?", (bet_amount, telegram_id, bet_amount))
            if cursor.rowcount == 0:
                return False, "Insufficient balance"

            cursor.execute("""
                INSERT INTO active_games (round_id, telegram_id, game, bet_amount, mine_count, secret_indices, revealed_indices, current_multiplier, hash_seed, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, '[]', 1.0, ?, 'IN_PROGRESS', ?, ?)
            """, (round_id, telegram_id, game, bet_amount, mine_count, secret_indices_json, hash_seed, now, now))
            conn.commit()

            cursor.execute("SELECT balance FROM users WHERE telegram_id = ?", (telegram_id,))
            user_bal = cursor.fetchone()['balance']
            return True, user_bal

    def get_active_round(self, round_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM active_games WHERE round_id = ?", (round_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_active_round(self, round_id, revealed_indices_json, current_multiplier):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE active_games 
                SET revealed_indices = ?, current_multiplier = ?, updated_at = ?
                WHERE round_id = ? AND status = 'IN_PROGRESS'
            """, (revealed_indices_json, current_multiplier, now, round_id))
            conn.commit()

    def settle_active_round(self, round_id, status, payout, multiplier):
        now = datetime.datetime.utcnow().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM active_games WHERE round_id = ? AND status = 'IN_PROGRESS'", (round_id,))
            game = cursor.fetchone()
            if not game:
                return False, "Game round already settled or not found"

            # Update status
            cursor.execute("UPDATE active_games SET status = ?, updated_at = ? WHERE round_id = ?", (status, now, round_id))

            # Credit payout if won/cashed out
            new_bal = 0.0
            if payout > 0:
                cursor.execute("UPDATE users SET balance = balance + ? WHERE telegram_id = ?", (payout, game['telegram_id']))

            # Log bet
            won_flag = 1 if payout > 0 else 0
            bet_id = f"BET-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{game['telegram_id']%10000}"
            cursor.execute("""
                INSERT INTO bets (id, telegram_id, game, bet_amount, multiplier, payout, won, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (bet_id, game['telegram_id'], game['game'], game['bet_amount'], multiplier, payout, won_flag, now))

            conn.commit()

            cursor.execute("SELECT balance FROM users WHERE telegram_id = ?", (game['telegram_id'],))
            user_row = cursor.fetchone()
            if user_row:
                new_bal = user_row['balance']

            return True, {"balance": new_bal, "payout": payout, "multiplier": multiplier}

    def log_bet(self, telegram_id, game, bet_amount, multiplier, payout, won):
        now = datetime.datetime.utcnow().isoformat()
        bet_id = f"BET-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{int(telegram_id)%10000}"
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO bets (id, telegram_id, game, bet_amount, multiplier, payout, won, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (bet_id, telegram_id, game, bet_amount, multiplier, payout, 1 if won else 0, now))
            conn.commit()
            return bet_id

    def get_user_bets(self, telegram_id, limit=20):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM bets WHERE telegram_id = ? ORDER BY created_at DESC LIMIT ?", (telegram_id, limit))
            return [dict(row) for row in cursor.fetchall()]

db = Database()

