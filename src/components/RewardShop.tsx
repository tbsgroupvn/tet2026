import { useState, useEffect } from 'react';
import type { Player } from '../types';
import { REWARDS, getTierColor } from '../utils/rewards';
import { savePlayer } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { recordRewardRedemption, fetchRedemptions } from '../utils/api';
import type { RedemptionRecord } from '../utils/api';
import { playRedeem } from '../utils/sounds';

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

interface ReceiptData {
  id: number;
  rewardName: string;
  coinCost: number;
  paymentMethod: string;
  paymentInfo: string;
  redeemedAt: string;
}

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'VietinBank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'Sacombank', 'TPBank',
  'HDBank', 'SHB', 'VIB', 'MSB', 'SeABank', 'Khác',
];

export default function RewardShop({ player, onUpdate }: RewardShopProps) {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
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

  const handleRedeem = async (rewardId: string) => {
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
    setGreeting(getGreeting(player.department));

    playRedeem();

    // Record on server with payment info — get back the record with ID
    const record = await recordRewardRedemption(
      player.id, reward.name, reward.coinCost, updated.totalCoins, paymentMethod, paymentInfo
    );

    // Show receipt
    setReceipt({
      id: record?.id || Math.floor(Date.now() / 1000),
      rewardName: reward.name,
      coinCost: reward.coinCost,
      paymentMethod,
      paymentInfo,
      redeemedAt: record?.redeemed_at || new Date().toLocaleString('vi-VN'),
    });

    // Refresh redemption history
    setTimeout(() => {
      fetchRedemptions(player.id).then(setRedemptions);
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Chờ duyệt', color: '#f39c12', icon: '⏳' };
      case 'approved': return { label: 'Đã duyệt', color: '#27ae60', icon: '✅' };
      case 'paid': return { label: 'Đã chuyển tiền', color: '#2ecc71', icon: '💸' };
      case 'rejected': return { label: 'Từ chối', color: '#e74c3c', icon: '❌' };
      default: return { label: 'Chờ duyệt', color: '#f39c12', icon: '⏳' };
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'paid': return 3;
      case 'rejected': return -1;
      default: return 1;
    }
  };

  return (
    <div className="reward-shop">
      <div className="shop-header">
        <h2>🎁 Đổi Phần Thưởng</h2>
        <p className="shop-balance">Số xu của bạn: <strong>🪙 {player.totalCoins.toLocaleString()}</strong></p>
      </div>

      {/* Process explanation banner */}
      <div className="reward-process-banner">
        <h4>📋 Quy trình nhận thưởng</h4>
        <div className="process-steps">
          <div className="process-step">
            <span className="process-step-num">1</span>
            <span className="process-step-text">Đổi xu & nhập thông tin thanh toán</span>
          </div>
          <div className="process-step-arrow">→</div>
          <div className="process-step">
            <span className="process-step-num">2</span>
            <span className="process-step-text">Phòng Nhân Sự duyệt yêu cầu</span>
          </div>
          <div className="process-step-arrow">→</div>
          <div className="process-step">
            <span className="process-step-num">3</span>
            <span className="process-step-text">Chuyển tiền vào TK/MoMo của bạn</span>
          </div>
        </div>
        <p className="process-note">
          Phòng Nhân Sự (HR) sẽ xem xét và chuyển khoản trong vòng <strong>1-3 ngày làm việc</strong>.
          Bạn có thể theo dõi trạng thái yêu cầu bên dưới.
        </p>
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
            className="reward-card"
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

            <div className="payment-info-note">
              💡 Phòng Nhân Sự sẽ duyệt và chuyển khoản trong 1-3 ngày làm việc.
              Bạn sẽ nhận biên lai xác nhận sau khi đổi.
            </div>

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

      {/* Receipt Modal */}
      {receipt && (
        <div className="payment-modal-overlay" onClick={() => setReceipt(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="receipt-check">✅</div>
              <h3>Đổi Thưởng Thành Công!</h3>
            </div>

            <div className="receipt-body">
              <div className="receipt-id">
                Mã yêu cầu: <strong>#{String(receipt.id).padStart(6, '0')}</strong>
              </div>

              <div className="receipt-details">
                <div className="receipt-row">
                  <span className="receipt-label">Phần thưởng:</span>
                  <span className="receipt-value">{receipt.rewardName}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Xu đã dùng:</span>
                  <span className="receipt-value">🪙 {receipt.coinCost.toLocaleString()}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Hình thức nhận:</span>
                  <span className="receipt-value">{receipt.paymentMethod}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Thông tin TK:</span>
                  <span className="receipt-value receipt-value-small">{receipt.paymentInfo}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Thời gian:</span>
                  <span className="receipt-value">{receipt.redeemedAt}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Trạng thái:</span>
                  <span className="receipt-value receipt-status-pending">⏳ Chờ duyệt</span>
                </div>
              </div>

              <div className="receipt-process">
                <h4>Các bước tiếp theo:</h4>
                <div className="receipt-steps">
                  <div className="receipt-step active">
                    <span className="receipt-step-icon">✅</span>
                    <span>Gửi yêu cầu đổi thưởng</span>
                  </div>
                  <div className="receipt-step">
                    <span className="receipt-step-icon">⏳</span>
                    <span>Phòng Nhân Sự xem xét & duyệt</span>
                  </div>
                  <div className="receipt-step">
                    <span className="receipt-step-icon">💸</span>
                    <span>Chuyển tiền vào {receipt.paymentMethod === 'MoMo' ? 'ví MoMo' : 'tài khoản ngân hàng'}</span>
                  </div>
                </div>
                <p className="receipt-timeline">
                  Thời gian xử lý: <strong>1-3 ngày làm việc</strong>
                </p>
                <p className="receipt-contact">
                  Liên hệ Phòng Nhân Sự nếu cần hỗ trợ.
                </p>
              </div>
            </div>

            <button className="receipt-close-btn" onClick={() => setReceipt(null)}>
              Đã Hiểu, Đóng
            </button>
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
          <h3>📋 Lịch Sử Đổi Thưởng & Trạng Thái</h3>
          <div className="redemption-list">
            {redemptions.map((r) => {
              const badge = getStatusBadge(r.status);
              const step = getStatusStep(r.status);
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

                  {/* Status progress bar */}
                  <div className="redemption-progress">
                    <div className={`redemption-progress-step ${step >= 1 ? 'done' : ''} ${step === -1 ? 'rejected' : ''}`}>
                      <span className="progress-dot" />
                      <span className="progress-label">Gửi</span>
                    </div>
                    <div className={`redemption-progress-line ${step >= 2 ? 'done' : ''} ${step === -1 ? 'rejected' : ''}`} />
                    <div className={`redemption-progress-step ${step >= 2 ? 'done' : ''} ${step === -1 ? 'rejected' : ''}`}>
                      <span className="progress-dot" />
                      <span className="progress-label">Duyệt</span>
                    </div>
                    <div className={`redemption-progress-line ${step >= 3 ? 'done' : ''} ${step === -1 ? 'rejected' : ''}`} />
                    <div className={`redemption-progress-step ${step >= 3 ? 'done' : ''} ${step === -1 ? 'rejected' : ''}`}>
                      <span className="progress-dot" />
                      <span className="progress-label">Chuyển tiền</span>
                    </div>
                  </div>

                  <div className="redemption-status-row">
                    <span className="redemption-status" style={{ background: badge.color }}>
                      {badge.icon} {badge.label}
                    </span>
                    <span className="redemption-date">
                      Mã #{String(r.id).padStart(6, '0')} | {new Date(r.redeemed_at).toLocaleDateString('vi-VN')}
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
