import os
from pathlib import Path
# Base directory for bot
BASE_DIR = Path(__file__).resolve().parent

# Load .env if present (with fallback if python-dotenv is not installed)
env_path = BASE_DIR / ".env"
try:
    from dotenv import load_dotenv
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

# Bot Token
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()

# Admin IDs list
admin_ids_raw = os.getenv("ADMIN_IDS", "").strip()
ADMIN_IDS = [int(i.strip()) for i in admin_ids_raw.split(",") if i.strip().isdigit()]

# WebApp URL
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://viewpoint-1.vercel.app").strip()

# Support & Channels
SUPPORT_CHANNEL = os.getenv("SUPPORT_CHANNEL", "@telegram")
SUPPORT_ADMIN = os.getenv("SUPPORT_ADMIN", "@admin")

# Rewards & Bonuses
DAILY_BONUS_AMOUNT = float(os.getenv("DAILY_BONUS_AMOUNT", "50"))
REFERRAL_BONUS_AMOUNT = float(os.getenv("REFERRAL_BONUS_AMOUNT", "500"))
# Database path
DB_PATH = BASE_DIR / "bot_database.sqlite3"

# Admin Secret Passkey for Financial Approvals
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "VIEWPOINT_SECURE_ADMIN_KEY_7821").strip()
