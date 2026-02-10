import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

// ============ Database (Turso / LibSQL) ============

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/tet2026.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

let dbReady = false;

async function initDb() {
  if (dbReady) return;
  await db.batch([
    `CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      total_coins INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      game TEXT NOT NULL,
      coins_won INTEGER NOT NULL,
      details TEXT,
      played_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )`,
    `CREATE TABLE IF NOT EXISTS rewards_redeemed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      coin_cost INTEGER NOT NULL,
      payment_method TEXT DEFAULT '',
      payment_info TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      admin_notes TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      redeemed_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_id)`,
    `CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results(game)`,
    `CREATE INDEX IF NOT EXISTS idx_players_coins ON players(total_coins DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_players_department ON players(department)`,
    `CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards_redeemed(status)`,
  ], 'write');
  dbReady = true;
}

// ============ Express App ============

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_CODE = process.env.ACCESS_CODE || 'TBS2026TET';
const ADMIN_CODE = process.env.ADMIN_CODE || 'TBSADMIN2026';

// Ensure DB on every request
app.use(async (_req, _res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    next(err);
  }
});

// ============ Access Code Verification ============

app.post('/api/verify-access', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Thiếu mã truy cập' });
  if (code.trim().toUpperCase() === ACCESS_CODE.toUpperCase()) {
    const token = Buffer.from(`tbs-tet2026-${ACCESS_CODE}-verified`).toString('base64');
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Mã truy cập không đúng' });
});

// Access token middleware (skip auth endpoints)
app.use('/api', (req, res, next) => {
  if (req.path === '/verify-access' || req.path.startsWith('/admin')) return next();
  const token = req.headers['x-access-token'];
  const expected = Buffer.from(`tbs-tet2026-${ACCESS_CODE}-verified`).toString('base64');
  if (token !== expected) {
    return res.status(403).json({ error: 'Chưa xác thực. Vui lòng nhập mã truy cập nội bộ.' });
  }
  next();
});

// ============ Player Routes ============

app.post('/api/players', async (req, res) => {
  try {
    const { id, name, department } = req.body;
    if (!id || !name || !department) {
      return res.status(400).json({ error: 'Thiếu thông tin người chơi' });
    }
    await db.execute({
      sql: `INSERT INTO players (id, name, department, total_coins, games_played)
            VALUES (?, ?, ?, 0, 0)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              department = excluded.department,
              updated_at = datetime('now','localtime')`,
      args: [id, name, department],
    });
    const result = await db.execute({ sql: 'SELECT * FROM players WHERE id = ?', args: [id] });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM players WHERE id = ?', args: [req.params.id] });
    if (!result.rows[0]) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const { name, department, totalCoins, gamesPlayed } = req.body;
    const id = req.params.id;
    await db.execute({
      sql: `INSERT INTO players (id, name, department, total_coins, games_played)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              department = excluded.department,
              total_coins = excluded.total_coins,
              games_played = excluded.games_played,
              updated_at = datetime('now','localtime')`,
      args: [id, name || '', department || '', totalCoins || 0, gamesPlayed || 0],
    });
    const result = await db.execute({ sql: 'SELECT * FROM players WHERE id = ?', args: [id] });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Game Results ============

app.post('/api/game-results', async (req, res) => {
  try {
    const { playerId, game, coinsWon, details, totalCoins } = req.body;
    if (!playerId || !game) {
      return res.status(400).json({ error: 'Thiếu thông tin kết quả' });
    }
    await db.execute({
      sql: 'INSERT INTO game_results (player_id, game, coins_won, details) VALUES (?, ?, ?, ?)',
      args: [playerId, game, coinsWon || 0, details || ''],
    });
    if (totalCoins !== undefined) {
      await db.execute({
        sql: "UPDATE players SET total_coins = ?, updated_at = datetime('now','localtime') WHERE id = ?",
        args: [totalCoins, playerId],
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error recording game result:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Rewards ============

app.post('/api/rewards', async (req, res) => {
  try {
    const { playerId, rewardName, coinCost, totalCoins, paymentMethod, paymentInfo } = req.body;
    if (!playerId || !rewardName) {
      return res.status(400).json({ error: 'Thiếu thông tin đổi thưởng' });
    }
    const result = await db.execute({
      sql: 'INSERT INTO rewards_redeemed (player_id, reward_name, coin_cost, payment_method, payment_info) VALUES (?, ?, ?, ?, ?)',
      args: [playerId, rewardName, coinCost || 0, paymentMethod || '', paymentInfo || ''],
    });
    if (totalCoins !== undefined) {
      await db.execute({
        sql: "UPDATE players SET total_coins = ?, updated_at = datetime('now','localtime') WHERE id = ?",
        args: [totalCoins, playerId],
      });
    }
    // Return the created record
    const redemption = await db.execute({
      sql: `SELECT r.id, r.player_id, p.name as player_name, p.department, r.reward_name,
                   r.coin_cost, r.payment_method, r.payment_info, r.status,
                   r.admin_notes, r.reviewed_at, r.redeemed_at
            FROM rewards_redeemed r LEFT JOIN players p ON r.player_id = p.id WHERE r.id = ?`,
      args: [result.lastInsertRowid],
    });
    res.json({ success: true, redemption: redemption.rows[0] });
  } catch (err) {
    console.error('Error recording reward:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Leaderboard ============

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const result = await db.execute('SELECT id, name, department, total_coins, games_played, created_at FROM players ORDER BY total_coins DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting leaderboard:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/leaderboard/:department', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, name, department, total_coins, games_played, created_at FROM players WHERE department = ? ORDER BY total_coins DESC LIMIT 50',
      args: [req.params.department],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting department leaderboard:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Player History & Rewards ============

app.get('/api/players/:id/history', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT game, coins_won, details, played_at FROM game_results WHERE player_id = ? ORDER BY played_at DESC LIMIT 50',
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/players/:id/rewards', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT reward_name, coin_cost, redeemed_at FROM rewards_redeemed WHERE player_id = ? ORDER BY redeemed_at DESC',
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting rewards:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/players/:id/redemptions', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT id, reward_name, coin_cost, payment_method, payment_info, status, redeemed_at
            FROM rewards_redeemed WHERE player_id = ? ORDER BY redeemed_at DESC`,
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting redemptions:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Stats ============

app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await db.execute('SELECT COUNT(*) as total_players, SUM(total_coins) as total_coins, SUM(games_played) as total_games FROM players');
    const departments = await db.execute('SELECT department, COUNT(*) as player_count, SUM(total_coins) as total_coins, AVG(total_coins) as avg_coins FROM players GROUP BY department ORDER BY total_coins DESC');
    res.json({ ...stats.rows[0], departments: departments.rows });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ Admin Routes ============

app.post('/api/admin/verify', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Thiếu mã admin' });
  if (code.trim() === ADMIN_CODE) {
    const token = Buffer.from(`tbs-tet2026-admin-${ADMIN_CODE}-verified`).toString('base64');
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Mã admin không đúng' });
});

function adminAuth(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  const expected = Buffer.from(`tbs-tet2026-admin-${ADMIN_CODE}-verified`).toString('base64');
  if (adminToken !== expected) {
    return res.status(403).json({ error: 'Không có quyền admin' });
  }
  next();
}

app.get('/api/admin/validate', adminAuth, (_req, res) => {
  res.json({ valid: true });
});

app.get('/api/admin/health', adminAuth, async (_req, res) => {
  try {
    const playerCount = await db.execute('SELECT COUNT(*) as count FROM players');
    const redemptionCount = await db.execute('SELECT COUNT(*) as count FROM rewards_redeemed');
    const gameCount = await db.execute('SELECT COUNT(*) as count FROM game_results');
    res.json({
      status: 'ok',
      database: 'connected',
      tables: {
        players: playerCount.rows[0].count,
        rewards_redeemed: redemptionCount.rows[0].count,
        game_results: gameCount.rows[0].count,
      },
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

app.get('/api/admin/redemptions', adminAuth, async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT r.id, r.player_id, p.name as player_name, p.department, r.reward_name,
             r.coin_cost, r.payment_method, r.payment_info, r.status,
             r.admin_notes, r.reviewed_at, r.redeemed_at
      FROM rewards_redeemed r LEFT JOIN players p ON r.player_id = p.id
      ORDER BY r.redeemed_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting all redemptions:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.put('/api/admin/redemptions/:id', adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const id = parseInt(req.params.id);
    if (!status || !['pending', 'approved', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    await db.execute({
      sql: "UPDATE rewards_redeemed SET status = ?, admin_notes = ?, reviewed_at = datetime('now','localtime') WHERE id = ?",
      args: [status, adminNotes || '', id],
    });
    const result = await db.execute({
      sql: `SELECT r.id, r.player_id, p.name as player_name, p.department, r.reward_name,
                   r.coin_cost, r.payment_method, r.payment_info, r.status,
                   r.admin_notes, r.reviewed_at, r.redeemed_at
            FROM rewards_redeemed r LEFT JOIN players p ON r.player_id = p.id WHERE r.id = ?`,
      args: [id],
    });
    res.json({ success: true, redemption: result.rows[0] });
  } catch (err) {
    console.error('Error updating redemption:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/admin/stats', adminAuth, async (_req, res) => {
  try {
    const stats = await db.execute('SELECT COUNT(*) as total_players, SUM(total_coins) as total_coins, SUM(games_played) as total_games FROM players');
    const departments = await db.execute('SELECT department, COUNT(*) as player_count, SUM(total_coins) as total_coins, AVG(total_coins) as avg_coins FROM players GROUP BY department ORDER BY total_coins DESC');
    const pending = await db.execute("SELECT COUNT(*) as count FROM rewards_redeemed WHERE status = 'pending'");
    const totalRedeemed = await db.execute("SELECT COUNT(*) as count, SUM(coin_cost) as total_cost FROM rewards_redeemed");
    res.json({
      ...stats.rows[0],
      departments: departments.rows,
      pending_redemptions: pending.rows[0].count,
      total_redemptions: totalRedeemed.rows[0].count,
      total_redeemed_cost: totalRedeemed.rows[0].total_cost || 0,
    });
  } catch (err) {
    console.error('Error getting admin stats:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default app;
