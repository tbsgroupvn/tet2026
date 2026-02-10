import type { Player } from '../types';
import { playClick } from '../utils/sounds';

interface Props {
  player: Player;
  onGoToRewards: () => void;
}

export default function GameWalletBar({ player, onGoToRewards }: Props) {
  return (
    <div className="game-wallet-bar" role="status" aria-label={`Ví xu: ${player.totalCoins} xu, ${player.gamesPlayed} lượt chơi`}>
      <div className="game-wallet-info">
        <span className="game-wallet-coins">🪙 {player.totalCoins.toLocaleString()} xu</span>
        <span className="game-wallet-plays">🎮 {player.gamesPlayed} lượt</span>
      </div>
      <button
        className="game-wallet-btn"
        onClick={() => { playClick(); onGoToRewards(); }}
        aria-label="Đổi thưởng bằng xu"
      >
        🎁 Đổi Thưởng
      </button>
    </div>
  );
}
