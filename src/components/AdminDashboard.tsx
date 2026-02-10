import { useState } from 'react';
import type { Player, PrizeTransfer, AdminPage } from '../types';
import { REWARDS } from '../utils/rewards';
import {
  getAllPlayers,
  addCoinsToPlayer,
  adminLogout,
  getTransfers,
  addTransfer,
  updateTransferStatus,
} from '../utils/storage';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [currentTab, setCurrentTab] = useState<AdminPage>('players');
  const [players, setPlayers] = useState<Player[]>(getAllPlayers());
  const [transfers, setTransfers] = useState<PrizeTransfer[]>(getTransfers());
  const [searchQuery, setSearchQuery] = useState('');

  // Prize transfer state
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedReward, setSelectedReward] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // Add coins state
  const [coinPlayerId, setCoinPlayerId] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [coinSuccess, setCoinSuccess] = useState('');

  const refreshData = () => {
    setPlayers(getAllPlayers());
    setTransfers(getTransfers());
  };

  const handleLogout = () => {
    adminLogout();
    onLogout();
  };

  const handleTransferPrize = (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find((p) => p.id === selectedPlayer);
    const reward = REWARDS.find((r) => r.id === selectedReward);
    if (!player || !reward) return;

    const transfer: PrizeTransfer = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      rewardName: reward.name,
      status: 'pending',
      timestamp: Date.now(),
      note: transferNote,
    };
    addTransfer(transfer);
    setTransferSuccess(`Da chuyen thuong "${reward.name}" cho ${player.name}!`);
    setSelectedPlayer('');
    setSelectedReward('');
    setTransferNote('');
    refreshData();
    setTimeout(() => setTransferSuccess(''), 3000);
  };

  const handleAddCoins = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(coinAmount);
    if (!coinPlayerId || isNaN(amount) || amount === 0) return;
    const player = players.find((p) => p.id === coinPlayerId);
    if (!player) return;

    addCoinsToPlayer(coinPlayerId, amount);
    setCoinSuccess(`Da ${amount > 0 ? 'cong' : 'tru'} ${Math.abs(amount)} xu cho ${player.name}!`);
    setCoinPlayerId('');
    setCoinAmount('');
    refreshData();
    setTimeout(() => setCoinSuccess(''), 3000);
  };

  const handleUpdateTransferStatus = (transferId: string, status: PrizeTransfer['status']) => {
    updateTransferStatus(transferId, status);
    refreshData();
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusLabel = (status: PrizeTransfer['status']) => {
    switch (status) {
      case 'pending': return 'Cho xu ly';
      case 'delivered': return 'Da giao';
      case 'cancelled': return 'Da huy';
    }
  };

  const statusClass = (status: PrizeTransfer['status']) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-logo">🔐</span>
            <div>
              <h1 className="admin-title">Trang Quan Tri</h1>
              <p className="admin-subtitle">TBS Group - Tet 2026</p>
            </div>
          </div>
          <nav className="admin-nav">
            <button
              className={`admin-nav-btn ${currentTab === 'players' ? 'active' : ''}`}
              onClick={() => setCurrentTab('players')}
            >
              Nguoi Choi
            </button>
            <button
              className={`admin-nav-btn ${currentTab === 'transfers' ? 'active' : ''}`}
              onClick={() => setCurrentTab('transfers')}
            >
              Chuyen Thuong
            </button>
            <button
              className={`admin-nav-btn ${currentTab === 'prizes' ? 'active' : ''}`}
              onClick={() => setCurrentTab('prizes')}
            >
              Quan Ly Giai
            </button>
          </nav>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Dang Xuat
          </button>
        </div>
      </header>

      <main className="admin-content">
        {/* ===== PLAYERS TAB ===== */}
        {currentTab === 'players' && (
          <div className="admin-section">
            <h2>Danh Sach Nguoi Choi</h2>
            <div className="admin-stats-row">
              <div className="admin-stat-card">
                <span className="admin-stat-value">{players.length}</span>
                <span className="admin-stat-label">Tong nguoi choi</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {players.reduce((sum, p) => sum + p.totalCoins, 0).toLocaleString()}
                </span>
                <span className="admin-stat-label">Tong xu</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {players.reduce((sum, p) => sum + p.gamesPlayed, 0).toLocaleString()}
                </span>
                <span className="admin-stat-label">Tong luot choi</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {players.reduce((sum, p) => sum + p.rewards.length, 0)}
                </span>
                <span className="admin-stat-label">Qua da doi</span>
              </div>
            </div>

            <div className="admin-search">
              <input
                type="text"
                placeholder="Tim kiem theo ten hoac phong ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Add Coins Form */}
            <div className="admin-form-card">
              <h3>Cong/Tru Xu Cho Nguoi Choi</h3>
              <form onSubmit={handleAddCoins} className="admin-inline-form">
                <select
                  value={coinPlayerId}
                  onChange={(e) => setCoinPlayerId(e.target.value)}
                  required
                >
                  <option value="">-- Chon nguoi choi --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.department}) - {p.totalCoins} xu
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="So xu (am de tru)"
                  required
                />
                <button type="submit" className="admin-action-btn">
                  Cap Nhat Xu
                </button>
              </form>
              {coinSuccess && <div className="admin-success">{coinSuccess}</div>}
            </div>

            <div className="admin-table">
              <div className="admin-table-header">
                <span className="col-rank">#</span>
                <span className="col-name">Ten</span>
                <span className="col-dept">Phong Ban</span>
                <span className="col-coins">Xu</span>
                <span className="col-games">Luot Choi</span>
                <span className="col-rewards">Qua Da Doi</span>
              </div>
              {filteredPlayers.length === 0 ? (
                <div className="admin-empty">Khong co nguoi choi nao.</div>
              ) : (
                filteredPlayers.map((p, i) => (
                  <div key={p.id} className="admin-table-row">
                    <span className="col-rank">{i + 1}</span>
                    <span className="col-name">{p.name}</span>
                    <span className="col-dept">{p.department}</span>
                    <span className="col-coins">{p.totalCoins.toLocaleString()}</span>
                    <span className="col-games">{p.gamesPlayed}</span>
                    <span className="col-rewards">
                      {p.rewards.length > 0
                        ? p.rewards.map((r) => r.name).join(', ')
                        : '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== TRANSFERS TAB ===== */}
        {currentTab === 'transfers' && (
          <div className="admin-section">
            <h2>Chuyen Thuong Cho Nguoi Choi</h2>

            <div className="admin-form-card">
              <h3>Tao Phieu Chuyen Thuong Moi</h3>
              <form onSubmit={handleTransferPrize} className="admin-transfer-form">
                <div className="form-group">
                  <label>Nguoi Choi</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    required
                  >
                    <option value="">-- Chon nguoi choi --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Phan Thuong</label>
                  <select
                    value={selectedReward}
                    onChange={(e) => setSelectedReward(e.target.value)}
                    required
                  >
                    <option value="">-- Chon phan thuong --</option>
                    {REWARDS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.image} {r.name} - {r.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ghi Chu</label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="Ghi chu (khong bat buoc)"
                  />
                </div>
                <button type="submit" className="admin-action-btn" disabled={!selectedPlayer || !selectedReward}>
                  Tao Phieu Chuyen Thuong
                </button>
              </form>
              {transferSuccess && <div className="admin-success">{transferSuccess}</div>}
            </div>

            <h3 className="admin-section-title">Lich Su Chuyen Thuong</h3>
            {transfers.length === 0 ? (
              <div className="admin-empty">Chua co phieu chuyen thuong nao.</div>
            ) : (
              <div className="admin-table">
                <div className="admin-table-header transfer-header">
                  <span className="col-time">Thoi Gian</span>
                  <span className="col-name">Nguoi Nhan</span>
                  <span className="col-reward">Phan Thuong</span>
                  <span className="col-note">Ghi Chu</span>
                  <span className="col-status">Trang Thai</span>
                  <span className="col-actions">Thao Tac</span>
                </div>
                {transfers.map((t) => (
                  <div key={t.id} className="admin-table-row transfer-row">
                    <span className="col-time">
                      {new Date(t.timestamp).toLocaleDateString('vi-VN')}{' '}
                      {new Date(t.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="col-name">{t.playerName}</span>
                    <span className="col-reward">{t.rewardName}</span>
                    <span className="col-note">{t.note || '-'}</span>
                    <span className={`col-status ${statusClass(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                    <span className="col-actions">
                      {t.status === 'pending' && (
                        <>
                          <button
                            className="action-deliver"
                            onClick={() => handleUpdateTransferStatus(t.id, 'delivered')}
                          >
                            Giao
                          </button>
                          <button
                            className="action-cancel"
                            onClick={() => handleUpdateTransferStatus(t.id, 'cancelled')}
                          >
                            Huy
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PRIZES MANAGEMENT TAB ===== */}
        {currentTab === 'prizes' && (
          <div className="admin-section">
            <h2>Quan Ly Giai Thuong</h2>

            <div className="admin-stats-row">
              <div className="admin-stat-card">
                <span className="admin-stat-value">{REWARDS.length}</span>
                <span className="admin-stat-label">Tong giai thuong</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {transfers.filter((t) => t.status === 'pending').length}
                </span>
                <span className="admin-stat-label">Cho xu ly</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {transfers.filter((t) => t.status === 'delivered').length}
                </span>
                <span className="admin-stat-label">Da giao</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">
                  {players.reduce((sum, p) => sum + p.rewards.length, 0)}
                </span>
                <span className="admin-stat-label">Nguoi choi da doi</span>
              </div>
            </div>

            <h3 className="admin-section-title">Danh Sach Giai Thuong</h3>
            <div className="prizes-grid">
              {REWARDS.map((reward) => {
                const redeemCount = players.reduce(
                  (count, p) => count + p.rewards.filter((r) => r.id === reward.id).length,
                  0
                );
                const transferCount = transfers.filter(
                  (t) => t.rewardName === reward.name
                ).length;

                return (
                  <div key={reward.id} className="prize-admin-card">
                    <div className="prize-admin-image">{reward.image}</div>
                    <h4>{reward.name}</h4>
                    <p>{reward.description}</p>
                    <div className="prize-admin-cost">{reward.coinCost.toLocaleString()} xu</div>
                    <div className="prize-admin-stats">
                      <span>Da doi: {redeemCount}</span>
                      <span>Da chuyen: {transferCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="admin-section-title">Nguoi Choi Da Doi Thuong</h3>
            {players.filter((p) => p.rewards.length > 0).length === 0 ? (
              <div className="admin-empty">Chua co ai doi thuong.</div>
            ) : (
              <div className="admin-table">
                <div className="admin-table-header">
                  <span className="col-name">Nguoi Choi</span>
                  <span className="col-dept">Phong Ban</span>
                  <span className="col-rewards-list">Phan Thuong Da Doi</span>
                </div>
                {players
                  .filter((p) => p.rewards.length > 0)
                  .map((p) => (
                    <div key={p.id} className="admin-table-row">
                      <span className="col-name">{p.name}</span>
                      <span className="col-dept">{p.department}</span>
                      <span className="col-rewards-list">
                        {p.rewards.map((r, i) => (
                          <span key={i} className="reward-tag">
                            {r.image} {r.name}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
