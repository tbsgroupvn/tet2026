export interface Player {
  id: string;
  name: string;
  department: string;
  totalCoins: number;
  gamesPlayed: number;
  rewards: Reward[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  image: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface GameResult {
  game: string;
  coinsWon: number;
  timestamp: number;
  details: string;
}

export type GameType = 'lac-li-xi' | 'bau-cua' | 'vong-quay' | 'boc-que' | 'tai-xiu' | 'bai-cao' | 'xin-xam' | 'cung-ong-ba';

export interface BauCuaSymbol {
  name: string;
  emoji: string;
  id: string;
}

export interface WheelSlice {
  label: string;
  coins: number;
  color: string;
  probability: number;
}
