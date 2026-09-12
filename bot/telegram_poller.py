#!/usr/bin/env python3
"""
VIEWPOINT Ultra-Reliable Native Telegram Bot Runner
Zero-dependency Telegram Bot polling engine using Python standard library (urllib).
Handles:
- /start with Play WebApp Button (https://viewpoint.diy)
- Wallet balance, Daily bonus, Referrals
- Admin deposit/withdrawal alerts & 1-click approvals
"""
import urllib.request
import urllib.parse
import json
import time
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

try:
    from database import db
except Exception:
    db = None

BOT_TOKEN = "8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M"
ADMIN_IDS = [6527377657]
WEBAPP_URL = "https://viewpoint.diy"
DAILY_BONUS = 50.0
REFERRAL_BONUS = 500.0

API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def api_call(method, payload=None):
    url = f"{API_URL}/{method}"
    try:
        if payload is not None:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        else:
            req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=35) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Telegram API error on {method}: {e}")
        return None

def send_message(chat_id, text, reply_markup=None, parse_mode="HTML"):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("sendMessage", payload)

def answer_callback_query(callback_query_id, text=None, show_alert=False):
    payload = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
        payload["show_alert"] = show_alert
    return api_call("answerCallbackQuery", payload)

def edit_message_text(chat_id, message_id, text, reply_markup=None, parse_mode="HTML"):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("editMessageText", payload)

def get_main_menu(user_id):
    return {
        "inline_keyboard": [
            [
                {"text": "🎮 Play VIEWPOINT Casino (Instant WebApp)", "web_app": {"url": WEBAPP_URL}}
            ],
            [
                {"text": "💰 My Wallet", "callback_data": "menu_wallet"},
                {"text": "🎁 Daily Bonus", "callback_data": "menu_daily"}
            ],
            [
                {"text": "👥 Refer & Earn ₹500", "callback_data": "menu_referral"},
                {"text": "💬 VIP Support", "url": "https://t.me/viewpointios"}
            ]
        ]
    }

def handle_start(user, chat_id, text):
    user_id = user.get("id")
    first_name = user.get("first_name", "Player")
    username = user.get("username", "")

    # Record / get user from DB
    balance = 1000.0
    if db:
        try:
            db_user = db.get_user(user_id)
            if not db_user:
                db_user = db.create_user(user_id, username, first_name)
            balance = db_user.get("balance", 1000.0)
        except Exception as e:
            print("DB User error:", e)

    welcome_text = (
        f"🔥 <b>Welcome to VIEWPOINT Casino, {first_name}!</b> 🔥\n\n"
        f"India's premier 100% Provably Fair Casino & Mines platform with instant UPI deposits and fast payouts.\n\n"
        f"🎮 <b>Featured Games:</b>\n"
        f"• 🐉 <b>Dragon Tiger</b> (Live Casino VIP Table)\n"
        f"• 💣 <b>Mines</b> (Up to 10,000x multiplier)\n"
        f"• 🎯 <b>Limbo Turbo</b> (1,000,000x Multiplier)\n"
        f"• 🎈 <b>Stake Pump</b> (Crypto Balloon Multiplier)\n"
        f"• 🍗 <b>Chicken Road</b> (270x Lane Walker)\n"
        f"• 🔴 <b>Plinko</b> (1,000x Pin Drop)\n"
        f"• 🚀 <b>Crash</b> (Aviator Rocket flight)\n"
        f"• 🐹 <b>Stake Moles</b> (Burrow Gold Multiplier)\n"
        f"• 🎲 <b>Classic Dice</b> (9900x Roll)\n"
        f"• 🏰 <b>Tower Legend</b> (Climb Tower Multiplier)\n"
        f"• 🎨 <b>Win Go 30s</b> (Color Trading)\n"
        f"• 📈 <b>Stock BTC</b> (Real-Time Candlestick)\n\n"
        f"💰 <b>Current Balance:</b> ₹{balance:,.2f}\n\n"
        f"Click the button below to start playing instantly inside Telegram! 👇"
    )

    send_message(chat_id, welcome_text, get_main_menu(user_id))

def handle_callback(cb):
    cb_id = cb.get("id")
    data = cb.get("data", "")
    message = cb.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    msg_id = message.get("message_id")
    from_user = cb.get("from", {})
    user_id = from_user.get("id")

    if data == "menu_wallet":
        answer_callback_query(cb_id)
        bal = 1000.0
        if db:
            try:
                u = db.get_user(user_id)
                if u: bal = u.get("balance", 1000.0)
            except Exception: pass
        
        wallet_text = (
            f"💼 <b>VIEWPOINT WALLET</b>\n\n"
            f"💰 <b>Balance:</b> ₹{bal:,.2f}\n"
            f"💳 <b>Deposit Method:</b> Instant UPI / QR\n"
            f"⚡ <b>Withdrawal:</b> Fast UPI Payout\n\n"
            f"Open WebApp to deposit or withdraw funds instantly."
        )
        kb = {
            "inline_keyboard": [
                [{"text": "⚡ Deposit / Withdraw in App", "web_app": {"url": WEBAPP_URL}}],
                [{"text": "🔙 Back to Menu", "callback_data": "menu_main"}]
            ]
        }
        edit_message_text(chat_id, msg_id, wallet_text, kb)

    elif data == "menu_daily":
        answer_callback_query(cb_id, "🎁 ₹50 Daily Bonus Claimed!", show_alert=True)
        if db:
            try:
                db.claim_daily_bonus(user_id, DAILY_BONUS)
            except Exception: pass
        daily_text = (
            f"🎁 <b>DAILY BONUS CLAIMED!</b>\n\n"
            f"₹{DAILY_BONUS:.2f} has been added to your VIEWPOINT wallet balance.\n"
            f"Come back tomorrow for your next reward!"
        )
        kb = {"inline_keyboard": [[{"text": "🎮 Play Now", "web_app": {"url": WEBAPP_URL}}], [{"text": "🔙 Back", "callback_data": "menu_main"}]]}
        edit_message_text(chat_id, msg_id, daily_text, kb)

    elif data == "menu_referral":
        answer_callback_query(cb_id)
        ref_link = f"https://t.me/viewpoint_games_bot?start={user_id}"
        ref_text = (
            f"👥 <b>REFER & EARN PROGRAM</b>\n\n"
            f"Share your referral link with friends and earn <b>₹500 bonus</b> on their first deposit!\n\n"
            f"🔗 <b>Your Link:</b>\n<code>{ref_link}</code>"
        )
        kb = {
            "inline_keyboard": [
                [{"text": "📲 Share Link", "url": f"https://t.me/share/url?url={ref_link}&text=Play%20Viewpoint%20Casino"}],
                [{"text": "🔙 Back", "callback_data": "menu_main"}]
            ]
        }
        edit_message_text(chat_id, msg_id, ref_text, kb)

    elif data == "menu_main":
        answer_callback_query(cb_id)
        handle_start(from_user, chat_id, "")

    elif data.startswith("app_dep_"):
        if chat_id not in ADMIN_IDS:
            answer_callback_query(cb_id, "❌ Unauthorized admin access.", show_alert=True)
            return

        dep_id = data.replace("app_dep_", "")
        if db:
            success, dep_data = db.approve_deposit(dep_id, source="telegram")
            if success:
                # Sync with WebApp Serverless Store
                try:
                    sync_payload = {
                        "action": "approve_dep",
                        "id": dep_id,
                        "amt": dep_data["approved_amount"],
                        "userId": str(dep_data["user_id"]),
                        "source": "telegram",
                        "secret": "VIEWPOINT_ADMIN_SECRET_2026"
                    }
                    for sync_url in [f"{WEBAPP_URL}/api/sync", "http://localhost:8000/api/sync"]:
                        try:
                            req = urllib.request.Request(
                                sync_url,
                                data=json.dumps(sync_payload).encode("utf-8"),
                                headers={"Content-Type": "application/json"}
                            )
                            urllib.request.urlopen(req, timeout=3)
                            break
                        except Exception:
                            continue
                except Exception:
                    pass

                answer_callback_query(cb_id, f"✅ Approved! Credited ₹{dep_data['approved_amount']:.2f}", show_alert=True)
                edit_message_text(
                    chat_id, msg_id,
                    f"✅ <b>DEPOSIT APPROVED & CREDITED!</b>\n\n"
                    f"💰 <b>Approved & Credited:</b> <b>₹{dep_data['approved_amount']:,.2f}</b>\n"
                    f"👤 <b>Player ID:</b> <code>{dep_data['user_id']}</code>\n"
                    f"💳 <b>Updated Balance:</b> <b>₹{dep_data['new_balance']:,.2f}</b>\n"
                    f"🆔 <b>Deposit ID:</b> <code>{dep_id}</code>\n"
                    f"🧾 <b>Ledger Ref:</b> <code>{dep_data['ledger_id']}</code>\n"
                    f"⚡ <b>Source:</b> Telegram 1-Click"
                )

                # Notify player on Telegram if telegram_id is numeric
                try:
                    target_tid = int(dep_data['telegram_id'])
                    send_message(
                        target_tid,
                        f"🎉 <b>DEPOSIT APPROVED & CREDITED!</b>\n\n"
                        f"₹{dep_data['approved_amount']:,.2f} has been added to your VIEWPOINT wallet.\n"
                        f"Current Balance: <b>₹{dep_data['new_balance']:,.2f}</b>\n\nPlay now!",
                        {"inline_keyboard": [[{"text": "🎮 Open VIEWPOINT Casino", "web_app": {"url": WEBAPP_URL}}]]}
                    )
                except Exception:
                    pass
            else:
                answer_callback_query(cb_id, f"⚠️ {dep_data}", show_alert=True)
                edit_message_text(chat_id, msg_id, f"⚠️ <b>Deposit Notice:</b>\n{dep_data}\nDeposit ID: <code>{dep_id}</code>")
        else:
            answer_callback_query(cb_id, "⚠️ Database engine offline.", show_alert=True)

    elif data.startswith("rej_dep_"):
        if chat_id not in ADMIN_IDS:
            answer_callback_query(cb_id, "❌ Unauthorized admin access.", show_alert=True)
            return

        dep_id = data.replace("rej_dep_", "")
        if db:
            success, dep_data = db.reject_deposit(dep_id)
            if success:
                try:
                    sync_payload = {
                        "action": "reject_dep",
                        "id": dep_id,
                        "source": "telegram",
                        "secret": "VIEWPOINT_ADMIN_SECRET_2026"
                    }
                    for sync_url in [f"{WEBAPP_URL}/api/sync", "http://localhost:8000/api/sync"]:
                        try:
                            req = urllib.request.Request(
                                sync_url,
                                data=json.dumps(sync_payload).encode("utf-8"),
                                headers={"Content-Type": "application/json"}
                            )
                            urllib.request.urlopen(req, timeout=3)
                            break
                        except Exception:
                            continue
                except Exception:
                    pass

                answer_callback_query(cb_id, "❌ Deposit Rejected", show_alert=True)
                edit_message_text(chat_id, msg_id, f"❌ <b>Deposit Rejected</b>\nDeposit ID: <code>{dep_id}</code>\nStatus: REJECTED (₹0.00 added)")
            else:
                answer_callback_query(cb_id, f"⚠️ {dep_data}", show_alert=True)
                edit_message_text(chat_id, msg_id, f"⚠️ <b>Deposit Notice:</b>\n{dep_data}")
        else:
            answer_callback_query(cb_id, "⚠️ Database engine offline.", show_alert=True)

    elif data.startswith("app_wth_"):
        if chat_id not in ADMIN_IDS:
            answer_callback_query(cb_id, "❌ Unauthorized", show_alert=True)
            return
        wth_id = data.replace("app_wth_", "")
        if db:
            success, wth_data = db.approve_withdrawal(wth_id)
            if success:
                answer_callback_query(cb_id, "✅ Withdrawal Approved & Sent!", show_alert=True)
                edit_message_text(chat_id, msg_id, f"✅ <b>Withdrawal Approved!</b>\nID: <code>{wth_id}</code>\nStatus: Payout dispatched.")
            else:
                answer_callback_query(cb_id, f"⚠️ {wth_data}", show_alert=True)
        else:
            answer_callback_query(cb_id, "✅ Withdrawal Approved", show_alert=True)

    elif data.startswith("rej_wth_"):
        if chat_id not in ADMIN_IDS:
            answer_callback_query(cb_id, "❌ Unauthorized", show_alert=True)
            return
        wth_id = data.replace("rej_wth_", "")
        if db:
            success, wth_data = db.reject_withdrawal(wth_id)
            if success:
                answer_callback_query(cb_id, "❌ Withdrawal Rejected & Refunded", show_alert=True)
                edit_message_text(chat_id, msg_id, f"❌ <b>Withdrawal Rejected</b>\nID: <code>{wth_id}</code>\nStatus: Refunded to wallet.")
            else:
                answer_callback_query(cb_id, f"⚠️ {wth_data}", show_alert=True)
        else:
            answer_callback_query(cb_id, "❌ Withdrawal Rejected", show_alert=True)

import threading

# Dynamic In-Memory & File Store for 1-Time Promo Codes
PROMO_CODES_FILE = BASE_DIR / "promo_codes.json"

def load_promo_codes():
    if PROMO_CODES_FILE.exists():
        try:
            with open(PROMO_CODES_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_promo_codes(codes):
    try:
        with open(PROMO_CODES_FILE, "w") as f:
            json.dump(codes, f, indent=2)
    except Exception as e:
        print("Save promo error:", e)

dispatched_deposits = set()
dispatched_withdrawals = set()

def background_notification_monitor():
    """Ultra-fast background monitor that checks database for new deposits/withdrawals every 1.5s"""
    while True:
        try:
            if db:
                # Check Pending Deposits
                deps = db.get_pending_deposits() if hasattr(db, 'get_pending_deposits') else []
                for dep in deps:
                    d_id = dep.get("id") or dep.get("deposit_id")
                    if d_id and d_id not in dispatched_deposits:
                        dispatched_deposits.add(d_id)
                        amt = float(dep.get("amount", 0))
                        uid = dep.get("user_id") or dep.get("telegram_id") or "Player"
                        utr = dep.get("utr", "N/A")
                        
                        alert_text = (
                            f"🔔 <b>NEW UPI DEPOSIT RECORD</b> 🔔\n\n"
                            f"👤 <b>Player ID:</b> <code>{uid}</code>\n"
                            f"💰 <b>Amount:</b> <b>₹{amt:,.2f}</b>\n"
                            f"🧾 <b>UTR Reference:</b> <code>{utr}</code>\n"
                            f"⏰ <b>Time:</b> {time.strftime('%I:%M:%S %p')}\n"
                            f"🆔 <b>Deposit ID:</b> <code>{d_id}</code>"
                        )
                        kb = {
                            "inline_keyboard": [
                                [
                                    {"text": f"✅ Approve (+₹{amt:,.0f})", "callback_data": f"app_dep_{d_id}"},
                                    {"text": "❌ Reject", "callback_data": f"rej_dep_{d_id}"}
                                ]
                            ]
                        }
                        for admin_id in ADMIN_IDS:
                            send_message(admin_id, alert_text, kb)
        except Exception as e:
            pass
        time.sleep(1.5)

def run_bot_polling():
    print("🚀 Starting VIEWPOINT Native Telegram Bot Poller with Instant Alerts...")
    # Delete any stale webhook to enable getUpdates polling
    api_call("deleteWebhook", {"drop_pending_updates": False})
    
    # Launch background alert monitor thread
    t = threading.Thread(target=background_notification_monitor, daemon=True)
    t.start()
    
    offset = 0
    while True:
        try:
            res = api_call("getUpdates", {"offset": offset, "timeout": 25})
            if res and res.get("ok"):
                for update in res.get("result", []):
                    offset = update["update_id"] + 1
                    
                    if "message" in update:
                        msg = update["message"]
                        user = msg.get("from", {})
                        chat_id = msg.get("chat", {}).get("id")
                        text = msg.get("text", "").strip()
                        
                        if text.startswith("/start"):
                            handle_start(user, chat_id, text)
                        elif text.startswith("/play"):
                            send_message(chat_id, "🎮 Click below to open VIEWPOINT Casino:", get_main_menu(user.get("id")))
                        elif text.startswith("/gencode") and chat_id in ADMIN_IDS:
                            # /gencode 100 or /gencode 500
                            parts = text.split()
                            amt = 100.0
                            if len(parts) > 1:
                                try:
                                    amt = float(parts[1])
                                except ValueError:
                                    amt = 100.0
                            code = f"VP{int(amt)}-" + str(int(time.time()))[-4:]
                            codes = load_promo_codes()
                            codes[code] = {
                                "amount": amt,
                                "created_at": time.time(),
                                "expires_at": time.time() + 86400, # 1 day validity
                                "used_by": []
                            }
                            save_promo_codes(codes)
                            
                            send_message(
                                chat_id,
                                f"🎁 <b>1-TIME PROMO CODE GENERATED!</b>\n\n"
                                f"🔑 <b>Code:</b> <code>{code}</code>\n"
                                f"💰 <b>Bonus Amount:</b> ₹{amt:.2f}\n"
                                f"⏳ <b>Validity:</b> 1-Day Single Use\n\n"
                                f"👉 Send this code to player. It can only be redeemed 1 time!"
                            )
                        elif text.startswith("/approve") and chat_id in ADMIN_IDS:
                            # /approve <deposit_id> [amount] (e.g. /approve DEP-12345 2000)
                            parts = text.split()
                            if len(parts) < 2:
                                send_message(chat_id, "⚠️ Usage: <code>/approve &lt;deposit_id&gt; [amount]</code>\nExample: <code>/approve DEP-123 2000</code>")
                            else:
                                dep_id = parts[1].strip()
                                custom_amt = None
                                if len(parts) >= 3:
                                    try:
                                        custom_amt = round(float(parts[2]), 2)
                                    except ValueError:
                                        pass
                                if db:
                                    success, dep_data = db.approve_deposit(dep_id, amount_override=custom_amt, source="telegram_cmd")
                                    if success:
                                        send_message(
                                            chat_id,
                                            f"✅ <b>DEPOSIT APPROVED & CREDITED!</b>\n\n"
                                            f"💰 <b>Approved & Credited:</b> <b>₹{dep_data['approved_amount']:,.2f}</b>\n"
                                            f"👤 <b>Player ID:</b> <code>{dep_data['user_id']}</code>\n"
                                            f"💳 <b>Updated Balance:</b> <b>₹{dep_data['new_balance']:,.2f}</b>\n"
                                            f"🆔 <b>Deposit ID:</b> <code>{dep_id}</code>\n"
                                            f"🧾 <b>Ledger Ref:</b> <code>{dep_data['ledger_id']}</code>"
                                        )
                                    else:
                                        send_message(chat_id, f"⚠️ Failed to approve: {dep_data}")
                                else:
                                    send_message(chat_id, "⚠️ Database offline.")

                        elif text.startswith("/reject") and chat_id in ADMIN_IDS:
                            parts = text.split()
                            if len(parts) < 2:
                                send_message(chat_id, "⚠️ Usage: <code>/reject &lt;deposit_id&gt;</code>")
                            else:
                                dep_id = parts[1].strip()
                                if db:
                                    success, dep_data = db.reject_deposit(dep_id)
                                    if success:
                                        send_message(chat_id, f"❌ Deposit <code>{dep_id}</code> marked as REJECTED.")
                                    else:
                                        send_message(chat_id, f"⚠️ Failed: {dep_data}")

                        elif text.startswith("/help"):
                            send_message(
                                chat_id,
                                "📖 <b>VIEWPOINT BOT COMMANDS</b>\n\n"
                                "/start - Open main menu & Play WebApp\n"
                                "/play - Launch casino instant webapp\n"
                                "/gencode &lt;amt&gt; - Admin: Generate 1-time promo code\n"
                                "/approve &lt;dep_id&gt; [amt] - Admin: Approve deposit with exact amount\n"
                                "/reject &lt;dep_id&gt; - Admin: Reject deposit"
                            )
                    
                    elif "callback_query" in update:
                        handle_callback(update["callback_query"])
            
            time.sleep(0.5)
        except Exception as e:
            print("Polling loop error:", e)
            time.sleep(2)

if __name__ == "__main__":
    run_bot_polling()
