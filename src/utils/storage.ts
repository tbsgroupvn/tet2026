import type { Player, GameResult } from '../types';

const PLAYER_KEY = 'tbs_tet2026_player';
const HISTORY_KEY = 'tbs_tet2026_history';
const LEADERBOARD_KEY = 'tbs_tet2026_leaderboard';

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
