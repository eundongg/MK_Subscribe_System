import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="menu-container">
      <Link to="/admin/users" className="menu-card">
        <span className="icon">👥</span>
        <h2>회원 조회</h2>
      </Link>
      <Link to="/products" className="menu-card">
        <span className="icon">📦</span>
        <h2>상품 목록</h2>
      </Link>
      <Link to="/admin/payments" className="menu-card">
        <span className="icon">💳</span>
        <h2>결제 내역</h2>
      </Link>
    </div>
  );
}

export default HomePage;
