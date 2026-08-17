# 🤖 VIEWPOINT Casino & Mines Telegram Bot Setup Guide

Yeh guide aapko Telegram Bot setup karne aur Mines Web Game se connect karne me help karegi.

---

## 📌 STEP 1: Telegram Bot Token Lena (@BotFather se)

1. Apne Telegram par **[@BotFather](https://t.me/BotFather)** open karein.
2. `/newbot` likhkar send karein.
3. Bot ka **Name** enter karein (e.g. `VIEWPOINT Games`).
4. Bot ka **Username** enter karein jo `bot` par khatam hota ho (e.g. `viewpoint_casino_bot`).
5. `@BotFather` aapko ek **HTTP API Token** dega (e.g. `7123456789:AAHk1_...`). Is token ko copy kar lijiye.

---

## 📌 STEP 2: Apni Telegram User ID Nikalna (@userinfobot se)

1. Telegram par **[@userinfobot](https://t.me/userinfobot)** open karein.
2. `/start` dabayein.
3. Wo aapko aapki numeric **Id** dega (e.g. `123456789`).

---

## 📌 STEP 3: Config File (.env) Banana

`minegame/bot/` folder ke andar `.env` file banayein (ya `.env.example` ko rename karein):

```env
# Step 1 se mila hua Token yahan dalein
BOT_TOKEN=7123456789:AAHk1_Your_Actual_Bot_Token_Here

# Step 2 se mili hui numeric ID dalein
ADMIN_IDS=123456789

# Aapka Web Game live URL (Netlify / Vercel / ngrok)
WEBAPP_URL=https://your-minegame.netlify.app

# Channel & Support Handle
SUPPORT_CHANNEL=@your_channel
SUPPORT_ADMIN=@VIEWPOINT78

# Rewards Configuration
DAILY_BONUS_AMOUNT=50
REFERRAL_BONUS_AMOUNT=100
MIN_WITHDRAW_AMOUNT=200
```

---

## 📌 STEP 4: Python Dependencies Install Karna

Terminal me `bot` folder me jakar run karein:

```bash
cd /Users/lord/Documents/minegame/bot
pip3 install -r requirements.txt
```

---

## 📌 STEP 5: Bot Run Karna

```bash
python3 bot.py
```

Console me aayega:
`✅ Bot is online and polling for updates!`

---

## 🎮 Telegram Mini App Menu Button Setup (@BotFather me)

Agar aap chahte hain ki Telegram chat ke bottom-left me direct **[🎮 Play Game]** ka button aaye:

1. `@BotFather` me jayein -> `/mybots` select karein.
2. Apna bot choose karein -> **Bot Settings** -> **Menu Button** -> **Configure menu button**.
3. Apna Web Game URL enter karein (`https://your-minegame.netlify.app`) aur button text likhein: `🚀 Play Game`.

---

## 👑 Bot Commands & Admin Controls

### Players ke liye:
- `/start` - Welcome banner, ₹1,000 bonus & Play Game button
- `/play` - Instant Mini App Game launcher
- `/wallet` - Balance, deposits & payout summary
- `/bonus` - Daily ₹50 bonus claim
- `/referral` - Unique invite link & earnings stats (₹100 per friend)
- `/deposit` - UPI Deposit instructions & UTR verification
- `/withdraw` - Instant payout request

### Admin ke liye:
- `/admin` - Live user count, total deposits, withdrawals & pending queue
- `/broadcast <Message>` - Sabhi players ko instant message bhejna
- `/addfunds <TelegramID> <Amount>` - Kisi bhi player ke wallet me direct balance add karna
- **Inline Approval Buttons**: Jab koi player Deposit ya Withdraw karega, Admin ke DM me **[✅ Approve] / [❌ Reject]** ke buttons aayenge jisse 1-click me balance approve/refund ho jata hai.
