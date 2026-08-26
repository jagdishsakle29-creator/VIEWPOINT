"""
Telegram Keyboards and UI Layouts for VIEWPOINT Bot
"""
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from config import WEBAPP_URL, SUPPORT_CHANNEL, SUPPORT_ADMIN

def get_main_menu_keyboard(bot_username, user_id):
    """
    Main interactive menu with Play Game WebApp button
    """
    # Append user_id and tg_ref if needed to WebApp URL
    game_url = f"{WEBAPP_URL}?tg_user_id={user_id}" if "?" not in WEBAPP_URL else f"{WEBAPP_URL}&tg_user_id={user_id}"
    
    keyboard = [
        [
            InlineKeyboardButton("🚀 PLAY SHASAH CASINO (Mini App)", web_app=WebAppInfo(url=game_url))
        ],
        [
            InlineKeyboardButton("💰 My Wallet", callback_data="btn_wallet"),
            InlineKeyboardButton("🎁 Daily Bonus", callback_data="btn_daily_bonus")
        ],
        [
            InlineKeyboardButton("👥 Refer & Earn", callback_data="btn_referral"),
            InlineKeyboardButton("📊 Leaderboard", callback_data="btn_leaderboard")
        ],
        [
            InlineKeyboardButton("💳 Add Cash (Deposit)", callback_data="btn_deposit"),
            InlineKeyboardButton("💸 Payout (Withdraw)", callback_data="btn_withdraw")
        ],
        [
            InlineKeyboardButton("📢 Official Channel", url=f"https://t.me/{SUPPORT_CHANNEL.replace('@', '')}"),
            InlineKeyboardButton("💬 24/7 Support", url=f"https://t.me/{SUPPORT_ADMIN.replace('@', '')}")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_wallet_keyboard():
    keyboard = [
        [
            InlineKeyboardButton("💳 Deposit Funds", callback_data="btn_deposit"),
            InlineKeyboardButton("💸 Withdraw Balance", callback_data="btn_withdraw")
        ],
        [
            InlineKeyboardButton("🔙 Back to Main Menu", callback_data="btn_main_menu")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_referral_keyboard(bot_username, user_id):
    ref_link = f"https://t.me/{bot_username}?start=ref_{user_id}"
    share_text = f"🔥 Play Mines, Crash, Plinko & Limbo on SHASAH Casino and win real cash! Join now using my link: {ref_link}"
    share_url = f"https://t.me/share/url?url={ref_link}&text={share_text}"
    
    keyboard = [
        [
            InlineKeyboardButton("📲 Share Invite Link", url=share_url)
        ],
        [
            InlineKeyboardButton("🔙 Back to Main Menu", callback_data="btn_main_menu")
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_back_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔙 Back to Main Menu", callback_data="btn_main_menu")]
    ])

def get_admin_approval_keyboard(item_id, item_type="DEP"):
    """
    Approval buttons sent directly to Admin DM when user submits deposit/withdraw
    """
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Approve & Credit", callback_data=f"adm_app_{item_type}_{item_id}"),
            InlineKeyboardButton("❌ Reject / Decline", callback_data=f"adm_rej_{item_type}_{item_id}")
        ]
    ])
