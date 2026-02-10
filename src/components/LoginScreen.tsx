import { useState } from 'react';
import { verifyAccessCode, isAccessVerified } from '../utils/api';
import { initAudio } from '../utils/sounds';

interface LoginScreenProps {
  onLogin: (name: string, department: string) => void;
}

const DEPARTMENTS = [
  'Ban Giám Đốc',
  'Phòng Nhân Sự',
  'Phòng Marketing',
  'Phòng Chăm Sóc Khách Hàng',
  'Phòng Kinh Doanh',
  'Phòng Xuất Nhập Khẩu',
  'Bộ Phận Kho',
  'Bộ Phận Bán Hàng Senliving',
];

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessVerified, setAccessVerified] = useState(isAccessVerified());
  const [accessError, setAccessError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerifyAccess = async () => {
    // Pre-init AudioContext on this early interaction so playGong() won't lag later
    initAudio();
    if (!accessCode.trim()) {
      setAccessError('Vui lòng nhập mã truy cập');
      return;
    }
    setVerifying(true);
    setAccessError('');
    const result = await verifyAccessCode(accessCode.trim());
    setVerifying(false);
    if (result.success) {
      setAccessVerified(true);
    } else {
      setAccessError(result.error || 'Mã truy cập không đúng');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && department && accessVerified) {
      onLogin(name.trim(), department);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <img src="/tbs-logo.svg" alt="TBS Group" className="login-logo" />
          <div className="login-lanterns">🏮🏮🏮</div>
          <h1 className="login-title">Chúc Mừng Năm Mới</h1>
          <h2 className="login-subtitle">TBS Group - Tết 2026</h2>
          <div className="login-dragon">🐍</div>
          <p className="login-wish">
            Kính chúc Quý Anh Chị Em cán bộ nhân viên TBS Group
            <br />
            năm mới <strong>An Khang Thịnh Vượng</strong>!
          </p>
          <p className="login-desc">
            Chào mừng bạn đến với sân chơi Tết Nguyên Đán!
            <br />
            Chơi game, nhận xu, đổi thưởng tiền thật!
          </p>
        </div>

        {!accessVerified ? (
          <div className="access-gate">
            <div className="access-gate-header">
              <span className="access-gate-icon">🔐</span>
              <h3>Xác Thực Nội Bộ</h3>
              <p>Nhập mã truy cập do công ty cung cấp để vào chơi</p>
            </div>
            <div className="form-group">
              <label>Mã Truy Cập Nội Bộ</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value); setAccessError(''); }}
                placeholder="Nhập mã truy cập..."
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyAccess()}
                autoFocus
              />
            </div>
            {accessError && (
              <div className="access-error">{accessError}</div>
            )}
            <button
              className="login-btn"
              onClick={handleVerifyAccess}
              disabled={verifying || !accessCode.trim()}
            >
              {verifying ? 'Đang xác thực...' : '🔓 Xác Thực'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="access-verified-badge">
              🔓 Đã xác thực nội bộ TBS Group
            </div>
            <div className="form-group">
              <label>Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ tên của bạn..."
                required
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>Phòng Ban</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">-- Chọn phòng ban --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="login-btn"
              disabled={!name.trim() || !department}
            >
              🧧 Vào Chơi Ngay!
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
