"""
Self-Contained Telegram Bot Service for VIEWPOINT Games
Runs on Standard Python 3 (zero third-party dependencies required).
Handles:
- /start & Deep Link Referral Tracking (₹500 bonus)
- Mini App WebApp Button Launch
- Wallet Balance, Daily Bonus Claim (₹50)
- Deposits with UTR verification & 1-Click Admin Inline Approval [Approve / Reject]
- Withdrawals with 1-Click Admin Inline Payout Confirmation [Paid / Reject]
- Admin Dashboard (/admin), Broadcast (/broadcast), Add Funds (/addfunds)
"""
import json
import time
import http.client
from config import (
    BOT_TOKEN,
    ADMIN_IDS,
    WEBAPP_URL,
    DAILY_BONUS_AMOUNT,
    REFERRAL_BONUS_AMOUNT,
    MIN_WITHDRAW_AMOUNT
)
from database import db

API_HOST = "api.telegram.org"
API_PATH = f"/bot{BOT_TOKEN}"
BOT_USERNAME = "viewpoint_games_bot"
USER_STATE = {} # { user_id: { action: 'awaiting_utr', amount: 500 } }

_conn = None
def get_tg_conn():
    global _conn
    if _conn is None:
        _conn = http.client.HTTPSConnection(API_HOST, timeout=20)
    return _conn

def call_tg(method, data=None):
    global _conn
    body = json.dumps(data) if data else None
    headers = {"Content-Type": "application/json"} if data else {}
    for _ in range(2):
        try:
            conn = get_tg_conn()
            conn.request("POST" if data else "GET", f"{API_PATH}/{method}", body=body, headers=headers)
            res = conn.getresponse()
            raw = res.read().decode("utf-8")
            return json.loads(raw)
        except Exception:
            _conn = None
    return None

def send_message(chat_id, text, reply_markup=None, parse_mode="HTML"):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return call_tg("sendMessage", payload)

def edit_message_text(chat_id, message_id, text, reply_markup=None, parse_mode="HTML"):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": parse_mode
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return call_tg("editMessageText", payload)

def answer_callback(callback_query_id, text=None, show_alert=False):
    payload = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
        payload["show_alert"] = show_alert
    return call_tg("answerCallbackQuery", payload)

def get_main_menu_markup(user_id):
    game_url = f"{WEBAPP_URL}?tg_user_id={user_id}" if "?" not in WEBAPP_URL else f"{WEBAPP_URL}&tg_user_id={user_id}"
    ref_link = f"https://t.me/{BOT_USERNAME}?start=ref_{user_id}"
    share_url = f"https://t.me/share/url?url={ref_link}&text=Play%20Mines,%20Crash%20%26%20Color%20Trading%20on%20VIEWPOINT!%20Get%20₹1,000%20Bonus%20Now!"

    keyboard = [
        [
            {"text": "🚀 PLAY GAME (Telegram Mini App)", "web_app": {"url": game_url}}
        ],
        [
            {"text": "🌐 Direct Instant Play (Web Link)", "url": game_url}
        ],
        [
            {"text": "💰 My Wallet", "callback_data": "btn_wallet"},
            {"text": "🎁 Daily Bonus", "callback_data": "btn_daily_bonus"}
        ],
        [
            {"text": "👥 Refer & Earn (₹500)", "callback_data": "btn_referral"},
            {"text": "📊 My Stats", "callback_data": "btn_stats"}
        ],
        [
            {"text": "💳 Add Cash (Deposit)", "callback_data": "btn_deposit"},
            {"text": "💸 Payout (Withdraw)", "callback_data": "btn_withdraw"}
        ],
        [
            {"text": "📲 Invite Friends", "url": share_url}
        ]
    ]
    return {"inline_keyboard": keyboard}

def handle_update(update):
    # Handle Callback Queries (Button clicks)
    if "callback_query" in update:
        cq = update["callback_query"]
        cq_id = cq["id"]
        from_user = cq["from"]
        user_id = from_user["id"]
        data = cq.get("data", "")
        msg = cq.get("message")
        msg_id = msg["message_id"] if msg else None
        chat_id = msg["chat"]["id"] if msg else user_id

        if data == "btn_main_menu":
            user = db.get_user(user_id)
            bal = user['balance'] if user else 1000.0
            text = (
                f"🎰 <b>WELCOME TO VIEWPOINT CASINO & GAMES</b> 🎰\n\n"
                f"👤 <b>Player:</b> {from_user.get('first_name', 'Player')}\n"
                f"💰 <b>Wallet Balance:</b> ₹{bal:,.2f}\n"
                f"🎁 <b>Referral Reward:</b> ₹{REFERRAL_BONUS_AMOUNT:.0f} per friend\n\n"
                f"Select an option below or launch the Mini App to start playing!"
            )
            edit_message_text(chat_id, msg_id, text, get_main_menu_markup(user_id))
            answer_callback(cq_id)
            return

        elif data == "btn_wallet":
            user = db.get_user(user_id)
            bal = user['balance'] if user else 1000.0
            dep = user['total_deposited'] if user else 0.0
            wth = user['total_withdrawn'] if user else 0.0
            text = (
                f"💳 <b>YOUR VIEWPOINT WALLET</b>\n\n"
                f"💰 <b>Available Balance:</b> ₹{bal:,.2f}\n"
                f"📥 <b>Total Deposited:</b> ₹{dep:,.2f}\n"
                f"📤 <b>Total Withdrawn:</b> ₹{wth:,.2f}\n\n"
                f"Choose an action:"
            )
            markup = {
                "inline_keyboard": [
                    [
                        {"text": "💳 Add Cash (Deposit)", "callback_data": "btn_deposit"},
                        {"text": "💸 Payout (Withdraw)", "callback_data": "btn_withdraw"}
                    ],
                    [{"text": "🔙 Back to Main Menu", "callback_data": "btn_main_menu"}]
                ]
            }
            edit_message_text(chat_id, msg_id, text, markup)
            answer_callback(cq_id)
            return

        elif data == "btn_daily_bonus":
            success, message = db.claim_daily_bonus(user_id)
            user = db.get_user(user_id)
            answer_callback(cq_id, text=message, show_alert=True)
            if success and user:
                text = (
                    f"🎰 <b>WELCOME TO VIEWPOINT CASINO</b> 🎰\n\n"
                    f"👤 <b>Player:</b> {from_user.get('first_name', 'Player')}\n"
                    f"💰 <b>Wallet Balance:</b> ₹{user['balance']:,.2f} (Bonus Added!)\n\n"
                    f"Select an option below to play!"
                )
                edit_message_text(chat_id, msg_id, text, get_main_menu_markup(user_id))
            return

        elif data == "btn_referral":
            stats = db.get_referral_stats(user_id)
            ref_link = f"https://t.me/{BOT_USERNAME}?start=ref_{user_id}"
            share_url = f"https://t.me/share/url?url={ref_link}&text=Play%20Mines,%20Crash%20%26%20Color%20Trading%20on%20VIEWPOINT!%20Get%20₹1,000%20Bonus%20Now!"
            text = (
                f"👥 <b>REFER & EARN CASH</b> 👥\n\n"
                f"💰 <b>Reward per Friend:</b> ₹{REFERRAL_BONUS_AMOUNT:.0f}\n"
                f"🤝 <b>Total Friends Joined:</b> {stats['count']}\n"
                f"💵 <b>Total Referral Earnings:</b> ₹{stats['earnings']:,.2f}\n\n"
                f"🔗 <b>Your Unique Invite Link:</b>\n"
                f"<code>{ref_link}</code>\n\n"
                f"Share this link with your friends on Telegram, WhatsApp, or Instagram. Jab bhi koi dost join karega, aapko ₹{REFERRAL_BONUS_AMOUNT:.0f} bonus milega!"
            )
            markup = {
                "inline_keyboard": [
                    [{"text": "📲 Share Invite Link", "url": share_url}],
                    [{"text": "🔙 Back to Main Menu", "callback_data": "btn_main_menu"}]
                ]
            }
            edit_message_text(chat_id, msg_id, text, markup)
            answer_callback(cq_id)
            return

        elif data == "btn_stats":
            user = db.get_user(user_id)
            bets = db.get_user_bets(user_id, limit=5)
            text = (
                f"📊 <b>PLAYER STATISTICS</b>\n\n"
                f"👤 <b>Player ID:</b> <code>{user_id}</code>\n"
                f"💰 <b>Current Balance:</b> ₹{user['balance']:,.2f}\n"
                f"📥 <b>Total Deposits:</b> ₹{user['total_deposited']:,.2f}\n"
                f"📤 <b>Total Payouts:</b> ₹{user['total_withdrawn']:,.2f}\n\n"
                f"<b>Recent Games:</b>\n"
            )
            if bets:
                for b in bets:
                    status = "✅ WON" if b['won'] else "❌ LOST"
                    text += f"• {b['game'].upper()} - Bet ₹{b['bet_amount']:.0f} | {status} (₹{b['payout']:.2f})\n"
            else:
                text += "No bets placed yet. Start playing now!\n"

            markup = {"inline_keyboard": [[{"text": "🔙 Back", "callback_data": "btn_main_menu"}]]}
            edit_message_text(chat_id, msg_id, text, markup)
            answer_callback(cq_id)
            return

        elif data == "btn_deposit":
            USER_STATE[user_id] = {"action": "awaiting_deposit_amount"}
            text = (
                f"💳 <b>ONLINE UPI DEPOSIT</b>\n\n"
                f"Kripya amount enter karein jo aap deposit karna chahte hain:\n"
                f"<i>(Min: ₹100, Max: ₹50,000)</i>\n\n"
                f"Example: Type <code>500</code> and send."
            )
            markup = {"inline_keyboard": [[{"text": "🔙 Cancel", "callback_data": "btn_main_menu"}]]}
            edit_message_text(chat_id, msg_id, text, markup)
            answer_callback(cq_id)
            return

        elif data == "btn_withdraw":
            user = db.get_user(user_id)
            bal = user['balance'] if user else 0.0
            if bal < MIN_WITHDRAW_AMOUNT:
                answer_callback(cq_id, text=f"Minimum withdrawal amount is ₹{MIN_WITHDRAW_AMOUNT:.0f}. Aapka balance kam hai!", show_alert=True)
                return

            USER_STATE[user_id] = {"action": "awaiting_withdraw_amount"}
            text = (
                f"💸 <b>REQUEST INSTANT PAYOUT</b>\n\n"
                f"💰 Available Balance: ₹{bal:,.2f}\n"
                f"⚡ Platform Fee: 8%\n\n"
                f"Kitna amount withdraw karna chahte hain? Type karein (Min ₹{MIN_WITHDRAW_AMOUNT:.0f}):"
            )
            markup = {"inline_keyboard": [[{"text": "🔙 Cancel", "callback_data": "btn_main_menu"}]]}
            edit_message_text(chat_id, msg_id, text, markup)
            answer_callback(cq_id)
            return

        # --- ADMIN INLINE APPROVAL HANDLERS ---
        elif data.startswith("appr_dep_"):
            dep_id = data.replace("appr_dep_", "")
            if user_id not in ADMIN_IDS:
                answer_callback(cq_id, text="Unauthorized", show_alert=True)
                return
            success, dep = db.approve_deposit(dep_id)
            if success:
                answer_callback(cq_id, text="✅ Deposit Approved!", show_alert=True)
                edit_message_text(chat_id, msg_id, f"✅ <b>DEPOSIT APPROVED</b>\nID: <code>{dep_id}</code>\nAmount: ₹{dep['amount']}\nPlayer: <code>{dep['telegram_id']}</code>")
                send_message(dep['telegram_id'], f"🎉 <b>Deposit Approved!</b>\n₹{dep['amount']:.2f} aapke wallet me add kar diye gaye hain! Khelna shuru karein 🚀")
            else:
                answer_callback(cq_id, text=f"Error: {dep}", show_alert=True)
            return

        elif data.startswith("rejc_dep_"):
            dep_id = data.replace("rejc_dep_", "")
            if user_id not in ADMIN_IDS:
                answer_callback(cq_id, text="Unauthorized", show_alert=True)
                return
            success, dep = db.reject_deposit(dep_id)
            if success:
                answer_callback(cq_id, text="❌ Deposit Rejected", show_alert=True)
                edit_message_text(chat_id, msg_id, f"❌ <b>DEPOSIT REJECTED</b>\nID: <code>{dep_id}</code>\nPlayer: <code>{dep['telegram_id']}</code>")
                send_message(dep['telegram_id'], f"❌ <b>Deposit Request Rejected.</b>\nAapka UTR match nahi hua. Support se sampark karein.")
            return

        elif data.startswith("appr_wth_"):
            wth_id = data.replace("appr_wth_", "")
            if user_id not in ADMIN_IDS:
                answer_callback(cq_id, text="Unauthorized", show_alert=True)
                return
            success, wth = db.approve_withdrawal(wth_id)
            if success:
                answer_callback(cq_id, text="✅ Marked as Paid!", show_alert=True)
                edit_message_text(chat_id, msg_id, f"✅ <b>PAYOUT TRANSFERRED</b>\nID: <code>{wth_id}</code>\nAmount: ₹{wth['net_payout']}\nReceiver: <code>{wth['receiver']}</code>")
                send_message(wth['telegram_id'], f"🎉 <b>Withdrawal Success!</b>\n₹{wth['net_payout']:.2f} aapke UPI ({wth['receiver']}) par transfer kar diye gaye hain!")
            return

        elif data.startswith("rejc_wth_"):
            wth_id = data.replace("rejc_wth_", "")
            if user_id not in ADMIN_IDS:
                answer_callback(cq_id, text="Unauthorized", show_alert=True)
                return
            success, wth = db.reject_withdrawal(wth_id)
            if success:
                answer_callback(cq_id, text="❌ Payout Rejected & Refunded", show_alert=True)
                edit_message_text(chat_id, msg_id, f"❌ <b>WITHDRAWAL REJECTED & REFUNDED</b>\nID: <code>{wth_id}</code>\nPlayer: <code>{wth['telegram_id']}</code>")
                send_message(wth['telegram_id'], f"⚠️ <b>Withdrawal Cancelled.</b>\n₹{wth['amount']:.2f} aapke game wallet me wapas refund kar diye gaye hain.")
            return

    # Handle Text Messages
    if "message" in update and "text" in update["message"]:
        msg = update["message"]
        chat_id = msg["chat"]["id"]
        from_user = msg["from"]
        user_id = from_user["id"]
        text = msg["text"].strip()

        # Handle /start
        if text.startswith("/start"):
            referrer_id = None
            parts = text.split()
            if len(parts) > 1 and parts[1].startswith("ref_"):
                try:
                    referrer_id = int(parts[1].replace("ref_", ""))
                except ValueError:
                    referrer_id = None

            db_user, is_new = db.get_or_create_user(
                telegram_id=user_id,
                username=from_user.get("username", ""),
                first_name=from_user.get("first_name", "Player"),
                referrer_id=referrer_id
            )

            welcome_text = (
                f"🎰 <b>WELCOME TO VIEWPOINT CASINO & GAMES</b> 🎰\n\n"
                f"👤 <b>Player:</b> {from_user.get('first_name', 'Player')}\n"
                f"💰 <b>Wallet Balance:</b> ₹{db_user['balance']:,.2f}\n"
                f"🎁 <b>Referral Bonus:</b> ₹{REFERRAL_BONUS_AMOUNT:.0f} per invite\n\n"
                f"🚀 <b>Launch Game:</b> <a href=\"{WEBAPP_URL}?tg_user_id={user_id}\">👉 Click Here to Play Online</a>\n\n"
                f"Ya niche diye gaye buttons se play karein 👇"
            )
            send_message(chat_id, welcome_text, get_main_menu_markup(user_id))
            return

        # Handle /admin
        if text == "/admin" and user_id in ADMIN_IDS:
            stats = db.get_total_stats()
            admin_text = (
                f"👑 <b>VIEWPOINT ADMIN DASHBOARD</b>\n\n"
                f"👥 <b>Total Players:</b> {stats['total_users']}\n"
                f"💰 <b>Total Player Balances:</b> ₹{stats['total_balance']:,.2f}\n"
                f"📥 <b>Total Deposits:</b> ₹{stats['total_deposited']:,.2f}\n"
                f"📤 <b>Total Withdrawn:</b> ₹{stats['total_withdrawn']:,.2f}\n"
                f"⏳ <b>Pending Deposits:</b> {stats['pending_deposits']}\n"
                f"⏳ <b>Pending Payouts:</b> {stats['pending_withdrawals']}\n\n"
                f"<b>Admin Commands:</b>\n"
                f"• <code>/addfunds &lt;TelegramID&gt; &lt;Amount&gt;</code>\n"
                f"• <code>/broadcast &lt;Message&gt;</code>"
            )
            send_message(chat_id, admin_text)
            return

        # Handle /addfunds <user_id> <amount>
        if text.startswith("/addfunds") and user_id in ADMIN_IDS:
            parts = text.split()
            if len(parts) >= 3:
                try:
                    target_id = int(parts[1])
                    amt = float(parts[2])
                    new_bal = db.update_balance(target_id, amt)
                    send_message(chat_id, f"✅ Successfully added ₹{amt:.2f} to user <code>{target_id}</code>. New balance: ₹{new_bal:.2f}")
                    send_message(target_id, f"🎉 Admin has credited ₹{amt:.2f} to your VIEWPOINT wallet! Current Balance: ₹{new_bal:.2f}")
                except Exception as e:
                    send_message(chat_id, f"Error: {e}")
            else:
                send_message(chat_id, "Usage: <code>/addfunds 123456789 500</code>")
            return

        # Handle /broadcast <msg>
        if text.startswith("/broadcast") and user_id in ADMIN_IDS:
            bc_msg = text.replace("/broadcast", "").strip()
            if not bc_msg:
                send_message(chat_id, "Usage: <code>/broadcast Your message here</code>")
                return
            all_users = db.get_all_user_ids()
            count = 0
            for u in all_users:
                try:
                    send_message(u, f"📢 <b>VIEWPOINT ANNOUNCEMENT:</b>\n\n{bc_msg}")
                    count += 1
                except:
                    pass
            send_message(chat_id, f"✅ Broadcast sent to {count} players!")
            return

        # State Handling: Deposit flow
        if user_id in USER_STATE:
            state = USER_STATE[user_id]
            
            if state.get("action") == "awaiting_deposit_amount":
                try:
                    amt = float(text)
                    if amt < 100 or amt > 50000:
                        send_message(chat_id, "Please enter an amount between ₹100 and ₹50,000:")
                        return
                    USER_STATE[user_id] = {"action": "awaiting_utr", "amount": amt}
                    dep_text = (
                        f"💳 <b>DEPOSIT: ₹{amt:,.2f}</b>\n\n"
                        f"1. Apne PhonePe, GPay, ya Paytm se is UPI par pay karein:\n"
                        f"👉 <code>adrenox1@axl</code> (Click to copy)\n\n"
                        f"2. Payment successful hone ke baad wahan se <b>12-digit UTR / Reference No.</b> copy karein aur yahan send karein."
                    )
                    send_message(chat_id, dep_text)
                except ValueError:
                    send_message(chat_id, "Kripya valid number enter karein (e.g. 500):")
                return

            elif state.get("action") == "awaiting_utr":
                utr = text.replace(" ", "")
                amt = state.get("amount", 500)
                dep_id = f"DEP-{int(time.time())}-{user_id%10000}"
                db.create_deposit_request(dep_id, user_id, amt, utr, "adrenox1@axl")
                del USER_STATE[user_id]

                send_message(chat_id, f"✅ <b>Deposit Request Submitted!</b>\nAmount: ₹{amt:.2f}\nUTR: <code>{utr}</code>\n\nAdmin 2-5 minutes me verify karke aapka balance add kar dega.")

                # Notify Admin with Inline Approve/Reject Buttons
                for admin_id in ADMIN_IDS:
                    admin_notify = (
                        f"🔔 <b>NEW DEPOSIT REQUEST!</b>\n\n"
                        f"👤 <b>Player:</b> {from_user.get('first_name', 'User')} (@{from_user.get('username', 'none')})\n"
                        f"🆔 <b>ID:</b> <code>{user_id}</code>\n"
                        f"💰 <b>Amount:</b> ₹{amt:,.2f}\n"
                        f"🔢 <b>UTR No:</b> <code>{utr}</code>\n"
                        f"📋 <b>Request ID:</b> <code>{dep_id}</code>"
                    )
                    admin_markup = {
                        "inline_keyboard": [
                            [
                                {"text": "✅ Approve (+Balance)", "callback_data": f"appr_dep_{dep_id}"},
                                {"text": "❌ Reject", "callback_data": f"rejc_dep_{dep_id}"}
                            ]
                        ]
                    }
                    send_message(admin_id, admin_notify, admin_markup)
                return

            elif state.get("action") == "awaiting_withdraw_amount":
                try:
                    amt = float(text)
                    user = db.get_user(user_id)
                    if amt < MIN_WITHDRAW_AMOUNT or amt > user['balance']:
                        send_message(chat_id, f"Invalid amount. Enter between ₹{MIN_WITHDRAW_AMOUNT:.0f} and ₹{user['balance']:,.2f}:")
                        return
                    USER_STATE[user_id] = {"action": "awaiting_upi_id", "amount": amt}
                    send_message(chat_id, f"💸 Withdraw Amount: ₹{amt:.2f}\n\nAb apna **UPI ID** enter karein jisme aap payout chahte hain (e.g. <code>yourname@okhdfcbank</code>):")
                except ValueError:
                    send_message(chat_id, "Kripya valid number enter karein:")
                return

            elif state.get("action") == "awaiting_upi_id":
                receiver_upi = text
                amt = state.get("amount", MIN_WITHDRAW_AMOUNT)
                wth_id = f"WTH-{int(time.time())}-{user_id%10000}"
                success, res = db.create_withdrawal_request(wth_id, user_id, amt, receiver_upi, channel="UPI")
                del USER_STATE[user_id]

                if not success:
                    send_message(chat_id, f"❌ Failed: {res}")
                    return

                send_message(chat_id, f"✅ <b>Payout Request Submitted!</b>\nAmount: ₹{amt:.2f}\nNet Transfer: ₹{res['net_payout']:.2f}\nUPI: <code>{receiver_upi}</code>\n\nAdmin payment transfer kar raha hai.")

                # Notify Admin with Inline Paid/Reject Buttons
                for admin_id in ADMIN_IDS:
                    admin_notify = (
                        f"💸 <b>NEW WITHDRAWAL REQUEST!</b>\n\n"
                        f"👤 <b>Player:</b> {from_user.get('first_name', 'User')} (@{from_user.get('username', 'none')})\n"
                        f"🆔 <b>ID:</b> <code>{user_id}</code>\n"
                        f"💰 <b>Total Amount:</b> ₹{amt:,.2f}\n"
                        f"⚡ <b>Fee (8%):</b> ₹{res['fee']:.2f}\n"
                        f"💵 <b>Net Payout:</b> ₹{res['net_payout']:.2f}\n"
                        f"🏦 <b>Transfer To UPI:</b> <code>{receiver_upi}</code>"
                    )
                    admin_markup = {
                        "inline_keyboard": [
                            [
                                {"text": "✅ Mark as Paid", "callback_data": f"appr_wth_{wth_id}"},
                                {"text": "❌ Reject & Refund", "callback_data": f"rejc_wth_{wth_id}"}
                            ]
                        ]
                    }
                    send_message(admin_id, admin_notify, admin_markup)
                return

        # Default fallback
        send_message(chat_id, "Choose an option below to play or manage your wallet:", get_main_menu_markup(user_id))

def run_bot():
    print(f"🤖 VIEWPOINT Telegram Bot Service started for @{BOT_USERNAME}...")
    offset = 0
    while True:
        try:
            updates_res = call_tg("getUpdates", {"offset": offset, "timeout": 5})
            if updates_res and updates_res.get("ok"):
                for upd in updates_res.get("result", []):
                    offset = upd["update_id"] + 1
                    try:
                        handle_update(upd)
                    except Exception as err:
                        print("Update handling error:", err)
            else:
                time.sleep(0.2)
        except Exception as e:
            print("Bot polling loop exception:", e)
            time.sleep(1)

if __name__ == "__main__":
    run_bot()
