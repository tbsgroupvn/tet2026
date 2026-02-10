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
