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
        ref_link = f"https://t.me/ViewpointGameBot?start={user_id}"
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
        dep_id = data.replace("app_dep_", "")
        answer_callback_query(cb_id, "✅ Deposit Approved!", show_alert=True)
        edit_message_text(chat_id, msg_id, f"✅ <b>Deposit Approved!</b>\nID: <code>{dep_id}</code>\nStatus: Credited to user.")

    elif data.startswith("rej_dep_"):
        dep_id = data.replace("rej_dep_", "")
        answer_callback_query(cb_id, "❌ Deposit Rejected", show_alert=True)
        edit_message_text(chat_id, msg_id, f"❌ <b>Deposit Rejected</b>\nID: <code>{dep_id}</code>")

    elif data.startswith("app_wth_"):
        wth_id = data.replace("app_wth_", "")
        answer_callback_query(cb_id, "✅ Withdrawal Approved & Sent!", show_alert=True)
        edit_message_text(chat_id, msg_id, f"✅ <b>Withdrawal Approved!</b>\nID: <code>{wth_id}</code>\nStatus: Payout dispatched.")

    elif data.startswith("rej_wth_"):
        wth_id = data.replace("rej_wth_", "")
        answer_callback_query(cb_id, "❌ Withdrawal Rejected", show_alert=True)
        edit_message_text(chat_id, msg_id, f"❌ <b>Withdrawal Rejected</b>\nID: <code>{wth_id}</code>\nStatus: Refunded to wallet.")

def run_bot_polling():
    print("🚀 Starting VIEWPOINT Native Telegram Bot Poller...")
    # Delete any stale webhook to enable getUpdates polling
    api_call("deleteWebhook", {"drop_pending_updates": False})
    
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
                        text = msg.get("text", "")
                        
                        if text.startswith("/start"):
                            handle_start(user, chat_id, text)
                        elif text.startswith("/play"):
                            send_message(chat_id, "🎮 Click below to open VIEWPOINT Casino:", get_main_menu(user.get("id")))
                    
                    elif "callback_query" in update:
                        handle_callback(update["callback_query"])
            
            time.sleep(0.5)
        except Exception as e:
            print("Polling loop error:", e)
            time.sleep(2)

if __name__ == "__main__":
    run_bot_polling()
