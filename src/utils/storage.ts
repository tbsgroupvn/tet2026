import type { Player, GameResult, PrizeTransfer } from '../types';

const PLAYER_KEY = 'tbs_tet2026_player';
const HISTORY_KEY = 'tbs_tet2026_history';
const LEADERBOARD_KEY = 'tbs_tet2026_leaderboard';
const ADMIN_KEY = 'tbs_tet2026_admin';
const TRANSFERS_KEY = 'tbs_tet2026_transfers';

const ADMIN_PASSWORD = 'tbstet2026';

export function getPlayer(): Player | null {
  const data = localStorage.getItem(PLAYER_KEY);
  return data ? JSON.parse(data) : null;
}

export function savePlayer(player: Player): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  updateLeaderboard(player);
}

export function createPlayer(name: string, department: string): Player {
  const player: Player = {
    id: crypto.randomUUID(),
    name,
    department,
    totalCoins: 0,
    gamesPlayed: 0,
    rewards: [],
  };
  savePlayer(player);
  return player;
}

export function addCoins(player: Player, coins: number, game: string, details: string): Player {
  const updated = {
    ...player,
    totalCoins: player.totalCoins + coins,
    gamesPlayed: player.gamesPlayed + 1,
  };
  savePlayer(updated);
  addHistory({ game, coinsWon: coins, timestamp: Date.now(), details });
  return updated;
}

export function addHistory(result: GameResult): void {
  const history = getHistory();
  history.unshift(result);
  if (history.length > 50) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): GameResult[] {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function updateLeaderboard(player: Player): void {
  const leaderboard = getLeaderboard();
  const idx = leaderboard.findIndex((p) => p.id === player.id);
  if (idx >= 0) {
    leaderboard[idx] = player;
  } else {
    leaderboard.push(player);
  }
  leaderboard.sort((a, b) => b.totalCoins - a.totalCoins);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

export function getLeaderboard(): Player[] {
  const data = localStorage.getItem(LEADERBOARD_KEY);
  return data ? JSON.parse(data) : [];
}

// ===== ADMIN =====

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_KEY);
}

export function getAllPlayers(): Player[] {
  return getLeaderboard();
}

export function updatePlayerCoins(playerId: string, coins: number): void {
  const leaderboard = getLeaderboard();
  const idx = leaderboard.findIndex((p) => p.id === playerId);
  if (idx >= 0) {
    leaderboard[idx].totalCoins = coins;
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    const current = getPlayer();
    if (current && current.id === playerId) {
      current.totalCoins = coins;
      localStorage.setItem(PLAYER_KEY, JSON.stringify(current));
    }
  }
}

export function addCoinsToPlayer(playerId: string, amount: number): void {
  const leaderboard = getLeaderboard();
  const idx = leaderboard.findIndex((p) => p.id === playerId);
  if (idx >= 0) {
    leaderboard[idx].totalCoins += amount;
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    const current = getPlayer();
    if (current && current.id === playerId) {
      current.totalCoins += amount;
      localStorage.setItem(PLAYER_KEY, JSON.stringify(current));
    }
  }
}

// ===== PRIZE TRANSFERS =====

export function getTransfers(): PrizeTransfer[] {
  const data = localStorage.getItem(TRANSFERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransfers(transfers: PrizeTransfer[]): void {
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
}

export function addTransfer(transfer: PrizeTransfer): void {
  const transfers = getTransfers();
  transfers.unshift(transfer);
  saveTransfers(transfers);
}

export function updateTransferStatus(transferId: string, status: PrizeTransfer['status']): void {
  const transfers = getTransfers();
  const idx = transfers.findIndex((t) => t.id === transferId);
  if (idx >= 0) {
    transfers[idx].status = status;
    saveTransfers(transfers);
  }
}
