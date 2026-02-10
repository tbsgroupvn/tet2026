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

// Middleware: check access token on all /api/* routes except verify-access
app.use('/api', (req, res, next) => {
  if (req.path === '/verify-access') return next();
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

    stmts.addRewardRedeemed.run({
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

    res.json({ success: true });
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
