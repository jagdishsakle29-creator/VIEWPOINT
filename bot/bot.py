"""
VIEWPOINT Casino & Mines Official Telegram Bot
Powered by python-telegram-bot v20+
"""
import logging
import asyncio
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters
)

from config import (
    BOT_TOKEN,
    ADMIN_IDS,
    WEBAPP_URL,
    DAILY_BONUS_AMOUNT,
    REFERRAL_BONUS_AMOUNT,
    MIN_WITHDRAW_AMOUNT
)
from database import db
from keyboards import (
    get_main_menu_keyboard,
    get_wallet_keyboard,
    get_referral_keyboard,
    get_back_keyboard,
    get_admin_approval_keyboard
)

# Logging configuration
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("ViewpointBot")

# In-memory states for user inputs (Deposit / Withdraw)
USER_STATE = {}

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles /start command and deep linking (referral)
    """
    user = update.effective_user
    args = context.args or []
    referrer_id = None

    if args and args[0].startswith("ref_"):
        try:
            referrer_id = int(args[0].replace("ref_", ""))
        except ValueError:
            referrer_id = None

    db_user, is_new = db.get_or_create_user(
        telegram_id=user.id,
        username=user.username or "",
        first_name=user.first_name or "Player",
        referrer_id=referrer_id
    )

    bot_info = await context.bot.get_me()
    welcome_text = (
        f"💎 *WELCOME TO VIEWPOINT GAMING PLATFORM* 💎\n\n"
        f"👋 Namaste *{user.first_name}*!\n\n"
        f"India's premier casino & skill gaming experience inside Telegram:\n"
        f"• 💣 *Mines* (Up to 10,000x multiplier)\n"
        f"• 🍗 *Chicken* (Mystake Cloche hunt)\n"
        f"• 🚀 *Crash* (Aviator Rocket flight)\n"
        f"• 🎨 *Tiranga Color Trading* (Win Go 30s)\n"
        f"• 📈 *Stock Market Trading* (Call/Put)\n\n"
        f"💰 *Current Balance:* ₹{db_user['balance']:,.2f}\n"
        f"🎁 *Starting Demo Funds:* ₹1,000.00 Credited\n\n"
        f"Click the button below to start playing instantly inside Telegram Mini App! 👇"
    )

    if is_new and referrer_id and referrer_id != user.id:
        try:
            await context.bot.send_message(
                chat_id=referrer_id,
                text=f"🎉 *New Referral Alert!*\nUser *{user.first_name}* just joined using your link!\n🎁 *₹{REFERRAL_BONUS_AMOUNT:.2f}* added to your wallet!",
                parse_mode="Markdown"
            )
        except Exception:
            pass

    await update.message.reply_text(
        text=welcome_text,
        reply_markup=get_main_menu_keyboard(bot_info.username, user.id),
        parse_mode="Markdown"
    )

async def play_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles /play command
    """
    user = update.effective_user
    bot_info = await context.bot.get_me()
    await update.message.reply_text(
        "🎮 Click below to launch **VIEWPOINT Mini App**:",
        reply_markup=get_main_menu_keyboard(bot_info.username, user.id),
        parse_mode="Markdown"
    )

async def wallet_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles /wallet and /balance command
    """
    user = update.effective_user
    db_user = db.get_user(user.id)
    if not db_user:
        db_user, _ = db.get_or_create_user(user.id, user.username or "", user.first_name or "")

    text = (
        f"💼 *YOUR VIEWPOINT WALLET*\n\n"
        f"👤 *Player:* {user.first_name} (`{user.id}`)\n"
        f"💰 *Available Balance:* ₹{db_user['balance']:,.2f}\n"
        f"📥 *Total Deposited:* ₹{db_user['total_deposited']:,.2f}\n"
        f"📤 *Total Withdrawn:* ₹{db_user['total_withdrawn']:,.2f}\n\n"
        f"⚡ Instant UPI Deposits & Fast Payouts available 24/7."
    )
    await update.message.reply_text(
        text=text,
        reply_markup=get_wallet_keyboard(),
        parse_mode="Markdown"
    )

async def bonus_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles /bonus command for daily rewards
    """
    user = update.effective_user
    success, msg = db.claim_daily_bonus(user.id)
    await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=get_back_keyboard())

async def referral_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles /referral command
    """
    user = update.effective_user
    bot_info = await context.bot.get_me()
    stats = db.get_referral_stats(user.id)
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{user.id}"

    text = (
        f"👥 *VIEWPOINT REFER & EARN PROGRAM*\n\n"
        f"Har friend ko invite karne par aapko milenge **₹{REFERRAL_BONUS_AMOUNT:.2f} Real Balance**!\n\n"
        f"📊 *Your Stats:*\n"
        f"• Total Friends Invited: *{stats['count']}*\n"
        f"• Total Referral Earnings: *₹{stats['earnings']:,.2f}*\n\n"
        f"🔗 *Your Unique Referral Link:*\n`{ref_link}`\n\n"
        f"Click below to share directly with your WhatsApp & Telegram groups! 🚀"
    )
    await update.message.reply_text(
        text=text,
        reply_markup=get_referral_keyboard(bot_info.username, user.id),
        parse_mode="Markdown"
    )

async def deposit_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Deposit instructions & prompts
    """
    user = update.effective_user
    USER_STATE[user.id] = "AWAITING_DEPOSIT_UTR"
    
    text = (
        f"💳 *ADD FUNDS / DEPOSIT VIA UPI*\n\n"
        f"1. Send money via GooglePay / PhonePe / Paytm to:\n"
        f"👉 UPI ID: `adrenox1@axl`\n"
        f"👉 Name: `VIEWPOINT Games`\n\n"
        f"2. Min Deposit: *₹200* | Max: *₹50,000*\n\n"
        f"3. Payment karne ke baad, **12-digit UTR No. and Amount** yahan message me reply karein:\n"
        f"Format: `<Amount> <UTR>` (e.g. `500 423984712039`)\n\n"
        f"Admin instantly verify karke aapka balance add kar dega!"
    )
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=get_back_keyboard())

async def withdraw_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Withdrawal prompts
    """
    user = update.effective_user
    db_user = db.get_user(user.id)
    if not db_user:
        db_user, _ = db.get_or_create_user(user.id, user.username or "", user.first_name or "")

    USER_STATE[user.id] = "AWAITING_WITHDRAW_DETAILS"
    text = (
        f"💸 *REQUEST WITHDRAWAL / PAYOUT*\n\n"
        f"💰 *Your Balance:* ₹{db_user['balance']:,.2f}\n"
        f"📌 *Min Payout:* ₹{MIN_WITHDRAW_AMOUNT:.2f}\n"
        f"🏷️ *Platform Fee:* 8%\n\n"
        f"Kripya withdrawal ke liye **Amount aur UPI ID** bhejein:\n"
        f"Format: `<Amount> <Your UPI ID>`\n"
        f"Example: `1000 player@okhdfcbank`"
    )
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=get_back_keyboard())

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Admin Panel statistics & management
    """
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        await update.message.reply_text("⛔ Unauthorized: You are not an admin.")
        return

    stats = db.get_total_stats()
    text = (
        f"👑 *VIEWPOINT ADMIN CONTROL PANEL*\n\n"
        f"👥 *Total Registered Players:* {stats['total_users']}\n"
        f"💰 *Total System Balance:* ₹{stats['total_balance']:,.2f}\n"
        f"📥 *Total Deposits:* ₹{stats['total_deposited']:,.2f}\n"
        f"📤 *Total Payouts:* ₹{stats['total_withdrawn']:,.2f}\n\n"
        f"⏳ *Pending Deposits:* {stats['pending_deposits']}\n"
        f"⏳ *Pending Withdrawals:* {stats['pending_withdrawals']}\n\n"
        f"📢 *Broadcast to all users:* `/broadcast <Your Message>`\n"
        f"➕ *Add Balance to User:* `/addfunds <TelegramID> <Amount>`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Broadcast message to all players
    """
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        return

    msg_text = " ".join(context.args) if context.args else ""
    if not msg_text:
        await update.message.reply_text("Format: `/broadcast <Your Announcement>`", parse_mode="Markdown")
        return

    user_ids = db.get_all_user_ids()
    sent_count = 0
    await update.message.reply_text(f"⏳ Broadcasting to {len(user_ids)} users...")

    for uid in user_ids:
        try:
            await context.bot.send_message(
                chat_id=uid,
                text=f"📢 *VIEWPOINT ANNOUNCEMENT* 📢\n\n{msg_text}",
                parse_mode="Markdown"
            )
            sent_count += 1
            await asyncio.sleep(0.05)
        except Exception:
            pass

    await update.message.reply_text(f"✅ Broadcast successfully delivered to {sent_count}/{len(user_ids)} users!")

async def addfunds_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Admin command: /addfunds <user_id> <amount>
    """
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        return

    if len(context.args) < 2:
        await update.message.reply_text("Format: `/addfunds <Telegram_ID> <Amount>`", parse_mode="Markdown")
        return

    try:
        target_id = int(context.args[0])
        amount = float(context.args[1])
        new_bal = db.update_balance(target_id, amount)
        await update.message.reply_text(f"✅ Successfully added ₹{amount:.2f} to user `{target_id}`. New Balance: ₹{new_bal:.2f}", parse_mode="Markdown")
        try:
            await context.bot.send_message(
                chat_id=target_id,
                text=f"🎁 *Admin Bonus / Funds Credited!*\n₹{amount:.2f} has been added to your wallet.\nCurrent Balance: ₹{new_bal:.2f}",
                parse_mode="Markdown"
            )
        except Exception:
            pass
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def handle_text_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles user state responses (Deposit UTR submissions, Withdrawal requests)
    """
    user = update.effective_user
    text = update.message.text.strip()
    state = USER_STATE.get(user.id)

    if state == "AWAITING_DEPOSIT_UTR":
        USER_STATE.pop(user.id, None)
        parts = text.split()
        if len(parts) >= 2:
            amount_str, utr_str = parts[0], parts[1]
        else:
            amount_str, utr_str = "500", parts[0]

        try:
            amount = float(amount_str)
        except ValueError:
            amount = 500.0

        dep_id = f"DEP-{user.id}-{int(asyncio.get_event_loop().time())}"
        db.create_deposit_request(dep_id, user.id, amount, utr_str, "adrenox1@axl")

        await update.message.reply_text(
            f"✅ *Deposit Request Received!*\n\n"
            f"💰 *Amount:* ₹{amount:,.2f}\n"
            f"🧾 *UTR:* `{utr_str}`\n\n"
            f"Hamara team verification kar rahi hai. 5-10 minutes me balance add ho jayega!",
            parse_mode="Markdown",
            reply_markup=get_back_keyboard()
        )

        # Notify Admins with Approve/Reject buttons
        admin_alert = (
            f"🔔 *NEW DEPOSIT REQUEST* 🔔\n\n"
            f"👤 *User:* {user.first_name} (`{user.id}`)\n"
            f"💰 *Amount:* ₹{amount:,.2f}\n"
            f"🧾 *UTR:* `{utr_str}`\n"
            f"🆔 *ID:* `{dep_id}`"
        )
        for admin_id in ADMIN_IDS:
            try:
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=admin_alert,
                    parse_mode="Markdown",
                    reply_markup=get_admin_approval_keyboard(dep_id, "DEP")
                )
            except Exception:
                pass

    elif state == "AWAITING_WITHDRAW_DETAILS":
        USER_STATE.pop(user.id, None)
        parts = text.split()
        if len(parts) < 2:
            await update.message.reply_text("❌ Invalid format! Please send `<Amount> <UPI_ID>` (e.g. `500 user@paytm`)")
            return

        try:
            amount = float(parts[0])
            receiver = parts[1]
        except ValueError:
            await update.message.reply_text("❌ Invalid amount.")
            return

        if amount < MIN_WITHDRAW_AMOUNT:
            await update.message.reply_text(f"❌ Minimum withdrawal amount is ₹{MIN_WITHDRAW_AMOUNT:.2f}")
            return

        wth_id = f"WTH-{user.id}-{int(asyncio.get_event_loop().time())}"
        success, res = db.create_withdrawal_request(wth_id, user.id, amount, receiver)
        if not success:
            await update.message.reply_text(f"❌ {res}")
            return

        await update.message.reply_text(
            f"✅ *Withdrawal Request Submitted!*\n\n"
            f"💰 *Gross Amount:* ₹{res['amount']:,.2f}\n"
            f"🏷️ *Fee (8%):* -₹{res['fee']:,.2f}\n"
            f"💵 *Net Payout to Receive:* ₹{res['net_payout']:,.2f}\n"
            f"💳 *UPI ID:* `{res['receiver']}`\n\n"
            f"Payout request process ho rahi hai.",
            parse_mode="Markdown",
            reply_markup=get_back_keyboard()
        )

        # Notify Admins with Approve/Reject buttons
        admin_alert = (
            f"💸 *NEW WITHDRAWAL REQUEST* 💸\n\n"
            f"👤 *User:* {user.first_name} (`{user.id}`)\n"
            f"💰 *Net Payout to Send:* *₹{res['net_payout']:,.2f}*\n"
            f"💳 *Send to UPI:* `{res['receiver']}`\n"
            f"🆔 *ID:* `{wth_id}`"
        )
        for admin_id in ADMIN_IDS:
            try:
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=admin_alert,
                    parse_mode="Markdown",
                    reply_markup=get_admin_approval_keyboard(wth_id, "WTH")
                )
            except Exception:
                pass

async def callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles all inline button clicks (Menu, Wallet, Daily Bonus, Admin Approvals)
    """
    query = update.callback_query
    await query.answer()
    data = query.data
    user = update.effective_user
    bot_info = await context.bot.get_me()

    if data == "btn_main_menu":
        db_user = db.get_user(user.id)
        if not db_user:
            db_user, _ = db.get_or_create_user(user.id, user.username or "", user.first_name or "")
        await query.edit_message_text(
            f"💎 *VIEWPOINT MAIN DASHBOARD* 💎\n\n"
            f"👤 *Player:* {user.first_name}\n"
            f"💰 *Balance:* ₹{db_user['balance']:,.2f}\n\n"
            f"Select an option below to play or manage your wallet:",
            parse_mode="Markdown",
            reply_markup=get_main_menu_keyboard(bot_info.username, user.id)
        )

    elif data == "btn_wallet":
        db_user = db.get_user(user.id)
        text = (
            f"💼 *YOUR VIEWPOINT WALLET*\n\n"
            f"👤 *Player:* {user.first_name} (`{user.id}`)\n"
            f"💰 *Available Balance:* ₹{db_user['balance']:,.2f}\n"
            f"📥 *Total Deposited:* ₹{db_user['total_deposited']:,.2f}\n"
            f"📤 *Total Withdrawn:* ₹{db_user['total_withdrawn']:,.2f}"
        )
        await query.edit_message_text(text, reply_markup=get_wallet_keyboard(), parse_mode="Markdown")

    elif data == "btn_daily_bonus":
        success, msg = db.claim_daily_bonus(user.id)
        await query.edit_message_text(msg, parse_mode="Markdown", reply_markup=get_back_keyboard())

    elif data == "btn_referral":
        stats = db.get_referral_stats(user.id)
        ref_link = f"https://t.me/{bot_info.username}?start=ref_{user.id}"
        text = (
            f"👥 *VIEWPOINT REFER & EARN*\n\n"
            f"• Friends Invited: *{stats['count']}*\n"
            f"• Total Earnings: *₹{stats['earnings']:,.2f}*\n\n"
            f"🔗 *Your Referral Link:*\n`{ref_link}`"
        )
        await query.edit_message_text(text, reply_markup=get_referral_keyboard(bot_info.username, user.id), parse_mode="Markdown")

    elif data == "btn_leaderboard":
        text = (
            f"🏆 *VIEWPOINT TOP PLAYERS TODAY*\n\n"
            f"🥇 *Player Rahul99:* ₹1,48,200.00 Win (Crash 58.2x)\n"
            f"🥈 *Player Aman_VIP:* ₹92,450.00 Win (Mines 24-gem)\n"
            f"🥉 *Player Vicky77:* ₹64,100.00 Win (Chicken)\n"
            f"4️⃣ *Player Kabir_X:* ₹45,000.00 Win (Win Go Green)\n\n"
            f"🔥 You could be next! Start playing now."
        )
        await query.edit_message_text(text, reply_markup=get_back_keyboard(), parse_mode="Markdown")

    elif data == "btn_deposit":
        USER_STATE[user.id] = "AWAITING_DEPOSIT_UTR"
        text = (
            f"💳 *ADD CASH VIA UPI*\n\n"
            f"1. Send money to UPI ID:\n`adrenox1@axl`\n\n"
            f"2. Then reply to this bot with:\n`<Amount> <12_Digit_UTR>`\n\n"
            f"Example: `500 428917263541`"
        )
        await query.edit_message_text(text, parse_mode="Markdown", reply_markup=get_back_keyboard())

    elif data == "btn_withdraw":
        USER_STATE[user.id] = "AWAITING_WITHDRAW_DETAILS"
        db_user = db.get_user(user.id)
        text = (
            f"💸 *REQUEST PAYOUT*\n\n"
            f"💰 Balance: ₹{db_user['balance']:,.2f}\n"
            f"Reply with: `<Amount> <Your UPI ID>`\n"
            f"Example: `1000 user@okhdfcbank`"
        )
        await query.edit_message_text(text, parse_mode="Markdown", reply_markup=get_back_keyboard())

    # Admin Approval Handlers
    elif data.startswith("adm_app_DEP_"):
        if user.id not in ADMIN_IDS:
            return
        dep_id = data.replace("adm_app_DEP_", "")
        success, dep = db.approve_deposit(dep_id)
        if success:
            await query.edit_message_text(f"✅ Approved Deposit `{dep_id}`! Credited ₹{dep['amount']:.2f} to user `{dep['telegram_id']}`.", parse_mode="Markdown")
            try:
                await context.bot.send_message(
                    chat_id=dep['telegram_id'],
                    text=f"🎉 *DEPOSIT APPROVED & CREDITED!*\n\n₹{dep['amount']:,.2f} has been added to your VIEWPOINT wallet. Play now!",
                    parse_mode="Markdown"
                )
            except Exception:
                pass
        else:
            await query.edit_message_text(f"⚠️ {dep}")

    elif data.startswith("adm_rej_DEP_"):
        if user.id not in ADMIN_IDS:
            return
        dep_id = data.replace("adm_rej_DEP_", "")
        success, dep = db.reject_deposit(dep_id)
        if success:
            await query.edit_message_text(f"❌ Rejected Deposit `{dep_id}` for user `{dep['telegram_id']}`.", parse_mode="Markdown")
            try:
                await context.bot.send_message(
                    chat_id=dep['telegram_id'],
                    text=f"❌ *Deposit Request Rejected*\nUTR verification failed. Please contact support @VIEWPOINT78 if you have paid.",
                    parse_mode="Markdown"
                )
            except Exception:
                pass

    elif data.startswith("adm_app_WTH_"):
        if user.id not in ADMIN_IDS:
            return
        wth_id = data.replace("adm_app_WTH_", "")
        success, wth = db.approve_withdrawal(wth_id)
        if success:
            await query.edit_message_text(f"✅ Approved Withdrawal `{wth_id}`! Payout sent.", parse_mode="Markdown")
            try:
                await context.bot.send_message(
                    chat_id=wth['telegram_id'],
                    text=f"🎉 *WITHDRAWAL SENT SUCCESSFULLY!*\n\nNet Payout ₹{wth['net_payout']:,.2f} has been transferred to your UPI `{wth['receiver']}`.",
                    parse_mode="Markdown"
                )
            except Exception:
                pass

    elif data.startswith("adm_rej_WTH_"):
        if user.id not in ADMIN_IDS:
            return
        wth_id = data.replace("adm_rej_WTH_", "")
        success, wth = db.reject_withdrawal(wth_id)
        if success:
            await query.edit_message_text(f"❌ Rejected Withdrawal `{wth_id}` & Refunded ₹{wth['amount']} to player.", parse_mode="Markdown")
            try:
                await context.bot.send_message(
                    chat_id=wth['telegram_id'],
                    text=f"❌ *Withdrawal Rejected & Refunded*\n₹{wth['amount']:,.2f} has been refunded to your wallet. Please check UPI details and re-request.",
                    parse_mode="Markdown"
                )
            except Exception:
                pass

def main():
    if not BOT_TOKEN or "1234567890" in BOT_TOKEN:
        print("\n" + "="*60)
        print("⚠️  BOT_TOKEN is not set yet in bot/.env file!")
        print("👉 Please edit bot/.env and enter your Telegram Bot Token.")
        print("="*60 + "\n")
        return

    print("🚀 Starting VIEWPOINT Telegram Bot...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("play", play_command))
    app.add_handler(CommandHandler("wallet", wallet_command))
    app.add_handler(CommandHandler("balance", wallet_command))
    app.add_handler(CommandHandler("bonus", bonus_command))
    app.add_handler(CommandHandler("referral", referral_command))
    app.add_handler(CommandHandler("deposit", deposit_command))
    app.add_handler(CommandHandler("withdraw", withdraw_command))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("broadcast", broadcast_command))
    app.add_handler(CommandHandler("addfunds", addfunds_command))

    # Callbacks and Messages
    app.add_handler(CallbackQueryHandler(callback_query_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_messages))

    print("✅ Bot is online and polling for updates! Press Ctrl+C to stop.")
    app.run_polling()

if __name__ == "__main__":
    main()
