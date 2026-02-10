const API_BASE = '/api';
const ACCESS_TOKEN_KEY = 'tbs_tet2026_access_token';

// Access token management
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isAccessVerified(): boolean {
  return !!getAccessToken();
}

interface ApiPlayer {
  id: string;
  name: string;
  department: string;
  total_coins: number;
  games_played: number;
  created_at: string;
  updated_at: string;
}

interface ApiGameResult {
  game: string;
  coins_won: number;
  details: string;
  played_at: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  total_coins: number;
  games_played: number;
  created_at: string;
}

export interface DepartmentStats {
  department: string;
  player_count: number;
  total_coins: number;
  avg_coins: number;
}

export interface GameStats {
  total_players: number;
  total_coins: number;
  total_games: number;
  departments: DepartmentStats[];
}

export interface RedemptionRecord {
  id: number;
  reward_name: string;
  coin_cost: number;
  payment_method: string;
  payment_info: string;
  status: string;
  redeemed_at: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['x-access-token'] = token;
    }
    const res = await fetch(`${API_BASE}${url}`, {
      headers,
      ...options,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Server not available, silently fail
    return null;
  }
}

// Verify access code
export async function verifyAccessCode(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setAccessToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'Mã truy cập không đúng' };
  } catch {
    // Server not available, allow access with fallback
    setAccessToken('offline-mode');
    return { success: true };
  }
}

// Register or sync player to server
export async function syncPlayerToServer(player: {
  id: string;
  name: string;
  department: string;
  totalCoins: number;
  gamesPlayed: number;
}): Promise<ApiPlayer | null> {
  return apiCall<ApiPlayer>(`/players/${player.id}`, {
    method: 'PUT',
    body: JSON.stringify(player),
  });
}

// Register player on server
export async function registerPlayer(id: string, name: string, department: string): Promise<ApiPlayer | null> {
  return apiCall<ApiPlayer>('/players', {
    method: 'POST',
    body: JSON.stringify({ id, name, department }),
  });
}

// Record a game result
export async function recordGameResult(
  playerId: string,
  game: string,
  coinsWon: number,
  details: string,
  totalCoins: number
): Promise<void> {
  await apiCall('/game-results', {
    method: 'POST',
    body: JSON.stringify({ playerId, game, coinsWon, details, totalCoins }),
  });
}

// Record reward redemption with payment info
export async function recordRewardRedemption(
  playerId: string,
  rewardName: string,
  coinCost: number,
  totalCoins: number,
  paymentMethod?: string,
  paymentInfo?: string,
): Promise<void> {
  await apiCall('/rewards', {
    method: 'POST',
    body: JSON.stringify({ playerId, rewardName, coinCost, totalCoins, paymentMethod, paymentInfo }),
  });
}

// Get player redemption history
export async function fetchRedemptions(playerId: string): Promise<RedemptionRecord[]> {
  const data = await apiCall<RedemptionRecord[]>(`/players/${playerId}/redemptions`);
  return data || [];
}

// Get leaderboard
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const data = await apiCall<LeaderboardEntry[]>('/leaderboard');
  return data || [];
}

// Get leaderboard by department
export async function fetchDepartmentLeaderboard(department: string): Promise<LeaderboardEntry[]> {
  const data = await apiCall<LeaderboardEntry[]>(`/leaderboard/${encodeURIComponent(department)}`);
  return data || [];
}

// Get player game history
export async function fetchPlayerHistory(playerId: string): Promise<ApiGameResult[]> {
  const data = await apiCall<ApiGameResult[]>(`/players/${playerId}/history`);
  return data || [];
}

// Get overall statistics
export async function fetchStats(): Promise<GameStats | null> {
  return apiCall<GameStats>('/stats');
}
