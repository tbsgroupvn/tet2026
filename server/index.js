import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { db, stmts } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;
const ACCESS_CODE = process.env.ACCESS_CODE || 'TBS2026TET';

app.use(cors());
app.use(express.json());

// Serve static files from dist (production)
app.use(express.static(join(__dirname, '..', 'dist')));

// ============ Access Code Verification ============

// Verify access code
app.post('/api/verify-access', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Thiếu mã truy cập' });
  }
  if (code.trim().toUpperCase() === ACCESS_CODE.toUpperCase()) {
    // Generate a simple token (hash of code + secret)
    const token = Buffer.from(`tbs-tet2026-${ACCESS_CODE}-verified`).toString('base64');
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Mã truy cập không đúng' });
});

// Middleware: check access token on all /api/* routes except auth endpoints
app.use('/api', (req, res, next) => {
  // Skip auth for verification endpoints
  if (req.path === '/verify-access' || req.path.startsWith('/admin')) return next();
  const token = req.headers['x-access-token'];
  const expectedToken = Buffer.from(`tbs-tet2026-${ACCESS_CODE}-verified`).toString('base64');
  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Chưa xác thực. Vui lòng nhập mã truy cập nội bộ.' });
  }
  next();
});

// ============ API Routes ============

// Register / Login player
app.post('/api/players', (req, res) => {
  try {
    const { id, name, department } = req.body;
    if (!id || !name || !department) {
      return res.status(400).json({ error: 'Thiếu thông tin người chơi' });
    }

    stmts.upsertPlayer.run({
      id,
      name,
      department,
      totalCoins: 0,
      gamesPlayed: 0,
    });

    const player = stmts.getPlayer.get(id);
    res.json(player);
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get player by ID
app.get('/api/players/:id', (req, res) => {
  try {
    const player = stmts.getPlayer.get(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Không tìm thấy người chơi' });
    }
    res.json(player);
  } catch (err) {
    console.error('Error getting player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Sync player data (update coins + games played)
app.put('/api/players/:id', (req, res) => {
  try {
    const { name, department, totalCoins, gamesPlayed } = req.body;
    const id = req.params.id;

    stmts.upsertPlayer.run({
      id,
      name: name || '',
      department: department || '',
      totalCoins: totalCoins || 0,
      gamesPlayed: gamesPlayed || 0,
    });

    const player = stmts.getPlayer.get(id);
    res.json(player);
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Record game result
app.post('/api/game-results', (req, res) => {
  try {
    const { playerId, game, coinsWon, details, totalCoins } = req.body;
    if (!playerId || !game) {
      return res.status(400).json({ error: 'Thiếu thông tin kết quả' });
    }

    // Record the game result
    stmts.addGameResult.run({
      playerId,
      game,
      coinsWon: coinsWon || 0,
      details: details || '',
    });

    // Update player's total coins
    if (totalCoins !== undefined) {
      stmts.updateCoins.run({ id: playerId, totalCoins });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error recording game result:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Record reward redemption
app.post('/api/rewards', (req, res) => {
  try {
    const { playerId, rewardName, coinCost, totalCoins, paymentMethod, paymentInfo } = req.body;
    if (!playerId || !rewardName) {
      return res.status(400).json({ error: 'Thiếu thông tin đổi thưởng' });
    }

    const result = stmts.addRewardRedeemed.run({
      playerId,
      rewardName,
      coinCost: coinCost || 0,
      paymentMethod: paymentMethod || '',
      paymentInfo: paymentInfo || '',
    });

    // Update player's coins after redemption
    if (totalCoins !== undefined) {
      db.prepare('UPDATE players SET total_coins = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
        .run(totalCoins, playerId);
    }

    // Return the created redemption record
    const redemption = stmts.getRedemptionById.get(result.lastInsertRowid);
    res.json({ success: true, redemption });
  } catch (err) {
    console.error('Error recording reward:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get leaderboard (public)
app.get('/api/leaderboard', (_req, res) => {
  try {
    const leaderboard = stmts.getLeaderboard.all();
    res.json(leaderboard);
  } catch (err) {
    console.error('Error getting leaderboard:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get leaderboard by department
app.get('/api/leaderboard/:department', (req, res) => {
  try {
    const leaderboard = stmts.getLeaderboardByDepartment.all(req.params.department);
    res.json(leaderboard);
  } catch (err) {
    console.error('Error getting department leaderboard:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get player game history
app.get('/api/players/:id/history', (req, res) => {
  try {
    const history = stmts.getPlayerHistory.all(req.params.id);
    res.json(history);
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get player redeemed rewards
app.get('/api/players/:id/rewards', (req, res) => {
  try {
    const rewards = stmts.getPlayerRewards.all(req.params.id);
    res.json(rewards);
  } catch (err) {
    console.error('Error getting rewards:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get redemption history for player (with payment info)
app.get('/api/players/:id/redemptions', (req, res) => {
  try {
    const redemptions = db.prepare(`
      SELECT id, reward_name, coin_cost, payment_method, payment_info, status, redeemed_at
      FROM rewards_redeemed
      WHERE player_id = ?
      ORDER BY redeemed_at DESC
    `).all(req.params.id);
    res.json(redemptions);
  } catch (err) {
    console.error('Error getting redemptions:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get overall statistics
app.get('/api/stats', (_req, res) => {
  try {
    const stats = stmts.getStats.get();
    const departments = stmts.getDepartmentStats.all();
    res.json({ ...stats, departments });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Admin API Routes ============
const ADMIN_CODE = process.env.ADMIN_CODE || 'TBSADMIN2026';

// Verify admin code
app.post('/api/admin/verify', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Thiếu mã admin' });
  }
  if (code.trim() === ADMIN_CODE) {
    const token = Buffer.from(`tbs-tet2026-admin-${ADMIN_CODE}-verified`).toString('base64');
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Mã admin không đúng' });
});

// Validate admin token (check if still valid without re-entering code)
app.get('/api/admin/validate', adminAuth, (_req, res) => {
  res.json({ valid: true });
});

// Database health check for admin
app.get('/api/admin/health', adminAuth, (_req, res) => {
  try {
    const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get();
    const redemptionCount = db.prepare('SELECT COUNT(*) as count FROM rewards_redeemed').get();
    const gameCount = db.prepare('SELECT COUNT(*) as count FROM game_results').get();
    res.json({
      status: 'ok',
      database: 'connected',
      tables: {
        players: playerCount.count,
        rewards_redeemed: redemptionCount.count,
        game_results: gameCount.count,
      },
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Admin middleware
function adminAuth(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  const expectedToken = Buffer.from(`tbs-tet2026-admin-${ADMIN_CODE}-verified`).toString('base64');
  if (adminToken !== expectedToken) {
    return res.status(403).json({ error: 'Không có quyền admin' });
  }
  next();
}

// Get all redemptions (admin)
app.get('/api/admin/redemptions', adminAuth, (_req, res) => {
  try {
    const redemptions = stmts.getAllRedemptions.all();
    res.json(redemptions);
  } catch (err) {
    console.error('Error getting all redemptions:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update redemption status (admin)
app.put('/api/admin/redemptions/:id', adminAuth, (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const id = parseInt(req.params.id);
    if (!status || !['pending', 'approved', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    stmts.updateRedemptionStatus.run({
      id,
      status,
      adminNotes: adminNotes || '',
    });

    const updated = stmts.getRedemptionById.get(id);
    res.json({ success: true, redemption: updated });
  } catch (err) {
    console.error('Error updating redemption:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get admin stats summary
app.get('/api/admin/stats', adminAuth, (_req, res) => {
  try {
    const stats = stmts.getStats.get();
    const departments = stmts.getDepartmentStats.all();
    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM rewards_redeemed WHERE status = 'pending'").get();
    const totalRedeemed = db.prepare("SELECT COUNT(*) as count, SUM(coin_cost) as total_cost FROM rewards_redeemed").get();
    res.json({
      ...stats,
      departments,
      pending_redemptions: pendingCount.count,
      total_redemptions: totalRedeemed.count,
      total_redeemed_cost: totalRedeemed.total_cost || 0,
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ PvP Oẳn Tù Tì (Real-time 2-player) ============
const pvpRooms = new Map();

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of pvpRooms) {
    if (now - room.createdAt > 30 * 60 * 1000) pvpRooms.delete(code);
  }
}, 5 * 60 * 1000);

function generateRoomCode() {
  let code;
  do {
    code = String(1000 + Math.floor(Math.random() * 9000));
  } while (pvpRooms.has(code));
  return code;
}

function getWinner(p1, p2) {
  if (p1 === p2) return 'draw';
  if (
    (p1 === 'keo' && p2 === 'bao') ||
    (p1 === 'bua' && p2 === 'keo') ||
    (p1 === 'bao' && p2 === 'bua')
  ) return 'p1';
  return 'p2';
}

function sanitizeRoom(room, playerId) {
  const myIndex = room.players.findIndex(p => p.id === playerId);
  const opponentIndex = myIndex === 0 ? 1 : 0;

  return {
    code: room.code,
    status: room.status,
    round: room.round,
    scores: room.scores,
    players: room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      hasChosen: !!p.choice,
      // Only reveal choices when both have chosen (reveal/nextRound/finished)
      choice: (room.status === 'reveal' || room.status === 'finished') ? p.choice : (i === myIndex ? p.choice : null),
    })),
    myIndex,
    lastResult: room.lastResult,
    winner: room.winner,
    createdAt: room.createdAt,
  };
}

// Create room
app.post('/api/pvp/create', (req, res) => {
  const { playerId, playerName } = req.body;
  if (!playerId || !playerName) return res.status(400).json({ error: 'Thiếu thông tin' });

  const code = generateRoomCode();
  const room = {
    code,
    players: [{ id: playerId, name: playerName, choice: null }],
    scores: [0, 0],
    round: 1,
    status: 'waiting', // waiting, choosing, reveal, finished
    lastResult: null,
    winner: null,
    createdAt: Date.now(),
  };
  pvpRooms.set(code, room);
  res.json({ code, room: sanitizeRoom(room, playerId) });
});

// Join room
app.post('/api/pvp/join', (req, res) => {
  const { code, playerId, playerName } = req.body;
  if (!code || !playerId || !playerName) return res.status(400).json({ error: 'Thiếu thông tin' });

  const room = pvpRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  if (room.status !== 'waiting') return res.status(400).json({ error: 'Phòng đã bắt đầu' });
  if (room.players.length >= 2) return res.status(400).json({ error: 'Phòng đã đầy' });
  if (room.players[0].id === playerId) return res.status(400).json({ error: 'Không thể tự chơi với chính mình' });

  room.players.push({ id: playerId, name: playerName, choice: null });
  room.status = 'choosing';
  res.json({ room: sanitizeRoom(room, playerId) });
});

// Submit move
app.post('/api/pvp/move', (req, res) => {
  const { code, playerId, choice } = req.body;
  if (!code || !playerId || !choice) return res.status(400).json({ error: 'Thiếu thông tin' });
  if (!['keo', 'bua', 'bao'].includes(choice)) return res.status(400).json({ error: 'Lựa chọn không hợp lệ' });

  const room = pvpRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  if (room.status !== 'choosing') return res.status(400).json({ error: 'Chưa đến lượt chọn' });

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return res.status(403).json({ error: 'Bạn không trong phòng này' });
  if (room.players[playerIndex].choice) return res.status(400).json({ error: 'Bạn đã chọn rồi' });

  room.players[playerIndex].choice = choice;

  // Check if both players have chosen
  if (room.players[0].choice && room.players[1].choice) {
    const result = getWinner(room.players[0].choice, room.players[1].choice);
    if (result === 'p1') room.scores[0]++;
    else if (result === 'p2') room.scores[1]++;

    room.lastResult = {
      choices: [room.players[0].choice, room.players[1].choice],
      result, // 'p1', 'p2', 'draw'
      round: room.round,
    };

    // Check if match is over (best of 5)
    if (room.scores[0] >= 3 || room.scores[1] >= 3) {
      room.status = 'finished';
      room.winner = room.scores[0] >= 3 ? 0 : 1;
    } else {
      room.status = 'reveal';
      // Auto-advance to next round after 3 seconds
      setTimeout(() => {
        if (pvpRooms.has(code) && room.status === 'reveal') {
          room.round++;
          room.players[0].choice = null;
          room.players[1].choice = null;
          room.status = 'choosing';
        }
      }, 3500);
    }
  }

  res.json({ room: sanitizeRoom(room, playerId) });
});

// Get room state (polling)
app.get('/api/pvp/room/:code', (req, res) => {
  const { code } = req.params;
  const playerId = req.query.playerId;
  if (!playerId) return res.status(400).json({ error: 'Thiếu playerId' });

  const room = pvpRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return res.status(403).json({ error: 'Bạn không trong phòng này' });

  res.json({ room: sanitizeRoom(room, playerId) });
});

// Leave room
app.post('/api/pvp/leave', (req, res) => {
  const { code, playerId } = req.body;
  const room = pvpRooms.get(code);
  if (room) {
    // If match not finished, the leaver forfeits
    if (room.status !== 'finished' && room.players.length === 2) {
      const leaverIndex = room.players.findIndex(p => p.id === playerId);
      if (leaverIndex !== -1) {
        room.status = 'finished';
        room.winner = leaverIndex === 0 ? 1 : 0;
      }
    } else {
      pvpRooms.delete(code);
    }
  }
  res.json({ success: true });
});

// SPA fallback - serve index.html for all non-API routes
app.use((_req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🧧 TBS Tết 2026 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Bảng xếp hạng: http://localhost:${PORT}/bang-xep-hang`);
});
