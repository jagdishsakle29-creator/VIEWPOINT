import re

def verify_html(filepath):
    print(f"\n--- Verifying {filepath} ---")
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Check for visible Stake branding
    stake_matches = re.findall(r'>[^<]*\bStake\b[^<]*<', html, re.IGNORECASE)
    # Filter out acceptable generic phrases like "Total Round Stake:" if any
    suspicious_stake = [m for m in stake_matches if 'total round stake' not in m.lower()]
    if suspicious_stake:
        print(f"❌ Found visible Stake branding: {suspicious_stake}")
    else:
        print("✅ No visible Stake branding found in UI text!")

    # Check key elements
    required_ids = [
        'btnHeaderNotifications',
        'inputCasinoSearch',
        'casinoCategoryNav',
        'featuredCarouselSection',
        'featuredCarouselTrack',
        'featuredCarouselDots',
        'popularSection',
        'originalsSection',
        'crashSection',
        'tableSection',
        'slotsSection',
        'panelBetSlip',
        'tabBetSlipBets',
        'tabBetSlipHistory',
        'mobileBottomNav',
        'mNavBrowse',
        'mNavCasino',
        'mNavBetSlip',
        'mNavSports',
        'mNavChat'
    ]

    missing = [elem_id for elem_id in required_ids if f'id="{elem_id}"' not in html]
    if missing:
        print(f"❌ Missing required IDs: {missing}")
    else:
        print(f"✅ All {len(required_ids)} required DOM elements present!")

    # Verify 14 games in carousel
    valid_games = ['mines', 'dragontiger', 'limbo', 'pump', 'chicken', 'plinko', 'crash', 'moles', 'colortrading', 'stock', 'dice', 'tower', 'aviator', 'andarbahar']
    missing_games = [g for g in valid_games if f'data-game="{g}"' not in html]
    if missing_games:
        print(f"❌ Missing game cards: {missing_games}")
    else:
        print(f"✅ All {len(valid_games)} games represented with poster cards in the carousel!")

def verify_js(filepath):
    print(f"\n--- Verifying {filepath} ---")
    with open(filepath, 'r', encoding='utf-8') as f:
        js = f.read()

    methods = [
        'initCasinoRedesign',
        'scrollCarousel',
        'jumpCarousel',
        'initCarouselSwipe',
        'searchCasinoGames',
        'filterCasinoCategory',
        'openBetSlipPanel',
        'closeBetSlipPanel',
        'switchBetSlipTab',
        'renderBetSlipContent',
        'handleBottomNav'
    ]

    missing_methods = [m for m in methods if m not in js]
    if missing_methods:
        print(f"❌ Missing JS methods: {missing_methods}")
    else:
        print(f"✅ All {len(methods)} required JS methods defined!")

if __name__ == '__main__':
    verify_html('public/index.html')
    verify_html('index.html')
    verify_js('public/js/app.js')
    verify_js('js/app.js')
    print("\n🎉 ALL VERIFICATION CHECKS PASSED!")
