import { useState, useEffect } from 'react';
import {
  isAdminVerified,
  verifyAdminCode,
  fetchAllRedemptions,
  updateRedemptionStatus,
  fetchAdminStats,
} from '../utils/api';
import type { AdminRedemption, AdminStats } from '../utils/api';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(isAdminVerified());
  const [adminCode, setAdminCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([fetchAllRedemptions(), fetchAdminStats()]);
    setRedemptions(r);
    setStats(s);
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!adminCode.trim()) {
      setAuthError('Vui lòng nhập mã admin');
      return;
    }
    const result = await verifyAdminCode(adminCode.trim());
    if (result.success) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError(result.error || 'Mã admin không đúng');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    const notes = actionNotes[id] || '';
    const updated = await updateRedemptionStatus(id, status, notes);
    if (updated) {
      setRedemptions(prev => prev.map(r => r.id === id ? updated : r));
      setActionNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
      // Refresh stats
      fetchAdminStats().then(s => { if (s) setStats(s); });
    }
  };

  const filtered = filter === 'all'
    ? redemptions
    : redemptions.filter(r => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'paid': return '#2ecc71';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'paid': return 'Đã chuyển tiền';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <h2>🔐 Đăng Nhập Admin</h2>
          <p>Nhập mã admin để quản lý yêu cầu đổi thưởng</p>
          <input
            type="password"
            value={adminCode}
            onChange={e => setAdminCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Nhập mã admin..."
            className="admin-code-input"
          />
          {authError && <div className="admin-auth-error">{authError}</div>}
          <button className="admin-login-btn" onClick={handleLogin}>
            Đăng Nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>🏢 Quản Lý Đổi Thưởng — Phòng Nhân Sự</h2>
        <button className="admin-refresh-btn" onClick={loadData} disabled={loading}>
          {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-num">{stats.total_players}</span>
            <span className="admin-stat-label">Tổng người chơi</span>
          </div>
          <div className="admin-stat-card pending">
            <span className="admin-stat-num">{stats.pending_redemptions}</span>
            <span className="admin-stat-label">Chờ duyệt</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-num">{stats.total_redemptions}</span>
            <span className="admin-stat-label">Tổng yêu cầu</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-num">{stats.total_redeemed_cost?.toLocaleString()}</span>
            <span className="admin-stat-label">Tổng xu đã đổi</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        {[
          { key: 'all', label: `Tất cả (${redemptions.length})` },
          { key: 'pending', label: `Chờ duyệt (${redemptions.filter(r => r.status === 'pending').length})` },
          { key: 'approved', label: `Đã duyệt (${redemptions.filter(r => r.status === 'approved').length})` },
          { key: 'paid', label: `Đã chuyển (${redemptions.filter(r => r.status === 'paid').length})` },
          { key: 'rejected', label: `Từ chối (${redemptions.filter(r => r.status === 'rejected').length})` },
        ].map(f => (
          <button
            key={f.key}
            className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Redemption List */}
      <div className="admin-redemption-list">
        {filtered.length === 0 ? (
          <div className="admin-empty">Không có yêu cầu nào.</div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="admin-redemption-card">
              <div className="admin-redemption-header">
                <span className="admin-redemption-id">#{String(r.id).padStart(6, '0')}</span>
                <span
                  className="admin-redemption-status"
                  style={{ background: getStatusColor(r.status) }}
                >
                  {getStatusLabel(r.status)}
                </span>
              </div>

              <div className="admin-redemption-body">
                <div className="admin-redemption-row">
                  <span className="admin-label">Người yêu cầu:</span>
                  <span className="admin-value">{r.player_name} — {r.department}</span>
                </div>
                <div className="admin-redemption-row">
                  <span className="admin-label">Phần thưởng:</span>
                  <span className="admin-value">{r.reward_name} (🪙 {r.coin_cost})</span>
                </div>
                <div className="admin-redemption-row">
                  <span className="admin-label">Hình thức:</span>
                  <span className="admin-value">{r.payment_method}</span>
                </div>
                <div className="admin-redemption-row">
                  <span className="admin-label">Thông tin TK:</span>
                  <span className="admin-value admin-value-highlight">{r.payment_info}</span>
                </div>
                <div className="admin-redemption-row">
                  <span className="admin-label">Thời gian gửi:</span>
                  <span className="admin-value">{new Date(r.redeemed_at).toLocaleString('vi-VN')}</span>
                </div>
                {r.reviewed_at && (
                  <div className="admin-redemption-row">
                    <span className="admin-label">Thời gian duyệt:</span>
                    <span className="admin-value">{new Date(r.reviewed_at).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {r.admin_notes && (
                  <div className="admin-redemption-row">
                    <span className="admin-label">Ghi chú:</span>
                    <span className="admin-value">{r.admin_notes}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {r.status !== 'paid' && (
                <div className="admin-redemption-actions">
                  <input
                    type="text"
                    placeholder="Ghi chú (tùy chọn)..."
                    value={actionNotes[r.id] || ''}
                    onChange={e => setActionNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="admin-notes-input"
                  />
                  <div className="admin-action-btns">
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="admin-btn approve"
                          onClick={() => handleStatusUpdate(r.id, 'approved')}
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          className="admin-btn reject"
                          onClick={() => handleStatusUpdate(r.id, 'rejected')}
                        >
                          ❌ Từ chối
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        className="admin-btn paid"
                        onClick={() => handleStatusUpdate(r.id, 'paid')}
                      >
                        💸 Đã Chuyển Tiền
                      </button>
                    )}
                    {r.status === 'rejected' && (
                      <button
                        className="admin-btn approve"
                        onClick={() => handleStatusUpdate(r.id, 'approved')}
                      >
                        ↩️ Duyệt lại
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
