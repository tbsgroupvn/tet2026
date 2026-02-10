import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'data', 'tet2026.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    total_coins INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    game TEXT NOT NULL,
    coins_won INTEGER NOT NULL,
    details TEXT,
    played_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS rewards_redeemed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    reward_name TEXT NOT NULL,
    coin_cost INTEGER NOT NULL,
    payment_method TEXT DEFAULT '',
    payment_info TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    admin_notes TEXT DEFAULT '',
    reviewed_at TEXT DEFAULT '',
    redeemed_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards_redeemed(status);
  CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_id);
  CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results(game);
  CREATE INDEX IF NOT EXISTS idx_players_coins ON players(total_coins DESC);
  CREATE INDEX IF NOT EXISTS idx_players_department ON players(department);
`);

// Migration: add new columns if missing (for existing databases)
try {
  db.exec("ALTER TABLE rewards_redeemed ADD COLUMN admin_notes TEXT DEFAULT ''");
} catch { /* column already exists */ }
try {
  db.exec("ALTER TABLE rewards_redeemed ADD COLUMN reviewed_at TEXT DEFAULT ''");
} catch { /* column already exists */ }

// Prepared statements
const stmts = {
  upsertPlayer: db.prepare(`
    INSERT INTO players (id, name, department, total_coins, games_played)
    VALUES (@id, @name, @department, @totalCoins, @gamesPlayed)
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      department = @department,
      total_coins = @totalCoins,
      games_played = @gamesPlayed,
      updated_at = datetime('now', 'localtime')
  `),

  getPlayer: db.prepare('SELECT * FROM players WHERE id = ?'),

  getPlayerByNameDept: db.prepare('SELECT * FROM players WHERE name = ? AND department = ?'),

  updateCoins: db.prepare(`
    UPDATE players SET
      total_coins = @totalCoins,
      games_played = games_played + 1,
      updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `),

  addGameResult: db.prepare(`
    INSERT INTO game_results (player_id, game, coins_won, details)
    VALUES (@playerId, @game, @coinsWon, @details)
  `),

  addRewardRedeemed: db.prepare(`
    INSERT INTO rewards_redeemed (player_id, reward_name, coin_cost, payment_method, payment_info)
    VALUES (@playerId, @rewardName, @coinCost, @paymentMethod, @paymentInfo)
  `),

  getAllRedemptions: db.prepare(`
    SELECT r.id, r.player_id, p.name as player_name, p.department, r.reward_name,
           r.coin_cost, r.payment_method, r.payment_info, r.status,
           r.admin_notes, r.reviewed_at, r.redeemed_at
    FROM rewards_redeemed r
    LEFT JOIN players p ON r.player_id = p.id
    ORDER BY r.redeemed_at DESC
  `),

  updateRedemptionStatus: db.prepare(`
    UPDATE rewards_redeemed
    SET status = @status, admin_notes = @adminNotes, reviewed_at = datetime('now', 'localtime')
    WHERE id = @id
  `),

  getRedemptionById: db.prepare(`
    SELECT r.id, r.player_id, p.name as player_name, p.department, r.reward_name,
           r.coin_cost, r.payment_method, r.payment_info, r.status,
           r.admin_notes, r.reviewed_at, r.redeemed_at
    FROM rewards_redeemed r
    LEFT JOIN players p ON r.player_id = p.id
    WHERE r.id = ?
  `),

  getLeaderboard: db.prepare(`
    SELECT id, name, department, total_coins, games_played, created_at
    FROM players
    ORDER BY total_coins DESC
    LIMIT 100
  `),

  getLeaderboardByDepartment: db.prepare(`
    SELECT id, name, department, total_coins, games_played, created_at
    FROM players
    WHERE department = ?
    ORDER BY total_coins DESC
    LIMIT 50
  `),

  getPlayerHistory: db.prepare(`
    SELECT game, coins_won, details, played_at
    FROM game_results
    WHERE player_id = ?
    ORDER BY played_at DESC
    LIMIT 50
  `),

  getPlayerRewards: db.prepare(`
    SELECT reward_name, coin_cost, redeemed_at
    FROM rewards_redeemed
    WHERE player_id = ?
    ORDER BY redeemed_at DESC
  `),

  getStats: db.prepare(`
    SELECT
      COUNT(*) as total_players,
      SUM(total_coins) as total_coins,
      SUM(games_played) as total_games
    FROM players
  `),

  getDepartmentStats: db.prepare(`
    SELECT
      department,
      COUNT(*) as player_count,
      SUM(total_coins) as total_coins,
      AVG(total_coins) as avg_coins
    FROM players
    GROUP BY department
    ORDER BY total_coins DESC
  `),
};

export { db, stmts };
