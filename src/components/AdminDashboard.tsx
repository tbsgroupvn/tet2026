import { useState, useEffect, useCallback } from 'react';
import {
  isAdminVerified,
  verifyAdminCode,
  validateAdminToken,
  fetchAllRedemptions,
  updateRedemptionStatus,
  fetchAdminStats,
  fetchDbHealth,
  logoutAdmin,
} from '../utils/api';
import type { AdminRedemption, AdminStats, DbHealth } from '../utils/api';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [validating, setValidating] = useState(true);
  const [adminCode, setAdminCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Validate existing token on mount
  useEffect(() => {
    const checkToken = async () => {
      if (!isAdminVerified()) {
        setValidating(false);
        return;
      }
      const valid = await validateAdminToken();
      if (valid) {
        setAuthenticated(true);
      }
      setValidating(false);
    };
    checkToken();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataError('');
    try {
      const [r, s, h] = await Promise.all([
        fetchAllRedemptions(),
        fetchAdminStats(),
        fetchDbHealth(),
      ]);
      if (!r.length && !s) {
        setDataError('Không thể tải dữ liệu. Kiểm tra kết nối server.');
      }
      setRedemptions(r);
      setStats(s);
      setDbHealth(h);
    } catch {
      setDataError('Lỗi kết nối server. Vui lòng thử lại.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated, loadData]);

  const handleLogin = async () => {
    if (!adminCode.trim()) {
      setAuthError('Vui lòng nhập mã admin');
      return;
    }
    setLoggingIn(true);
    setAuthError('');
    const result = await verifyAdminCode(adminCode.trim());
    setLoggingIn(false);
    if (result.success) {
      setAuthenticated(true);
      setAdminCode('');
      setAuthError('');
    } else {
      setAuthError(result.error || 'Mã admin không đúng');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthenticated(false);
    setRedemptions([]);
    setStats(null);
    setDbHealth(null);
    setFilter('all');
    setSearchQuery('');
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    const notes = actionNotes[id] || '';
    const updated = await updateRedemptionStatus(id, status, notes);
    if (updated) {
      setRedemptions(prev => prev.map(r => r.id === id ? updated : r));
      setActionNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
      fetchAdminStats().then(s => { if (s) setStats(s); });
    }
  };

  // Normalize Vietnamese text for search (lowercase + remove diacritics for flexible matching)
  const normalizeVi = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filter by status + search by name/department/reward
  const filtered = redemptions
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = normalizeVi(searchQuery.trim());
      return (
        normalizeVi(r.player_name || '').includes(q) ||
        normalizeVi(r.department || '').includes(q) ||
        normalizeVi(r.reward_name || '').includes(q) ||
        normalizeVi(r.payment_info || '').includes(q)
      );
    });

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

  // Loading state while validating existing token
  if (validating) {
    return (
      <div className="admin-login" lang="vi">
        <div className="admin-login-card">
          <h2>Đang kiểm tra phiên đăng nhập...</h2>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Login form
  if (!authenticated) {
    return (
      <div className="admin-login" lang="vi">
        <div className="admin-login-card">
          <h2>Đăng Nhập Admin</h2>
          <p>Nhập mã admin để quản lý yêu cầu đổi thưởng</p>
          <input
            type="password"
            value={adminCode}
            onChange={e => { setAdminCode(e.target.value); setAuthError(''); }}
            onKeyDown={e => e.key === 'Enter' && !loggingIn && handleLogin()}
            placeholder="Nhập mã admin..."
            className="admin-code-input"
            autoFocus
            disabled={loggingIn}
            lang="vi"
          />
          {authError && <div className="admin-auth-error">{authError}</div>}
          <button
            className="admin-login-btn"
            onClick={handleLogin}
            disabled={loggingIn || !adminCode.trim()}
          >
            {loggingIn ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
          <div className="admin-login-hint">
            Liên hệ Phòng Nhân Sự để nhận mã quản trị
          </div>
        </div>
      </div>
    );
  }

  // Authenticated dashboard
  return (
    <div className="admin-dashboard" lang="vi">
      <div className="admin-header">
        <h2>Quản Lý Đổi Thưởng — Phòng Nhân Sự</h2>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={loadData} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Database health status */}
      {dbHealth && (
        <div className={`admin-db-status ${dbHealth.status === 'ok' ? 'connected' : 'disconnected'}`}>
          <span className="admin-db-indicator"></span>
          {dbHealth.status === 'ok' ? (
            <span>
              Database: Đã kết nối — {dbHealth.tables?.players ?? 0} người chơi, {dbHealth.tables?.rewards_redeemed ?? 0} yêu cầu đổi thưởng, {dbHealth.tables?.game_results ?? 0} lượt chơi
            </span>
          ) : (
            <span>Database: Mất kết nối — {dbHealth.error || 'Không thể kết nối cơ sở dữ liệu'}</span>
          )}
        </div>
      )}

      {/* Data error banner */}
      {dataError && (
        <div className="admin-data-error">
          {dataError}
          <button onClick={loadData} className="admin-retry-btn">Thử lại</button>
        </div>
      )}

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
            <span className="admin-stat-num">{stats.total_redeemed_cost?.toLocaleString('vi-VN')}</span>
            <span className="admin-stat-label">Tổng xu đã đổi</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="admin-search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo tên, phòng ban, phần thưởng..."
          className="admin-search-input"
          lang="vi"
        />
        {searchQuery && (
          <button className="admin-search-clear" onClick={() => setSearchQuery('')}>
            Xóa
          </button>
        )}
      </div>

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
        {loading && !redemptions.length ? (
          <div className="admin-empty">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Không có yêu cầu nào.'}
          </div>
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
                  <span className="admin-value">{r.reward_name} ({r.coin_cost} xu)</span>
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
                    lang="vi"
                  />
                  <div className="admin-action-btns">
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="admin-btn approve"
                          onClick={() => handleStatusUpdate(r.id, 'approved')}
                        >
                          Duyệt
                        </button>
                        <button
                          className="admin-btn reject"
                          onClick={() => handleStatusUpdate(r.id, 'rejected')}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        className="admin-btn paid"
                        onClick={() => handleStatusUpdate(r.id, 'paid')}
                      >
                        Đã Chuyển Tiền
                      </button>
                    )}
                    {r.status === 'rejected' && (
                      <button
                        className="admin-btn approve"
                        onClick={() => handleStatusUpdate(r.id, 'approved')}
                      >
                        Duyệt lại
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
