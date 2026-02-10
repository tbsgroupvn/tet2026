import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (name: string, department: string) => void;
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

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && department) {
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
        </form>
      </div>
    </div>
  );
}
