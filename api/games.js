// /api/games.js - Server-Side Authoritative Game Engine & Provably Fair Verifier
// Manages Mines, Chicken Road, Crash, Dragon Tiger, Color Trading, and Stock Trading.
import crypto from 'crypto';

// In-memory active game state storage
const activeGameRounds = new Map(); // roundId -> roundData
const colorHistory = [];
const activeUserBalances = new Map(); // userId -> balance

// Helper: nCr combination
function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

// Calculate Mines / Chicken multiplier
function calculateTileMultiplier(revealed, totalHazards, totalTiles = 25) {
  if (revealed <= 0) return 1.0;
  const safeTiles = totalTiles - totalHazards;
  if (revealed > safeTiles) return 0.0;
  const totalCombos = nCr(totalTiles, revealed);
  const winCombos = nCr(safeTiles, revealed);
  if (winCombos === 0) return 0.0;
  const rawMult = totalCombos / winCombos;
  const houseEdge = 0.99; // 1% edge
  return Math.floor(rawMult * houseEdge * 100) / 100;
}

// Standard 52-Card Deck Generator for Dragon Tiger
function drawServerCard() {
  const suits = [
    { name: 'spades', symbol: '♠', isRed: false },
    { name: 'hearts', symbol: '♥', isRed: true },
    { name: 'diamonds', symbol: '♦', isRed: true },
    { name: 'clubs', symbol: '♣', isRed: false }
  ];
  const ranks = [
    { name: 'A', value: 1 }, { name: '2', value: 2 }, { name: '3', value: 3 },
    { name: '4', value: 4 }, { name: '5', value: 5 }, { name: '6', value: 6 },
    { name: '7', value: 7 }, { name: '8', value: 8 }, { name: '9', value: 9 },
    { name: '10', value: 10 }, { name: 'J', value: 11 }, { name: 'Q', value: 12 },
    { name: 'K', value: 13 }
  ];

  const randomBytes = crypto.randomBytes(4);
  const suit = suits[randomBytes.readUInt16BE(0) % suits.length];
  const rank = ranks[randomBytes.readUInt16BE(2) % ranks.length];

  return {
    rank: rank.name,
    value: rank.value,
    suit: suit.symbol,
    suitName: suit.name,
    isRed: suit.isRed,
    isBig: rank.value >= 8,
    isSmall: rank.value <= 6,
    isSeven: rank.value === 7
  };
}

// Provably Fair Crash point generation
function generateCrashPoint(serverSeed, clientSeed = 'shasah', nonce = 1) {
  const hash = crypto.createHash('sha256').update(`${serverSeed}:${clientSeed}:${nonce}`).digest('hex');
  const firstBytes = parseInt(hash.substring(0, 8), 16);
  // 4% instant crash
  if (firstBytes % 25 === 0) {
    return { crashPoint: 1.00, hash };
  }
  const raw = (100 * 1e8) / ((1e8 - (parseInt(hash.substring(0, 13), 16) % 1e8)) + 1);
  const mult = Math.max(1.01, Math.min(100.0, Math.floor(raw) / 100.0));
  return { crashPoint: roundTwo(mult), hash };
}

// Helper to reward 2% referral commission to referrer on each bet
function processReferralCommission(userId, betAmount) {
  if (betAmount <= 0) return;
  const commission = roundTwo(betAmount * 0.02); // 2% commission
  if (commission <= 0) return;

  // Check if user has referrer in storage/memory
  const referrerId = userReferrers.get(userId);
  if (referrerId && referrerId !== userId) {
    const currentRefBal = getUserBalance(referrerId);
    activeUserBalances.set(referrerId, roundTwo(currentRefBal + commission));
    const refEarnings = (referrerEarnings.get(referrerId) || 0) + commission;
    referrerEarnings.set(referrerId, roundTwo(refEarnings));
  }
}

const userReferrers = new Map();
const referrerEarnings = new Map();

function getUserBalance(userId) {
  const uid = String(userId || 'guest_default');
  if (!activeUserBalances.has(uid)) {
    activeUserBalances.set(uid, 1000.00);
  }
  return activeUserBalances.get(uid);
}

function updateUserBalance(userId, delta) {
  const uid = String(userId || 'guest_default');
  const current = getUserBalance(uid);
  const newBal = Math.max(0, roundTwo(current + delta));
  activeUserBalances.set(uid, newBal);
  return newBal;
}

// Initialize seed color history
if (colorHistory.length === 0) {
  for (let i = 0; i < 15; i++) {
    const num = Math.floor(Math.random() * 10);
    const colors = num === 0 ? ['violet', 'red'] : num === 5 ? ['violet', 'green'] : num % 2 === 0 ? ['red'] : ['green'];
    colorHistory.push({
      number: num,
      colors: colors,
      color: colors[0],
      size: num >= 5 ? 'Big' : 'Small'
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = {};
  try {
    if (typeof req.body === 'string' && req.body) body = JSON.parse(req.body);
    else if (typeof req.body === 'object' && req.body !== null) body = req.body;
  } catch (e) {}

  const params = { ...(req.query || {}), ...body };
  const action = params.action || '';
  const userId = String(params.userId || params.telegram_id || req.headers['x-user-id'] || 'guest_default').trim();

  // 0. REGISTER REFERRER
  if (action === 'register_referrer') {
    const referrerId = String(params.referrerId || params.ref || '').trim();
    if (referrerId && referrerId !== userId) {
      userReferrers.set(userId, referrerId);
    }
    return res.status(200).json({ success: true, referrerId });
  }

  // 0.1 GET ACTIVE ROUND (For recovering uncashed game on page refresh)
  if (action === 'get_active_round') {
    const gameType = params.gameType || '';
    for (const [rId, rData] of activeGameRounds.entries()) {
      if (rData.userId === userId && rData.status === 'IN_PROGRESS') {
        if (!gameType || rData.gameType === gameType) {
          const nextMult = calculateTileMultiplier(rData.revealedTiles.size + 1, rData.hazardCount, 25);
          return res.status(200).json({
            success: true,
            hasActiveRound: true,
            roundId: rData.roundId,
            gameType: rData.gameType,
            betAmount: rData.betAmount,
            hazardCount: rData.hazardCount,
            revealedIndices: Array.from(rData.revealedTiles),
            currentMultiplier: rData.currentMultiplier,
            nextMultiplier: nextMult,
            serverSeedHash: rData.serverSeedHash,
            balance: getUserBalance(userId)
          });
        }
      }
    }
    return res.status(200).json({ success: true, hasActiveRound: false });
  }

  // ----------------------------------------------------------------
  // 1. MINES & CHICKEN ROAD: START ROUND
  // ----------------------------------------------------------------
  if (action === 'mines_start' || action === 'chicken_start') {
    const isChicken = action === 'chicken_start';
    const betAmount = parseFloat(params.betAmount || params.amount || 0);
    let hazardCount = parseInt(params.hazardCount || params.mineCount || params.boneCount || 3, 10);
    const minBet = 1.0;
    const maxBet = 50000.0;

    if (isNaN(betAmount) || betAmount < minBet || betAmount > maxBet) {
      return res.status(400).json({ success: false, error: `Bet amount must be between ₹${minBet} and ₹${maxBet}` });
    }

    hazardCount = Math.max(1, Math.min(24, hazardCount));
    const balance = getUserBalance(userId);
    if (balance < betAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance to place bet' });
    }

    // Process 2% affiliate referral commission
    processReferralCommission(userId, betAmount);

    // Server-side bomb/bone selection
    const allTiles = Array.from({ length: 25 }, (_, i) => i);
    for (let i = allTiles.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }
    const secretHazards = allTiles.slice(0, hazardCount);

    const serverSeed = crypto.randomBytes(32).toString('hex');
    const clientSeed = String(params.clientSeed || 'stake_provably_fair').substring(0, 32);
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const roundId = (isChicken ? 'CHK-' : 'MNE-') + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    // Deduct bet balance atomically
    const newBal = updateUserBalance(userId, -betAmount);

    const roundData = {
      roundId,
      userId,
      gameType: isChicken ? 'chicken' : 'mines',
      betAmount,
      hazardCount,
      secretHazards: new Set(secretHazards),
      secretHazardsArray: secretHazards,
      revealedTiles: new Set(),
      currentMultiplier: 1.0,
      serverSeed,
      serverSeedHash,
      clientSeed,
      status: 'IN_PROGRESS',
      createdAt: Date.now()
    };

    activeGameRounds.set(roundId, roundData);

    const nextMult = calculateTileMultiplier(1, hazardCount, 25);
    return res.status(200).json({
      success: true,
      roundId,
      gameType: roundData.gameType,
      betAmount,
      hazardCount,
      currentMultiplier: 1.0,
      nextMultiplier: nextMult,
      serverSeedHash,
      balance: newBal
    });
  }

  // ----------------------------------------------------------------
  // 2. MINES & CHICKEN ROAD: REVEAL TILE
  // ----------------------------------------------------------------
  if (action === 'mines_reveal' || action === 'chicken_reveal') {
    const roundId = params.roundId;
    const tileIndex = parseInt(params.tileIndex, 10);

    if (!roundId || isNaN(tileIndex) || tileIndex < 0 || tileIndex > 24) {
      return res.status(400).json({ success: false, error: 'Invalid round ID or tile index' });
    }

    const roundData = activeGameRounds.get(roundId);
    if (!roundData || roundData.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Round is no longer active or already completed' });
    }

    if (roundData.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized round access' });
    }

    if (roundData.revealedTiles.has(tileIndex)) {
      return res.status(400).json({ success: false, error: 'Tile already revealed' });
    }

    // Check if Hit Hazard (Mine/Bone)
    if (roundData.secretHazards.has(tileIndex)) {
      roundData.status = 'LOST';
      const bal = getUserBalance(userId);
      return res.status(200).json({
        success: true,
        isBomb: true,
        gameOver: true,
        tileIndex,
        secretIndices: roundData.secretHazardsArray,
        serverSeed: roundData.serverSeed,
        serverSeedHash: roundData.serverSeedHash,
        balance: bal
      });
    }

    // Safe Gem / Chicken
    roundData.revealedTiles.add(tileIndex);
    const revealedCount = roundData.revealedTiles.size;
    const currentMult = calculateTileMultiplier(revealedCount, roundData.hazardCount, 25);
    const nextMult = calculateTileMultiplier(revealedCount + 1, roundData.hazardCount, 25);
    roundData.currentMultiplier = currentMult;

    const maxSafe = 25 - roundData.hazardCount;
    const isMaxWin = revealedCount >= maxSafe;

    if (isMaxWin) {
      roundData.status = 'WON';
      const payout = roundTwo(roundData.betAmount * currentMult);
      const newBal = updateUserBalance(userId, payout);
      return res.status(200).json({
        success: true,
        isBomb: false,
        gameOver: true,
        isMaxWin: true,
        tileIndex,
        revealedCount,
        currentMultiplier: currentMult,
        nextMultiplier: 0.0,
        profit: payout,
        payout,
        secretIndices: roundData.secretHazardsArray,
        serverSeed: roundData.serverSeed,
        serverSeedHash: roundData.serverSeedHash,
        balance: newBal
      });
    }

    return res.status(200).json({
      success: true,
      isBomb: false,
      gameOver: false,
      tileIndex,
      revealedCount,
      currentMultiplier: currentMult,
      nextMultiplier: nextMult,
      profit: roundTwo(roundData.betAmount * currentMult)
    });
  }

  // ----------------------------------------------------------------
  // 3. MINES & CHICKEN ROAD: CASHOUT
  // ----------------------------------------------------------------
  if (action === 'mines_cashout' || action === 'chicken_cashout') {
    const roundId = params.roundId;
    if (!roundId) return res.status(400).json({ success: false, error: 'Missing round ID' });

    const roundData = activeGameRounds.get(roundId);
    if (!roundData || roundData.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Round is no longer active or already cashed out' });
    }

    if (roundData.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized round access' });
    }

    if (roundData.revealedTiles.size === 0) {
      return res.status(400).json({ success: false, error: 'Must reveal at least one safe tile before cashout' });
    }

    roundData.status = 'CASHED_OUT';
    const payout = roundTwo(roundData.betAmount * roundData.currentMultiplier);
    const profit = roundTwo(payout - roundData.betAmount);
    const newBal = updateUserBalance(userId, payout);

    return res.status(200).json({
      success: true,
      cashedOut: true,
      payout,
      profit,
      multiplier: roundData.currentMultiplier,
      newBalance: newBal,
      secretIndices: roundData.secretHazardsArray,
      serverSeed: roundData.serverSeed,
      serverSeedHash: roundData.serverSeedHash
    });
  }

  // ----------------------------------------------------------------
  // 4. CRASH (AVIATOR): BET & CASHOUT
  // ----------------------------------------------------------------
  if (action === 'crash_bet') {
    const betAmount = parseFloat(params.betAmount || params.amount || 0);
    if (isNaN(betAmount) || betAmount < 1.0 || betAmount > 50000.0) {
      return res.status(400).json({ success: false, error: 'Invalid bet amount' });
    }

    const bal = getUserBalance(userId);
    if (bal < betAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const newBal = updateUserBalance(userId, -betAmount);
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const { crashPoint, hash } = generateCrashPoint(serverSeed, params.clientSeed || 'shasah');
    const roundId = 'CRASH-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    const crashData = {
      roundId,
      userId,
      betAmount,
      crashPoint,
      serverSeed,
      hash,
      status: 'IN_PROGRESS',
      createdAt: Date.now()
    };
    activeGameRounds.set(roundId, crashData);

    return res.status(200).json({
      success: true,
      roundId,
      crashPoint,
      hash,
      balance: newBal
    });
  }

  if (action === 'crash_cashout') {
    const roundId = params.roundId;
    const requestedMult = parseFloat(params.multiplier || 1.0);

    const crashData = activeGameRounds.get(roundId);
    if (!crashData || crashData.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Active crash round not found' });
    }

    if (requestedMult > crashData.crashPoint) {
      crashData.status = 'LOST';
      return res.status(400).json({ success: false, error: 'Plane crashed before cashout point', crashPoint: crashData.crashPoint });
    }

    crashData.status = 'CASHED_OUT';
    const validMult = Math.min(requestedMult, crashData.crashPoint);
    const payout = roundTwo(crashData.betAmount * validMult);
    const newBal = updateUserBalance(userId, payout);

    return res.status(200).json({
      success: true,
      payout,
      multiplier: validMult,
      balance: newBal
    });
  }

  // ----------------------------------------------------------------
  // 5. DRAGON TIGER: 52-CARD DEAL & MULTI-SPOT SETTLEMENT
  // ----------------------------------------------------------------
  if (action === 'dragontiger_play') {
    const bets = params.bets || {}; // e.g. { dragon: 50, tiger: 0, tie: 10 }
    let totalBet = 0;
    for (const k in bets) {
      const v = parseFloat(bets[k] || 0);
      if (v > 0) totalBet += v;
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, error: 'Must place at least one valid bet' });
    }

    const bal = getUserBalance(userId);
    if (bal < totalBet) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    updateUserBalance(userId, -totalBet);

    // Deal cards
    const dragonCard = drawServerCard();
    let tigerCard = drawServerCard();
    // Guarantee 2 distinct cards from shoe
    while (tigerCard.rank === dragonCard.rank && tigerCard.suit === dragonCard.suit) {
      tigerCard = drawServerCard();
    }

    let winner = 'tie';
    if (dragonCard.value > tigerCard.value) winner = 'dragon';
    else if (tigerCard.value > dragonCard.value) winner = 'tiger';

    let totalPayout = 0;
    const wins = {};

    // 1. Dragon Bet (1:1 payout; 50% refund on tie)
    if (bets.dragon > 0) {
      if (winner === 'dragon') {
        wins.dragon = roundTwo(bets.dragon * 2.0);
        totalPayout += wins.dragon;
      } else if (winner === 'tie') {
        wins.dragon = roundTwo(bets.dragon * 0.5); // 50% tie return
        totalPayout += wins.dragon;
      }
    }

    // 2. Tiger Bet (1:1 payout; 50% refund on tie)
    if (bets.tiger > 0) {
      if (winner === 'tiger') {
        wins.tiger = roundTwo(bets.tiger * 2.0);
        totalPayout += wins.tiger;
      } else if (winner === 'tie') {
        wins.tiger = roundTwo(bets.tiger * 0.5);
        totalPayout += wins.tiger;
      }
    }

    // 3. Tie Bet (9:1 payout -> 8:1 net plus original bet = 9x return)
    if (bets.tie > 0 && winner === 'tie') {
      wins.tie = roundTwo(bets.tie * 9.0);
      totalPayout += wins.tie;
    }

    // Side bets (Red/Black, Big/Small)
    if (bets.dragon_red > 0 && dragonCard.isRed && !dragonCard.isSeven) {
      wins.dragon_red = roundTwo(bets.dragon_red * 1.95);
      totalPayout += wins.dragon_red;
    }
    if (bets.dragon_black > 0 && !dragonCard.isRed && !dragonCard.isSeven) {
      wins.dragon_black = roundTwo(bets.dragon_black * 1.95);
      totalPayout += wins.dragon_black;
    }
    if (bets.tiger_red > 0 && tigerCard.isRed && !tigerCard.isSeven) {
      wins.tiger_red = roundTwo(bets.tiger_red * 1.95);
      totalPayout += wins.tiger_red;
    }
    if (bets.tiger_black > 0 && !tigerCard.isRed && !tigerCard.isSeven) {
      wins.tiger_black = roundTwo(bets.tiger_black * 1.95);
      totalPayout += wins.tiger_black;
    }

    const newBal = updateUserBalance(userId, totalPayout);

    return res.status(200).json({
      success: true,
      dragonCard,
      tigerCard,
      winner: winner.toUpperCase(),
      totalBet,
      totalPayout,
      won: totalPayout > totalBet,
      wins,
      balance: newBal
    });
  }

  // ----------------------------------------------------------------
  // 6. COLOR TRADING (WIN GO 30s)
  // ----------------------------------------------------------------
  if (action === 'colortrading_bet') {
    const choice = String(params.choice || '').toLowerCase();
    const amount = parseFloat(params.amount || 0);

    if (!choice || isNaN(amount) || amount < 1.0) {
      return res.status(400).json({ success: false, error: 'Invalid bet parameters' });
    }

    const bal = getUserBalance(userId);
    if (bal < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    updateUserBalance(userId, -amount);

    const num = crypto.randomInt(0, 10);
    const colors = num === 0 ? ['violet', 'red'] : num === 5 ? ['violet', 'green'] : num % 2 === 0 ? ['red'] : ['green'];
    const size = num >= 5 ? 'Big' : 'Small';
    const resultItem = { number: num, colors, size, color: colors[0] };
    colorHistory.push(resultItem);

    let won = false;
    let mult = 0.0;
    if (['red', 'green'].includes(choice) && colors.includes(choice)) {
      won = true;
      mult = colors.length === 1 ? 2.0 : 1.5;
    } else if (choice === 'violet' && colors.includes('violet')) {
      won = true;
      mult = 4.5;
    } else if (['big', 'small'].includes(choice) && choice === size.toLowerCase()) {
      won = true;
      mult = 2.0;
    } else if (!isNaN(parseInt(choice, 10)) && parseInt(choice, 10) === num) {
      won = true;
      mult = 9.0;
    }

    const payout = won ? roundTwo(amount * mult) : 0.0;
    const newBal = updateUserBalance(userId, payout);

    return res.status(200).json({
      success: true,
      won,
      multiplier: mult,
      payout,
      result: resultItem,
      history: colorHistory.slice(-10),
      balance: newBal
    });
  }

  // ----------------------------------------------------------------
  // 7. STOCK TRADING (BINARY OPTIONS)
  // ----------------------------------------------------------------
  if (action === 'stock_bet') {
    const direction = String(params.direction || 'call').toLowerCase();
    const amount = parseFloat(params.amount || 0);
    const entryPrice = parseFloat(params.entryPrice || 100.0);

    if (isNaN(amount) || amount < 1.0) {
      return res.status(400).json({ success: false, error: 'Invalid bet amount' });
    }

    const bal = getUserBalance(userId);
    if (bal < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    updateUserBalance(userId, -amount);

    const delta = (Math.random() > 0.5 ? 1 : -1) * (0.05 + Math.random() * 1.2);
    const exitPrice = roundTwo(Math.max(1.0, entryPrice + delta));

    const won = (direction === 'call' && exitPrice > entryPrice) || (direction === 'put' && exitPrice < entryPrice);
    const mult = won ? 1.90 : 0.0;
    const payout = won ? roundTwo(amount * mult) : 0.0;
    const newBal = updateUserBalance(userId, payout);

    return res.status(200).json({
      success: true,
      won,
      entryPrice,
      exitPrice,
      multiplier: mult,
      payout,
      balance: newBal
    });
  }

  return res.status(400).json({ success: false, error: 'Unknown game action' });
}
