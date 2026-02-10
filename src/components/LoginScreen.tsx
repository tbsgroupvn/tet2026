import { useState } from 'react';
import { adminLogin } from '../utils/storage';

interface LoginScreenProps {
  onLogin: (name: string, department: string) => void;
  onAdminLogin: () => void;
}

const DEPARTMENTS = [
  'Ban Giám Đốc',
  'Phòng Nhân Sự',
  'Phòng Kế Toán',
  'Phòng Marketing',
  'Phòng Kinh Doanh',
  'Phòng IT',
  'Phòng Sản Xuất',
  'Phòng Kỹ Thuật',
  'Phòng Chất Lượng',
  'Phòng Hành Chính',
  'Khác',
];

export default function LoginScreen({ onLogin, onAdminLogin }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && department) {
      onLogin(name.trim(), department);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(adminPassword)) {
      onAdminLogin();
    } else {
      setAdminError('Sai mật khẩu quản trị!');
      setAdminPassword('');
    }
  };

  if (isAdminMode) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-header">
            <div className="login-lanterns">🔐</div>
            <h1 className="login-title">Quản Trị Viên</h1>
            <h2 className="login-subtitle">TBS Group - Tết 2026</h2>
            <p className="login-desc">
              Đăng nhập để quản lý giải thưởng và chuyển thưởng
            </p>
          </div>
          <form onSubmit={handleAdminSubmit} className="login-form">
            <div className="form-group">
              <label>Mật Khẩu Quản Trị</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                placeholder="Nhập mật khẩu..."
                required
                autoFocus
              />
            </div>
            {adminError && (
              <div className="admin-error">{adminError}</div>
            )}
            <button
              type="submit"
              className="login-btn"
              disabled={!adminPassword}
            >
              🔑 Đăng Nhập Admin
            </button>
            <button
              type="button"
              className="admin-toggle-btn"
              onClick={() => { setIsAdminMode(false); setAdminError(''); }}
            >
              Quay lại đăng nhập người chơi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="login-lanterns">🏮🏮🏮</div>
          <h1 className="login-title">Chúc Mừng Năm Mới</h1>
          <h2 className="login-subtitle">TBS Group - Tết 2026</h2>
          <div className="login-dragon">🐍</div>
          <p className="login-desc">
            Chào mừng bạn đến với sân chơi Tết Nguyên Đán!
            <br />
            Chơi game, nhận xu, đổi quà thật!
          </p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
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
          <button
            type="button"
            className="admin-toggle-btn"
            onClick={() => setIsAdminMode(true)}
          >
            🔐 Đăng nhập Quản Trị
          </button>
        </form>
      </div>
    </div>
  );
}
