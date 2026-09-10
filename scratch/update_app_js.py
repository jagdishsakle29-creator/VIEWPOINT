import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update validGames list in bindEvents
old_valid_games = "const validGames = ['mines', 'dragontiger', 'limbo', 'pump', 'chicken', 'plinko', 'crash', 'moles', 'colortrading', 'stock', 'dice', 'tower', 'aviator', 'andarbahar', 'roulette'];"
new_valid_games = "const validGames = ['mines', 'dragontiger', 'limbo', 'pump', 'chicken', 'plinko', 'crash', 'moles', 'colortrading', 'stock', 'dice', 'tower', 'aviator', 'andarbahar', 'roulette', 'blackjack', 'baccarat', 'teenpatti', 'sicbo', 'megawheel', 'sevenup'];"
if old_valid_games in code:
    code = code.replace(old_valid_games, new_valid_games)
    print("✅ Updated validGames.")

# 2. Update viewsList in switchGame
old_views_list_end = """      document.getElementById('andarbaharView'),
      document.getElementById('rouletteView')
    ];"""

new_views_list_end = """      document.getElementById('andarbaharView'),
      document.getElementById('rouletteView'),
      document.getElementById('blackjackView'),
      document.getElementById('baccaratView'),
      document.getElementById('teenpattiView'),
      document.getElementById('sicboView'),
      document.getElementById('megawheelView'),
      document.getElementById('sevenupView')
    ];"""
if old_views_list_end in code:
    code = code.replace(old_views_list_end, new_views_list_end)
    print("✅ Updated viewsList.")

# 3. Update isFullWidthGame
old_full_width = "const isFullWidthGame = (gameType === 'dragontiger' || gameType === 'colortrading' || gameType === 'stock' || gameType === 'pump' || gameType === 'moles' || gameType === 'tower' || gameType === 'dice' || gameType === 'aviator' || gameType === 'andarbahar' || gameType === 'roulette');"
new_full_width = "const isFullWidthGame = (gameType === 'dragontiger' || gameType === 'colortrading' || gameType === 'stock' || gameType === 'pump' || gameType === 'moles' || gameType === 'tower' || gameType === 'dice' || gameType === 'aviator' || gameType === 'andarbahar' || gameType === 'roulette' || gameType === 'blackjack' || gameType === 'baccarat' || gameType === 'teenpatti' || gameType === 'sicbo' || gameType === 'megawheel' || gameType === 'sevenup');"
if old_full_width in code:
    code = code.replace(old_full_width, new_full_width)
    print("✅ Updated isFullWidthGame.")

# 4. Add new game instantiations in switchGame
roulette_branch = """    } else if (gameType === 'roulette') {
      const tab = document.getElementById('tabRoulette');
      if (tab) tab.classList.add('active');
      const v = document.getElementById('rouletteView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.rouletteGame && window.RouletteGame) {
        window.rouletteGame = new window.RouletteGame();
      }
      this.activeInstance = window.rouletteGame;
      if (window.rouletteGame && window.rouletteGame.init) {
        window.rouletteGame.init();
      }
    }"""

new_game_branches = """    } else if (gameType === 'roulette') {
      const tab = document.getElementById('tabRoulette');
      if (tab) tab.classList.add('active');
      const v = document.getElementById('rouletteView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.rouletteGame && window.RouletteGame) {
        window.rouletteGame = new window.RouletteGame();
      }
      this.activeInstance = window.rouletteGame;
      if (window.rouletteGame && window.rouletteGame.init) {
        window.rouletteGame.init();
      }
    } else if (gameType === 'blackjack') {
      const v = document.getElementById('blackjackView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.blackjackGame && window.BlackjackGame) {
        window.blackjackGame = new window.BlackjackGame();
      }
      this.activeInstance = window.blackjackGame;
    } else if (gameType === 'baccarat') {
      const v = document.getElementById('baccaratView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.baccaratGame && window.BaccaratGame) {
        window.baccaratGame = new window.BaccaratGame();
      }
      this.activeInstance = window.baccaratGame;
    } else if (gameType === 'teenpatti') {
      const v = document.getElementById('teenpattiView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.teenPattiGame && window.TeenPattiGame) {
        window.teenPattiGame = new window.TeenPattiGame();
      }
      this.activeInstance = window.teenPattiGame;
    } else if (gameType === 'sicbo') {
      const v = document.getElementById('sicboView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.sicBoGame && window.SicBoGame) {
        window.sicBoGame = new window.SicBoGame();
      }
      this.activeInstance = window.sicBoGame;
    } else if (gameType === 'megawheel') {
      const v = document.getElementById('megawheelView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.megaWheelGame && window.MegaWheelGame) {
        window.megaWheelGame = new window.MegaWheelGame();
      }
      this.activeInstance = window.megaWheelGame;
    } else if (gameType === 'sevenup') {
      const v = document.getElementById('sevenupView');
      if (v) { v.classList.add('active'); v.style.display = 'block'; }
      if (!window.sevenUpGame && window.SevenUpGame) {
        window.sevenUpGame = new window.SevenUpGame();
      }
      this.activeInstance = window.sevenUpGame;
    }"""
if roulette_branch in code:
    code = code.replace(roulette_branch, new_game_branches)
    print("✅ Inserted game branches into switchGame.")

# 5. Update categoryGameMap in filterCasinoCategory
old_cat_map = """    // Games belonging to each category
    const categoryGameMap = {
      'all': ['limbo', 'andarbahar', 'colortrading', 'dice', 'tower', 'pump', 'roulette', 'mines', 'aviator', 'dragontiger', 'crash', 'chicken', 'plinko', 'stock', 'moles'],
      'originals': ['mines', 'limbo', 'dice', 'tower', 'pump', 'plinko', 'moles'],
      'live': ['roulette', 'andarbahar', 'dragontiger', 'colortrading'],
      'crash': ['crash', 'aviator', 'chicken', 'limbo', 'pump'],
      'table': ['roulette', 'andarbahar', 'dragontiger', 'dice'],
      'slots': ['colortrading', 'stock', 'pump', 'moles'],
      'arcade': ['colortrading', 'stock', 'moles', 'pump'],
      'providers': ['limbo', 'andarbahar', 'colortrading', 'dice', 'tower', 'pump', 'roulette', 'mines', 'aviator', 'dragontiger', 'crash', 'chicken', 'plinko', 'stock', 'moles']
    };"""

new_cat_map = """    // Games belonging to each category (Including 9 Live Table Bet Games)
    const categoryGameMap = {
      'all': ['limbo', 'andarbahar', 'colortrading', 'dice', 'tower', 'pump', 'roulette', 'mines', 'aviator', 'dragontiger', 'crash', 'chicken', 'plinko', 'stock', 'moles', 'blackjack', 'baccarat', 'teenpatti', 'sicbo', 'megawheel', 'sevenup'],
      'originals': ['mines', 'limbo', 'dice', 'tower', 'pump', 'plinko', 'moles'],
      'live': ['roulette', 'blackjack', 'baccarat', 'dragontiger', 'andarbahar', 'teenpatti', 'sicbo', 'megawheel', 'sevenup', 'colortrading'],
      'crash': ['crash', 'aviator', 'chicken', 'limbo', 'pump'],
      'table': ['roulette', 'blackjack', 'baccarat', 'dragontiger', 'andarbahar', 'teenpatti', 'sicbo', 'sevenup', 'dice'],
      'slots': ['colortrading', 'stock', 'pump', 'moles'],
      'arcade': ['colortrading', 'stock', 'moles', 'pump'],
      'providers': ['limbo', 'andarbahar', 'colortrading', 'dice', 'tower', 'pump', 'roulette', 'mines', 'aviator', 'dragontiger', 'crash', 'chicken', 'plinko', 'stock', 'moles', 'blackjack', 'baccarat', 'teenpatti', 'sicbo', 'megawheel', 'sevenup']
    };

    // Show or hide dedicated Live Casino Studio section based on category
    const liveSec = document.getElementById('liveCasinoStudioSection');
    if (liveSec) {
      if (category === 'live') {
        liveSec.style.display = 'block';
        liveSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (category === 'all') {
        liveSec.style.display = 'block';
      } else {
        liveSec.style.display = 'none';
      }
    }"""
if old_cat_map in code:
    code = code.replace(old_cat_map, new_cat_map)
    print("✅ Updated categoryGameMap and liveSec display.")

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done writing public/js/app.js.")
