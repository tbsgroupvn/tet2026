import { useState } from 'react';
import type { Player } from '../types';
import { REWARDS, getTierColor } from '../utils/rewards';
import { savePlayer } from '../utils/storage';

interface RewardShopProps {
  player: Player;
  onUpdate: (player: Player) => void;
}

export default function RewardShop({ player, onUpdate }: RewardShopProps) {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<string | null>(null);

  const filtered = selectedTier === 'all'
    ? REWARDS
    : REWARDS.filter((r) => r.tier === selectedTier);

  const handleRedeem = (rewardId: string) => {
    const reward = REWARDS.find((r) => r.id === rewardId);
    if (!reward || player.totalCoins < reward.coinCost) return;

    const updated = {
      ...player,
      totalCoins: player.totalCoins - reward.coinCost,
      rewards: [...player.rewards, reward],
    };
    savePlayer(updated);
    onUpdate(updated);
    setShowConfirm(null);
    setRedeemed(rewardId);
    setTimeout(() => setRedeemed(null), 3000);
  };

  return (
    <div className="reward-shop">
      <div className="shop-header">
        <h2>🎁 Đổi Phần Thưởng</h2>
        <p className="shop-balance">Số xu của bạn: <strong>🪙 {player.totalCoins.toLocaleString()}</strong></p>
      </div>

      <div className="tier-filters">
        {['all', 'bronze', 'silver', 'gold', 'diamond'].map((tier) => (
          <button
            key={tier}
            className={`tier-btn ${selectedTier === tier ? 'active' : ''}`}
            onClick={() => setSelectedTier(tier)}
            style={tier !== 'all' ? { borderColor: getTierColor(tier as 'bronze') } : {}}
          >
            {tier === 'all' ? 'Tất Cả' : tier === 'bronze' ? '🥉 Đồng' : tier === 'silver' ? '🥈 Bạc' : tier === 'gold' ? '🥇 Vàng' : '💎 Kim Cương'}
          </button>
        ))}
      </div>

      <div className="rewards-grid">
        {filtered.map((reward) => (
          <div
            key={reward.id}
            className={`reward-card ${redeemed === reward.id ? 'redeemed' : ''}`}
            style={{ borderColor: getTierColor(reward.tier) }}
          >
            <div className="reward-image">{reward.image}</div>
            <h4>{reward.name}</h4>
            <p>{reward.description}</p>
            <div className="reward-cost">🪙 {reward.coinCost.toLocaleString()}</div>
            {showConfirm === reward.id ? (
              <div className="confirm-btns">
                <button className="confirm-yes" onClick={() => handleRedeem(reward.id)}>Xác Nhận</button>
                <button className="confirm-no" onClick={() => setShowConfirm(null)}>Hủy</button>
              </div>
            ) : (
              <button
                className="redeem-btn"
                disabled={player.totalCoins < reward.coinCost}
                onClick={() => setShowConfirm(reward.id)}
              >
                {player.totalCoins >= reward.coinCost ? 'Đổi Thưởng' : 'Chưa Đủ Xu'}
              </button>
            )}
            {redeemed === reward.id && (
              <div className="redeemed-overlay">🎉 Đổi thành công!</div>
            )}
          </div>
        ))}
      </div>

      {player.rewards.length > 0 && (
        <div className="my-rewards">
          <h3>🎒 Phần Thưởng Đã Đổi</h3>
          <div className="my-rewards-list">
            {player.rewards.map((r, i) => (
              <div key={i} className="my-reward-item">
                <span>{r.image}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
