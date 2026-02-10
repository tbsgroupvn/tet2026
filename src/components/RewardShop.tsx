import { useState, useEffect } from 'react';
import type { Player } from '../types';
import { REWARDS, getTierColor } from '../utils/rewards';
import { savePlayer } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { recordRewardRedemption, fetchRedemptions } from '../utils/api';
import type { RedemptionRecord } from '../utils/api';

interface RewardShopProps {
  player: Player;
  onUpdate: (player: Player) => void;
}

type PaymentMethod = 'bank' | 'momo';

interface PaymentForm {
  method: PaymentMethod;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  momoPhone: string;
  momoName: string;
}

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'VietinBank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'Sacombank', 'TPBank',
  'HDBank', 'SHB', 'VIB', 'MSB', 'SeABank', 'Khác',
];

export default function RewardShop({ player, onUpdate }: RewardShopProps) {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [payment, setPayment] = useState<PaymentForm>({
    method: 'bank',
    bankName: '',
    accountNumber: '',
    accountHolder: player.name,
    momoPhone: '',
    momoName: player.name,
  });
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchRedemptions(player.id).then(setRedemptions);
  }, [player.id]);

  const filtered = selectedTier === 'all'
    ? REWARDS
    : REWARDS.filter((r) => r.tier === selectedTier);

  const validatePayment = (): boolean => {
    if (payment.method === 'bank') {
      if (!payment.bankName) { setPaymentError('Vui lòng chọn ngân hàng'); return false; }
      if (!payment.accountNumber.trim() || payment.accountNumber.trim().length < 6) {
        setPaymentError('Số tài khoản không hợp lệ (tối thiểu 6 số)'); return false;
      }
      if (!payment.accountHolder.trim()) { setPaymentError('Vui lòng nhập tên chủ tài khoản'); return false; }
    } else {
      if (!payment.momoPhone.trim() || !/^0\d{8,10}$/.test(payment.momoPhone.trim())) {
        setPaymentError('Số điện thoại MoMo không hợp lệ'); return false;
      }
      if (!payment.momoName.trim()) { setPaymentError('Vui lòng nhập tên MoMo'); return false; }
    }
    setPaymentError('');
    return true;
  };

  const handleRedeem = (rewardId: string) => {
    const reward = REWARDS.find((r) => r.id === rewardId);
    if (!reward || player.totalCoins < reward.coinCost) return;
    if (!validatePayment()) return;

    const paymentMethod = payment.method === 'bank' ? 'Ngân hàng' : 'MoMo';
    const paymentInfo = payment.method === 'bank'
      ? `${payment.bankName} | STK: ${payment.accountNumber.trim()} | ${payment.accountHolder.trim()}`
      : `MoMo: ${payment.momoPhone.trim()} | ${payment.momoName.trim()}`;

    const updated = {
      ...player,
      totalCoins: player.totalCoins - reward.coinCost,
      rewards: [...player.rewards, reward],
    };
    savePlayer(updated);
    onUpdate(updated);
    setShowPaymentForm(null);
    setRedeemed(rewardId);
    setGreeting(getGreeting(player.department));

    // Record on server with payment info
    recordRewardRedemption(player.id, reward.name, reward.coinCost, updated.totalCoins, paymentMethod, paymentInfo);

    // Refresh redemption history
    setTimeout(() => {
      fetchRedemptions(player.id).then(setRedemptions);
    }, 500);

    setTimeout(() => { setRedeemed(null); setGreeting(''); }, 5000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Chờ duyệt', color: '#f39c12' };
      case 'approved': return { label: 'Đã duyệt', color: '#27ae60' };
      case 'paid': return { label: 'Đã chuyển', color: '#2ecc71' };
      case 'rejected': return { label: 'Từ chối', color: '#e74c3c' };
      default: return { label: 'Chờ duyệt', color: '#f39c12' };
    }
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
            <button
              className="redeem-btn"
              disabled={player.totalCoins < reward.coinCost}
              onClick={() => { setShowPaymentForm(reward.id); setPaymentError(''); }}
            >
              {player.totalCoins >= reward.coinCost ? '💳 Đổi & Nhận Tiền' : 'Chưa Đủ Xu'}
            </button>
            {redeemed === reward.id && (
              <div className="redeemed-overlay">🎉 Đổi thành công!</div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentForm(null)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>💳 Thông Tin Nhận Thưởng</h3>
            <p className="payment-reward-name">
              Phần thưởng: <strong>{REWARDS.find(r => r.id === showPaymentForm)?.name}</strong>
              {' '}(🪙 {REWARDS.find(r => r.id === showPaymentForm)?.coinCost.toLocaleString()})
            </p>

            <div className="payment-method-tabs">
              <button
                className={`payment-tab ${payment.method === 'bank' ? 'active' : ''}`}
                onClick={() => setPayment(p => ({ ...p, method: 'bank' }))}
              >
                🏦 Chuyển Khoản
              </button>
              <button
                className={`payment-tab ${payment.method === 'momo' ? 'active' : ''}`}
                onClick={() => setPayment(p => ({ ...p, method: 'momo' }))}
              >
                📱 MoMo
              </button>
            </div>

            {payment.method === 'bank' ? (
              <div className="payment-fields">
                <div className="payment-field">
                  <label>Ngân hàng:</label>
                  <select
                    value={payment.bankName}
                    onChange={(e) => setPayment(p => ({ ...p, bankName: e.target.value }))}
                    className="payment-select"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="payment-field">
                  <label>Số tài khoản:</label>
                  <input
                    type="text"
                    value={payment.accountNumber}
                    onChange={(e) => setPayment(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Nhập số tài khoản..."
                    className="payment-input"
                    maxLength={20}
                  />
                </div>
                <div className="payment-field">
                  <label>Chủ tài khoản:</label>
                  <input
                    type="text"
                    value={payment.accountHolder}
                    onChange={(e) => setPayment(p => ({ ...p, accountHolder: e.target.value }))}
                    placeholder="NGUYEN VAN A"
                    className="payment-input"
                  />
                </div>
              </div>
            ) : (
              <div className="payment-fields">
                <div className="payment-field">
                  <label>Số điện thoại MoMo:</label>
                  <input
                    type="text"
                    value={payment.momoPhone}
                    onChange={(e) => setPayment(p => ({ ...p, momoPhone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="09xxxxxxxx"
                    className="payment-input"
                    maxLength={11}
                  />
                </div>
                <div className="payment-field">
                  <label>Tên tài khoản MoMo:</label>
                  <input
                    type="text"
                    value={payment.momoName}
                    onChange={(e) => setPayment(p => ({ ...p, momoName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="payment-input"
                  />
                </div>
              </div>
            )}

            {paymentError && (
              <div className="payment-error">{paymentError}</div>
            )}

            <div className="payment-actions">
              <button
                className="payment-submit-btn"
                onClick={() => handleRedeem(showPaymentForm)}
              >
                Xác Nhận Đổi Thưởng
              </button>
              <button className="payment-cancel-btn" onClick={() => setShowPaymentForm(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {greeting && (
        <div className="greeting-box greeting-box-reward">
          <p className="greeting-text">🌸 {greeting}</p>
        </div>
      )}

      {/* Redemption History */}
      {redemptions.length > 0 && (
        <div className="redemption-history">
          <h3>📋 Lịch Sử Đổi Thưởng</h3>
          <div className="redemption-list">
            {redemptions.map((r) => {
              const badge = getStatusBadge(r.status);
              return (
                <div key={r.id} className="redemption-item">
                  <div className="redemption-info">
                    <span className="redemption-name">🧧 {r.reward_name}</span>
                    <span className="redemption-cost">🪙 -{r.coin_cost}</span>
                  </div>
                  <div className="redemption-payment">
                    <span className="redemption-method">{r.payment_method || 'N/A'}</span>
                    <span className="redemption-detail">{r.payment_info || ''}</span>
                  </div>
                  <div className="redemption-status-row">
                    <span className="redemption-status" style={{ background: badge.color }}>
                      {badge.label}
                    </span>
                    <span className="redemption-date">
                      {new Date(r.redeemed_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {player.rewards.length > 0 && redemptions.length === 0 && (
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
