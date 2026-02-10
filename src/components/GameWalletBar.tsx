import type { Player } from '../types';
import { playClick } from '../utils/sounds';

interface Props {
  player: Player;
  onGoToRewards: () => void;
}

export default function GameWalletBar({ player, onGoToRewards }: Props) {
  return (
    <div className="game-wallet-bar">
      <div className="game-wallet-info">
        <span className="game-wallet-coins">🪙 {player.totalCoins.toLocaleString()} xu</span>
        <span className="game-wallet-plays">🎮 {player.gamesPlayed} lượt</span>
      </div>
      <button
        className="game-wallet-btn"
        onClick={() => { playClick(); onGoToRewards(); }}
      >
        🎁 Đổi Thưởng
      </button>
    </div>
  );
}
