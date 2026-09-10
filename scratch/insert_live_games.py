import re

# Read public/index.html
with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. New Carousel Cards to insert before </div> of #featuredCarouselTrack
carousel_new_cards = '''
        <!-- 16. Live Blackjack 21 Poster Card -->
        <div class="game-poster-card" data-game="blackjack" data-category="live table popular all" onclick="window.switchGame ? window.switchGame('blackjack') : (window.app && window.app.switchGame('blackjack'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #152e28 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 6.8k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(16, 185, 129, 0.5));">🃏21</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live Blackjack 21</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>

        <!-- 17. Live Baccarat Poster Card -->
        <div class="game-poster-card" data-game="baccarat" data-category="live table all" onclick="window.switchGame ? window.switchGame('baccarat') : (window.app && window.app.switchGame('baccarat'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #301728 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 4.9k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(236, 72, 153, 0.5));">🎴✨</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live Baccarat</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>

        <!-- 18. Live Teen Patti Poster Card -->
        <div class="game-poster-card" data-game="teenpatti" data-category="live table popular all" onclick="window.switchGame ? window.switchGame('teenpatti') : (window.app && window.app.switchGame('teenpatti'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #3d2a08 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 4.5k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(245, 158, 11, 0.5));">👑🎴</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live Teen Patti</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>

        <!-- 19. Live Super Sic Bo Poster Card -->
        <div class="game-poster-card" data-game="sicbo" data-category="live table dice all" onclick="window.switchGame ? window.switchGame('sicbo') : (window.app && window.app.switchGame('sicbo'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #172554 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 3.8k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(59, 130, 246, 0.5));">🎲⚡</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live Super Sic Bo</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>

        <!-- 20. Live Mega Money Wheel Poster Card -->
        <div class="game-poster-card" data-game="megawheel" data-category="live table popular all" onclick="window.switchGame ? window.switchGame('megawheel') : (window.app && window.app.switchGame('megawheel'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #360a38 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 7.2k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(217, 70, 239, 0.5));">🎡💥</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live Mega Wheel</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>

        <!-- 21. Live 7 Up 7 Down Poster Card -->
        <div class="game-poster-card" data-game="sevenup" data-category="live table dice all" onclick="window.switchGame ? window.switchGame('sevenup') : (window.app && window.app.switchGame('sevenup'))">
          <div class="game-poster-visual" style="background: radial-gradient(circle at 50% 40%, #1e1b4b 0%, #090d16 100%);">
            <span class="game-poster-badge live">🔴 LIVE</span>
            <span class="game-poster-players">⚡ 3.5k</span>
            <div style="font-size: 42px; filter: drop-shadow(0 6px 16px rgba(99, 102, 241, 0.5));">🎲🎲</div>
            <div class="game-poster-hover-play">
              <div class="play-circle-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
            </div>
          </div>
          <div class="game-poster-info">
            <div class="game-poster-name">Live 7 Up 7 Down</div>
            <div class="game-poster-provider">View Point Live</div>
          </div>
        </div>
'''

target_track_end = '<!-- 15. Moles Burrow Poster Card -->\n        <div class="game-poster-card" data-game="moles"'
if target_track_end in html and 'data-game="blackjack"' not in html:
    # Find the end of moles card:
    moles_pos = html.find(target_track_end)
    moles_card_end = html.find('</div>\n        </div>\n      </div>', moles_pos)
    if moles_card_end != -1:
        insert_pt = moles_card_end + len('</div>\n        </div>')
        html = html[:insert_pt] + carousel_new_cards + html[insert_pt:]
        print("✅ Inserted new carousel cards.")

# 2. Dedicated Live Section
live_studio_section_html = '''
    <!-- Dedicated Stake-Style Live Casino & Table Bet Studio Section -->
    <div class="live-studio-section" id="liveCasinoStudioSection">
      <div class="live-studio-header-row">
        <div class="live-studio-title-block">
          <h2 class="live-studio-heading">
            <span class="live-pulse-badge"><span class="live-dot-pulse"></span> 9 LIVE TABLES ACTIVE</span>
            <span>Stake Live Casino Studio</span>
          </h2>
          <p class="live-studio-subtitle">Experience high-definition live dealer action with real-time video simulation and instant chip payouts</p>
        </div>
        <div class="live-studio-filter-pills">
          <button type="button" class="live-subfilter-btn active" onclick="window.filterLiveStudio('all', this)">All (9)</button>
          <button type="button" class="live-subfilter-btn" onclick="window.filterLiveStudio('cards', this)">Cards (4)</button>
          <button type="button" class="live-subfilter-btn" onclick="window.filterLiveStudio('roulette', this)">Roulette (1)</button>
          <button type="button" class="live-subfilter-btn" onclick="window.filterLiveStudio('dice', this)">Dice & Wheels (4)</button>
        </div>
      </div>

      <div class="live-tables-grid" id="liveTablesGrid">
        <!-- 1. Live European Roulette -->
        <div class="live-table-card" data-live-game="roulette" data-group="roulette all" onclick="window.switchGame('roulette')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #381515 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 5.4k</span>
            <div class="live-card-icon">🎡</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Elena</span>
              <span class="table-name">VIP European Roulette</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹50,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 2. Live Blackjack 21 -->
        <div class="live-table-card" data-live-game="blackjack" data-group="cards all" onclick="window.switchGame('blackjack')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #152e28 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 6.8k</span>
            <div class="live-card-icon">🃏21</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Marcus</span>
              <span class="table-name">Live Blackjack VIP</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹25,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 3. Live Baccarat -->
        <div class="live-table-card" data-live-game="baccarat" data-group="cards all" onclick="window.switchGame('baccarat')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #301728 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 4.9k</span>
            <div class="live-card-icon">🎴✨</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Sophia</span>
              <span class="table-name">Speed Baccarat A</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹50 • Max ₹1,00,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 4. Live Dragon Tiger -->
        <div class="live-table-card" data-live-game="dragontiger" data-group="cards all" onclick="window.switchGame('dragontiger')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #331520 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 5.1k</span>
            <div class="live-card-icon">🐉🐯</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Vikram</span>
              <span class="table-name">Lightning Dragon Tiger</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹50,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 5. Live Andar Bahar -->
        <div class="live-table-card" data-live-game="andarbahar" data-group="cards all" onclick="window.switchGame('andarbahar')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #382405 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 6.2k</span>
            <div class="live-card-icon">🃏👑</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Priya</span>
              <span class="table-name">Royal Andar Bahar</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹30,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 6. Live Teen Patti -->
        <div class="live-table-card" data-live-game="teenpatti" data-group="cards all" onclick="window.switchGame('teenpatti')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #3d2a08 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 4.5k</span>
            <div class="live-card-icon">👑🎴</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Aarav</span>
              <span class="table-name">Teen Patti 20-20 Live</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹20,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 7. Live Super Sic Bo -->
        <div class="live-table-card" data-live-game="sicbo" data-group="dice all" onclick="window.switchGame('sicbo')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #172554 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 3.8k</span>
            <div class="live-card-icon">🎲⚡</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Isabella</span>
              <span class="table-name">Super Sic Bo 500x</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹50,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 8. Live Mega Money Wheel -->
        <div class="live-table-card" data-live-game="megawheel" data-group="dice all" onclick="window.switchGame('megawheel')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #360a38 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE HOST</span>
            <span class="live-player-count">⚡ 7.2k</span>
            <div class="live-card-icon">🎡💥</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Host Lucas</span>
              <span class="table-name">Mega Money Wheel 40x</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹50,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>

        <!-- 9. Live 7 Up 7 Down -->
        <div class="live-table-card" data-live-game="sevenup" data-group="dice all" onclick="window.switchGame('sevenup')">
          <div class="live-table-visual" style="background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0b0f19 100%);">
            <span class="live-dealer-tag">🔴 LIVE DEALER</span>
            <span class="live-player-count">⚡ 3.5k</span>
            <div class="live-card-icon">🎲🎲</div>
            <div class="live-dealer-host-info">
              <span class="host-name">Dealer Chloe</span>
              <span class="table-name">Lucky 7 Up 7 Down</span>
            </div>
          </div>
          <div class="live-table-footer">
            <div class="live-table-limits">Min ₹10 • Max ₹25,000</div>
            <button type="button" class="btn-live-play">BET NOW</button>
          </div>
        </div>
      </div>
    </div>
'''

arena_pos = html.find('<!-- Main Game Box -->\n    <div class="game-arena">')
if arena_pos != -1 and 'id="liveCasinoStudioSection"' not in html:
    html = html[:arena_pos] + live_studio_section_html + '\n    ' + html[arena_pos:]
    print("✅ Inserted #liveCasinoStudioSection.")

# 3. New Game Views
new_views_html = '''
        <!-- Game: Live Dealer Blackjack 21 View -->
        <div id="blackjackView" class="game-view blackjack-view" style="display: none;">
          <div class="live-table-stage bj-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE DEALER • BLACKJACK VIP</span>
              </div>
              <div class="live-round-id" id="bjRoundIdTag">BJ-0001</div>
            </div>

            <!-- Dealer Area -->
            <div class="bj-hand-section dealer-section">
              <div class="bj-hand-header">
                <span class="bj-hand-label">DEALER</span>
                <span class="bj-hand-score" id="bjDealerScore">0</span>
              </div>
              <div class="bj-cards-container" id="bjDealerCards">
                <div class="bj-card-placeholder">DEALER SHOE</div>
              </div>
            </div>

            <!-- Table Center / Status Banner -->
            <div class="bj-center-felt">
              <div class="bj-felt-text">BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17</div>
              <div class="live-status-pill" id="bjStatusText">PLACE YOUR BET & DEAL</div>
              <div class="live-win-banner" id="bjWinBanner" style="display: none;"></div>
            </div>

            <!-- Player Area -->
            <div class="bj-hand-section player-section">
              <div class="bj-hand-header">
                <span class="bj-hand-label">PLAYER</span>
                <span class="bj-hand-score" id="bjPlayerScore">0</span>
              </div>
              <div class="bj-cards-container" id="bjPlayerCards">
                <div class="bj-card-placeholder">YOUR HAND</div>
              </div>
            </div>

            <!-- History Bead Row -->
            <div class="live-history-strip">
              <span class="live-history-title">History:</span>
              <div class="live-history-track" id="bjHistoryRow"></div>
            </div>
          </div>

          <!-- Blackjack Betting & Action Controls -->
          <div class="live-table-controls">
            <!-- Chips Row -->
            <div class="live-chips-row">
              <button type="button" class="live-chip-btn bj-chip-btn active" data-amount="10" onclick="window.blackjackGame && window.blackjackGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn bj-chip-btn" data-amount="50" onclick="window.blackjackGame && window.blackjackGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn bj-chip-btn" data-amount="100" onclick="window.blackjackGame && window.blackjackGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn bj-chip-btn" data-amount="500" onclick="window.blackjackGame && window.blackjackGame.setChip(500)">₹500</button>
              <button type="button" class="live-chip-btn bj-chip-btn" data-amount="1000" onclick="window.blackjackGame && window.blackjackGame.setChip(1000)">₹1k</button>
              <button type="button" class="live-chip-btn bj-chip-btn" data-amount="5000" onclick="window.blackjackGame && window.blackjackGame.setChip(5000)">₹5k</button>
            </div>

            <!-- Betting Controls (Initial Phase) -->
            <div class="live-btn-group" id="bjBettingControls">
              <input type="number" id="bjBetAmountInput" class="live-amount-input" value="10" min="1" step="1">
              <button type="button" id="btnBjDeal" class="btn-live-primary" onclick="window.blackjackGame && window.blackjackGame.startDeal()">⚡ DEAL (BET)</button>
            </div>

            <!-- Player Turn Actions (Hit, Stand, Double) -->
            <div class="live-btn-group" id="bjActionControls" style="display: none;">
              <button type="button" id="btnBjHit" class="btn-live-action hit" onclick="window.blackjackGame && window.blackjackGame.hit()">➕ HIT</button>
              <button type="button" id="btnBjStand" class="btn-live-action stand" onclick="window.blackjackGame && window.blackjackGame.stand()">✋ STAND</button>
              <button type="button" id="btnBjDouble" class="btn-live-action double" onclick="window.blackjackGame && window.blackjackGame.doubleDown()">⚡ 2X DOUBLE</button>
            </div>
          </div>
        </div>

        <!-- Game: Live Baccarat View -->
        <div id="baccaratView" class="game-view baccarat-view" style="display: none;">
          <div class="live-table-stage bac-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE DEALER • SPEED BACCARAT</span>
              </div>
              <div class="live-round-id" id="bacRoundIdTag">BAC-0001</div>
            </div>

            <!-- Player vs Banker Card Comparison Grid -->
            <div class="bac-cards-grid">
              <div class="bac-side player-side">
                <div class="bac-side-title">PLAYER <span class="bac-side-score" id="bacPlayerScore">0</span></div>
                <div class="bac-cards-row" id="bacPlayerCards"></div>
              </div>
              <div class="bac-vs-badge">VS</div>
              <div class="bac-side banker-side">
                <div class="bac-side-title">BANKER <span class="bac-side-score" id="bacBankerScore">0</span></div>
                <div class="bac-cards-row" id="bacBankerCards"></div>
              </div>
            </div>

            <div class="live-status-pill" id="bacStatusText">PLACE BETS ON PLAYER, BANKER OR TIE</div>
            <div class="live-win-banner" id="bacWinBanner" style="display: none;"></div>

            <!-- Bead Road History -->
            <div class="live-history-strip">
              <span class="live-history-title">Roadmap:</span>
              <div class="live-history-track" id="bacBeadRoad"></div>
            </div>
          </div>

          <!-- Baccarat Interactive Felt Spots -->
          <div class="bac-board-container">
            <div class="bac-bet-spots-row">
              <div class="bac-spot spot-ppair" id="bacBetSpot_playerPair" onclick="window.baccaratGame && window.baccaratGame.placeBet('playerPair')">
                <div class="bac-spot-lbl">PLAYER PAIR</div>
                <div class="bac-spot-odds">11:1</div>
                <span class="bac-chip-badge" id="bacChipBadge_playerPair" style="display:none;"></span>
              </div>
              <div class="bac-spot spot-player" id="bacBetSpot_player" onclick="window.baccaratGame && window.baccaratGame.placeBet('player')">
                <div class="bac-spot-lbl">PLAYER</div>
                <div class="bac-spot-odds">1:1</div>
                <span class="bac-chip-badge" id="bacChipBadge_player" style="display:none;"></span>
              </div>
              <div class="bac-spot spot-tie" id="bacBetSpot_tie" onclick="window.baccaratGame && window.baccaratGame.placeBet('tie')">
                <div class="bac-spot-lbl">TIE</div>
                <div class="bac-spot-odds">8:1</div>
                <span class="bac-chip-badge" id="bacChipBadge_tie" style="display:none;"></span>
              </div>
              <div class="bac-spot spot-banker" id="bacBetSpot_banker" onclick="window.baccaratGame && window.baccaratGame.placeBet('banker')">
                <div class="bac-spot-lbl">BANKER</div>
                <div class="bac-spot-odds">0.95:1</div>
                <span class="bac-chip-badge" id="bacChipBadge_banker" style="display:none;"></span>
              </div>
              <div class="bac-spot spot-bpair" id="bacBetSpot_bankerPair" onclick="window.baccaratGame && window.baccaratGame.placeBet('bankerPair')">
                <div class="bac-spot-lbl">BANKER PAIR</div>
                <div class="bac-spot-odds">11:1</div>
                <span class="bac-chip-badge" id="bacChipBadge_bankerPair" style="display:none;"></span>
              </div>
            </div>

            <div class="live-chips-row">
              <button type="button" class="live-chip-btn bac-chip-btn active" data-amount="10" onclick="window.baccaratGame && window.baccaratGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn bac-chip-btn" data-amount="50" onclick="window.baccaratGame && window.baccaratGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn bac-chip-btn" data-amount="100" onclick="window.baccaratGame && window.baccaratGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn bac-chip-btn" data-amount="500" onclick="window.baccaratGame && window.baccaratGame.setChip(500)">₹500</button>
              <button type="button" class="live-chip-btn bac-chip-btn" data-amount="1000" onclick="window.baccaratGame && window.baccaratGame.setChip(1000)">₹1k</button>
            </div>

            <div class="live-btn-group">
              <button type="button" id="btnBacClear" class="btn-live-tool">✕ CLEAR</button>
              <button type="button" id="btnBacDouble" class="btn-live-tool">2X DOUBLE</button>
              <button type="button" id="btnBacDeal" class="btn-live-primary" disabled onclick="window.baccaratGame && window.baccaratGame.startDeal()">⚡ DEAL NOW</button>
            </div>
          </div>
        </div>

        <!-- Game: Live Teen Patti View -->
        <div id="teenpattiView" class="game-view teenpatti-view" style="display: none;">
          <div class="live-table-stage tp-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE DEALER • TEEN PATTI 20-20</span>
              </div>
              <div class="live-round-id" id="tpRoundIdTag">TP-0001</div>
            </div>

            <!-- Dealer 3 Cards -->
            <div class="tp-hand-card-box">
              <div class="tp-hand-title">DEALER HAND <span class="tp-hand-rank" id="tpDealerRankText">Hidden</span></div>
              <div class="tp-cards-row" id="tpDealerCards"></div>
            </div>

            <div class="live-status-pill" id="tpStatusText">SET ANTE & DEAL 3 CARDS</div>
            <div class="live-win-banner" id="tpWinBanner" style="display: none;"></div>

            <!-- Player 3 Cards -->
            <div class="tp-hand-card-box">
              <div class="tp-hand-title">YOUR HAND <span class="tp-hand-rank" id="tpPlayerRankText">Your Cards</span></div>
              <div class="tp-cards-row" id="tpPlayerCards"></div>
            </div>

            <div class="live-history-strip">
              <span class="live-history-title">History:</span>
              <div class="live-history-track" id="tpHistoryRow"></div>
            </div>
          </div>

          <div class="live-table-controls">
            <div class="live-chips-row">
              <button type="button" class="live-chip-btn tp-chip-btn active" data-amount="10" onclick="window.teenPattiGame && window.teenPattiGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn tp-chip-btn" data-amount="50" onclick="window.teenPattiGame && window.teenPattiGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn tp-chip-btn" data-amount="100" onclick="window.teenPattiGame && window.teenPattiGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn tp-chip-btn" data-amount="500" onclick="window.teenPattiGame && window.teenPattiGame.setChip(500)">₹500</button>
            </div>

            <div class="tp-inputs-row" id="tpBettingControls">
              <div class="tp-input-col">
                <label>ANTE (MANDATORY)</label>
                <input type="number" id="tpAnteInput" class="live-amount-input" value="10" min="1">
              </div>
              <div class="tp-input-col">
                <label>PAIR PLUS (BONUS UP TO 30:1)</label>
                <input type="number" id="tpPairPlusInput" class="live-amount-input" value="0" min="0">
              </div>
              <button type="button" id="btnTpDeal" class="btn-live-primary" onclick="window.teenPattiGame && window.teenPattiGame.startDeal()">⚡ DEAL HAND</button>
            </div>

            <div class="live-btn-group" id="tpDecisionControls" style="display: none;">
              <button type="button" id="btnTpPlay" class="btn-live-action hit" onclick="window.teenPattiGame && window.teenPattiGame.playHand()">🟢 PLAY (CALL BET)</button>
              <button type="button" id="btnTpFold" class="btn-live-action stand" onclick="window.teenPattiGame && window.teenPattiGame.foldHand()">🔴 FOLD</button>
            </div>
          </div>
        </div>

        <!-- Game: Live Super Sic Bo View -->
        <div id="sicboView" class="game-view sicbo-view" style="display: none;">
          <div class="live-table-stage sb-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE DEALER • SUPER SIC BO 500x</span>
              </div>
              <div class="live-round-id" id="sbRoundIdTag">SB-0001</div>
            </div>

            <!-- Glass Dome Dice Shaker -->
            <div class="sb-shaker-wrapper">
              <div class="sb-glass-dome" id="sbDiceDome">
                <div class="sb-die" id="sbDie1">⚀</div>
                <div class="sb-die" id="sbDie2">⚂</div>
                <div class="sb-die" id="sbDie3">⚄</div>
              </div>
              <div class="sb-total-pill" id="sbDiceTotal">TOTAL: 9 (SMALL)</div>
            </div>

            <div class="live-status-pill" id="sbStatusText">PLACE BETS & WATCH FOR LIGHTNING MULTIPLIERS</div>
            <div class="live-win-banner" id="sbWinBanner" style="display: none;"></div>

            <div class="live-history-strip">
              <span class="live-history-title">History:</span>
              <div class="live-history-track" id="sbHistoryRow"></div>
            </div>
          </div>

          <!-- Sic Bo Betting Felt -->
          <div class="sb-board-container">
            <div class="sb-main-row">
              <div class="sb-bet-spot spot-small" data-spot="small" onclick="window.sicBoGame && window.sicBoGame.placeBet('small')">
                <div class="sb-spot-title">SMALL (4 - 10)</div>
                <div class="sb-spot-payout">1:1 (Triples Lose)</div>
                <span class="sb-chip-badge" style="display:none;"></span>
              </div>
              <div class="sb-bet-spot spot-triple" data-spot="any_triple" onclick="window.sicBoGame && window.sicBoGame.placeBet('any_triple')">
                <div class="sb-spot-title">ANY TRIPLE</div>
                <div class="sb-spot-payout">30x <span class="sb-lightning-badge" data-spot="any_triple" style="display:none;"></span></div>
                <span class="sb-chip-badge" style="display:none;"></span>
              </div>
              <div class="sb-bet-spot spot-big" data-spot="big" onclick="window.sicBoGame && window.sicBoGame.placeBet('big')">
                <div class="sb-spot-title">BIG (11 - 17)</div>
                <div class="sb-spot-payout">1:1 (Triples Lose)</div>
                <span class="sb-chip-badge" style="display:none;"></span>
              </div>
            </div>

            <div class="sb-sums-row">
              <div class="sb-bet-spot spot-sum" data-spot="sum_4" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_4')">4 <span class="sb-lightning-badge" data-spot="sum_4" style="display:none;"></span><span class="sb-chip-badge" style="display:none;"></span></div>
              <div class="sb-bet-spot spot-sum" data-spot="sum_7" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_7')">7 <span class="sb-chip-badge" style="display:none;"></span></div>
              <div class="sb-bet-spot spot-sum" data-spot="sum_10" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_10')">10 <span class="sb-chip-badge" style="display:none;"></span></div>
              <div class="sb-bet-spot spot-sum" data-spot="sum_11" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_11')">11 <span class="sb-chip-badge" style="display:none;"></span></div>
              <div class="sb-bet-spot spot-sum" data-spot="sum_14" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_14')">14 <span class="sb-chip-badge" style="display:none;"></span></div>
              <div class="sb-bet-spot spot-sum" data-spot="sum_17" onclick="window.sicBoGame && window.sicBoGame.placeBet('sum_17')">17 <span class="sb-lightning-badge" data-spot="sum_17" style="display:none;"></span><span class="sb-chip-badge" style="display:none;"></span></div>
            </div>

            <div class="live-chips-row">
              <button type="button" class="live-chip-btn sb-chip-btn active" data-amount="10" onclick="window.sicBoGame && window.sicBoGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn sb-chip-btn" data-amount="50" onclick="window.sicBoGame && window.sicBoGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn sb-chip-btn" data-amount="100" onclick="window.sicBoGame && window.sicBoGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn sb-chip-btn" data-amount="500" onclick="window.sicBoGame && window.sicBoGame.setChip(500)">₹500</button>
            </div>

            <div class="live-btn-group">
              <button type="button" id="btnSbClear" class="btn-live-tool">✕ CLEAR</button>
              <button type="button" id="btnSbDouble" class="btn-live-tool">2X DOUBLE</button>
              <button type="button" id="btnSbRoll" class="btn-live-primary" disabled onclick="window.sicBoGame && window.sicBoGame.rollDice()">⚡ SHAKE DOME</button>
            </div>
          </div>
        </div>

        <!-- Game: Live Mega Money Wheel View -->
        <div id="megawheelView" class="game-view megawheel-view" style="display: none;">
          <div class="live-table-stage mw-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE HOST • MEGA MONEY WHEEL</span>
              </div>
              <div class="live-round-id" id="mwRoundIdTag">MW-0001</div>
            </div>

            <!-- Big Wheel Canvas -->
            <div class="mw-wheel-container">
              <div class="mw-top-pointer">▼</div>
              <canvas id="mwWheelCanvas" width="280" height="280"></canvas>
            </div>

            <div class="live-status-pill" id="mwStatusText">CHOOSE MULTIPLIER (1x, 2x, 5x, 10x, 20x, 40x)</div>
            <div class="live-win-banner" id="mwWinBanner" style="display: none;"></div>

            <div class="live-history-strip">
              <span class="live-history-title">History:</span>
              <div class="live-history-track" id="mwHistoryRow"></div>
            </div>
          </div>

          <!-- Mega Wheel Betting Spots -->
          <div class="mw-board-container">
            <div class="mw-spots-grid">
              <div class="mw-bet-spot spot-1x" id="mwBetSpot_1x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('1x')">
                <span class="mw-spot-tag">1x</span>
                <span class="mw-spot-sub">Pays 1:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_1x" style="display:none;"></span>
              </div>
              <div class="mw-bet-spot spot-2x" id="mwBetSpot_2x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('2x')">
                <span class="mw-spot-tag">2x</span>
                <span class="mw-spot-sub">Pays 2:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_2x" style="display:none;"></span>
              </div>
              <div class="mw-bet-spot spot-5x" id="mwBetSpot_5x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('5x')">
                <span class="mw-spot-tag">5x</span>
                <span class="mw-spot-sub">Pays 5:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_5x" style="display:none;"></span>
              </div>
              <div class="mw-bet-spot spot-10x" id="mwBetSpot_10x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('10x')">
                <span class="mw-spot-tag">10x</span>
                <span class="mw-spot-sub">Pays 10:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_10x" style="display:none;"></span>
              </div>
              <div class="mw-bet-spot spot-20x" id="mwBetSpot_20x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('20x')">
                <span class="mw-spot-tag">20x</span>
                <span class="mw-spot-sub">Pays 20:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_20x" style="display:none;"></span>
              </div>
              <div class="mw-bet-spot spot-40x" id="mwBetSpot_40x" onclick="window.megaWheelGame && window.megaWheelGame.placeBet('40x')">
                <span class="mw-spot-tag">40x</span>
                <span class="mw-spot-sub">Pays 40:1</span>
                <span class="mw-chip-badge" id="mwChipBadge_40x" style="display:none;"></span>
              </div>
            </div>

            <div class="live-chips-row">
              <button type="button" class="live-chip-btn mw-chip-btn active" data-amount="10" onclick="window.megaWheelGame && window.megaWheelGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn mw-chip-btn" data-amount="50" onclick="window.megaWheelGame && window.megaWheelGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn mw-chip-btn" data-amount="100" onclick="window.megaWheelGame && window.megaWheelGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn mw-chip-btn" data-amount="500" onclick="window.megaWheelGame && window.megaWheelGame.setChip(500)">₹500</button>
            </div>

            <div class="live-btn-group">
              <button type="button" id="btnMwClear" class="btn-live-tool">✕ CLEAR</button>
              <button type="button" id="btnMwDouble" class="btn-live-tool">2X DOUBLE</button>
              <button type="button" id="btnMwSpin" class="btn-live-primary" disabled onclick="window.megaWheelGame && window.megaWheelGame.spinWheel()">⚡ SPIN WHEEL</button>
            </div>
          </div>
        </div>

        <!-- Game: Live 7 Up 7 Down View -->
        <div id="sevenupView" class="game-view sevenup-view" style="display: none;">
          <div class="live-table-stage su-stage">
            <div class="live-table-top-bar">
              <div class="live-dealer-badge">
                <span class="live-dot-pulse"></span>
                <span>🔴 LIVE DEALER • 7 UP 7 DOWN</span>
              </div>
              <div class="live-round-id" id="suRoundIdTag">7U-0001</div>
            </div>

            <!-- Dual Dice Chamber -->
            <div class="su-dice-chamber">
              <div class="su-die" id="suDie1">⚁</div>
              <div class="su-die" id="suDie2">⚄</div>
            </div>
            <div class="su-dice-total-pill" id="suDiceTotal">SUM: 7 (LUCKY 7)</div>

            <div class="live-status-pill" id="suStatusText">CHOOSE 7 DOWN, LUCKY 7, OR 7 UP</div>
            <div class="live-win-banner" id="suWinBanner" style="display: none;"></div>

            <div class="live-history-strip">
              <span class="live-history-title">History:</span>
              <div class="live-history-track" id="suHistoryRow"></div>
            </div>
          </div>

          <!-- 7 Up 7 Down Betting Zones -->
          <div class="su-board-container">
            <div class="su-zones-row">
              <div class="su-bet-spot spot-down" id="suBetSpot_down" onclick="window.sevenUpGame && window.sevenUpGame.placeBet('down')">
                <div class="su-zone-title">7 DOWN</div>
                <div class="su-zone-sub">Numbers 2, 3, 4, 5, 6</div>
                <div class="su-zone-payout">2.0X</div>
                <span class="su-chip-badge" id="suChipBadge_down" style="display:none;"></span>
              </div>
              <div class="su-bet-spot spot-seven" id="suBetSpot_seven" onclick="window.sevenUpGame && window.sevenUpGame.placeBet('seven')">
                <div class="su-zone-title">LUCKY 7</div>
                <div class="su-zone-sub">Exact 7</div>
                <div class="su-zone-payout">5.0X</div>
                <span class="su-chip-badge" id="suChipBadge_seven" style="display:none;"></span>
              </div>
              <div class="su-bet-spot spot-up" id="suBetSpot_up" onclick="window.sevenUpGame && window.sevenUpGame.placeBet('up')">
                <div class="su-zone-title">7 UP</div>
                <div class="su-zone-sub">Numbers 8, 9, 10, 11, 12</div>
                <div class="su-zone-payout">2.0X</div>
                <span class="su-chip-badge" id="suChipBadge_up" style="display:none;"></span>
              </div>
            </div>

            <div class="live-chips-row">
              <button type="button" class="live-chip-btn su-chip-btn active" data-amount="10" onclick="window.sevenUpGame && window.sevenUpGame.setChip(10)">₹10</button>
              <button type="button" class="live-chip-btn su-chip-btn" data-amount="50" onclick="window.sevenUpGame && window.sevenUpGame.setChip(50)">₹50</button>
              <button type="button" class="live-chip-btn su-chip-btn" data-amount="100" onclick="window.sevenUpGame && window.sevenUpGame.setChip(100)">₹100</button>
              <button type="button" class="live-chip-btn su-chip-btn" data-amount="500" onclick="window.sevenUpGame && window.sevenUpGame.setChip(500)">₹500</button>
            </div>

            <div class="live-btn-group">
              <button type="button" id="btnSuClear" class="btn-live-tool">✕ CLEAR</button>
              <button type="button" id="btnSuDouble" class="btn-live-tool">2X DOUBLE</button>
              <button type="button" id="btnSuRoll" class="btn-live-primary" disabled onclick="window.sevenUpGame && window.sevenUpGame.rollDice()">⚡ ROLL LIVE DICE</button>
            </div>
          </div>
        </div>
'''

roulette_end = '<!-- European Interactive Betting Board -->\n          <div class="rl-board-container" id="rlBettingBoard">'
roulette_view_close = html.find('</div>\n\n        </div>\n\n      </section>\n\n    </div>', html.find('id="rouletteView"'))
if roulette_view_close != -1 and 'id="blackjackView"' not in html:
    insert_pt = roulette_view_close + len('</div>\n\n        </div>')
    html = html[:insert_pt] + new_views_html + html[insert_pt:]
    print("✅ Inserted 6 new live game views.")

# 4. Insert script tags for new game engines before app.js
script_tags = '''  <script src="js/blackjack.js?v=108.0"></script>
  <script src="js/baccarat.js?v=108.0"></script>
  <script src="js/teenpatti.js?v=108.0"></script>
  <script src="js/sicbo.js?v=108.0"></script>
  <script src="js/megawheel.js?v=108.0"></script>
  <script src="js/sevenup.js?v=108.0"></script>
'''
app_script_pos = html.find('<script src="js/app.js')
if app_script_pos != -1 and 'js/blackjack.js' not in html:
    html = html[:app_script_pos] + script_tags + html[app_script_pos:]
    print("✅ Inserted script tags.")

# 5. Insert filterLiveStudio helper function in inline script
filter_live_js = '''
    window.filterLiveStudio = function(group, btn) {
      group = (group || 'all').toLowerCase();
      var btns = document.querySelectorAll('.live-subfilter-btn');
      btns.forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');

      var cards = document.querySelectorAll('#liveTablesGrid .live-table-card');
      cards.forEach(function(c) {
        var g = (c.getAttribute('data-group') || '').toLowerCase();
        if (group === 'all' || g.indexOf(group) !== -1) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    };
'''

if 'window.filterLiveStudio' not in html:
    search_func_pos = html.find('window.searchCasinoGames = function')
    if search_func_pos != -1:
        html = html[:search_func_pos] + filter_live_js + '\n    ' + html[search_func_pos:]
        print("✅ Inserted window.filterLiveStudio helper.")

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done writing public/index.html.")
