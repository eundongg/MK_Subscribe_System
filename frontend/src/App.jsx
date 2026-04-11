import { Link, Route, Routes, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PRODUCT_IMAGE_MAP = {
  '매경e신문': '/image/매경e신문.png',
  '매경이코노미': '/image/매경이코노미.png',
  '매경럭스멘': '/image/매경럭스멘.png',
};

function HomePage() {
  return (
    <div className="menu-container">
      <Link to="/users" className="menu-card">
        <span className="icon">👥</span>
        <h2>회원 조회</h2>
      </Link>
      <Link to="/products" className="menu-card">
        <span className="icon">📦</span>
        <h2>상품 목록</h2>
      </Link>
      <Link to="/payments" className="menu-card">
        <span className="icon">💳</span>
        <h2>결제 내역</h2>
      </Link>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then((response) => response.json())
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        setUsers([]);
      });
  }, []);

  return (
    <section className="list-container">
      <header>
        <h1>회원 조회 리스트</h1>
        <span className="count-badge">총 {users.length} 명</span>
      </header>
      <DataTable
        headers={['No.', '이름', '아이디', '가입일']}
        rows={users.map((user, index) => [
          index + 1,
          user.name,
          user.login_id,
          user.created_at ? new Date(user.created_at).toLocaleDateString() : '-',
        ])}
      />
    </section>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then((response) => response.json())
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        setProducts([]);
      });
  }, []);

  return (
    <section className="list-container">
      <header>
        <h1>상품 목록 관리</h1>
        <span className="count-badge">판매중 {products.length}종</span>
      </header>
      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.product_no}>
            <img
              className="product-thumb"
              src={PRODUCT_IMAGE_MAP[product.product_name] || '/image/매경e신문.png'}
              alt={product.product_name}
            />
            <div className="product-body">
              <h2 className="product-name">{product.product_name}</h2>
              <p className="product-desc">
                {product.description || '상품 설명이 아직 등록되지 않았습니다.'}
              </p>
              <div className="product-meta">
                <span className="price-tag">{Number(product.price || 0).toLocaleString()}원</span>
                <span>{product.duration_months || '-'}개월</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function PaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch('/api/payments')
      .then((response) => response.json())
      .then(setPayments)
      .catch((err) => {
        console.error(err);
        setPayments([]);
      });
  }, []);

  return (
    <section className="list-container">
      <header>
        <h1>전체 결제 내역</h1>
        <span className="count-badge">누적 {payments.length}건</span>
      </header>
      <table>
        <thead>
          <tr>
            <th>결제번호</th>
            <th>주문자명</th>
            <th>총 결제금액</th>
            <th>결제 시간</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.payment_no}>
              <td>{payment.payment_no}</td>
              <td>{payment.member_name}</td>
              <td>{Number(payment.total_price || 0).toLocaleString()}원</td>
              <td>
                {payment.payment_date
                  ? new Date(payment.payment_date).toLocaleString('ko-KR')
                  : '-'}
              </td>
              <td>
                <Link to={`/payments/${payment.payment_no}`} className="btn-detail">
                  내역 보기
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PaymentItemsPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`/api/payments/${id}/items`)
      .then((response) => response.json())
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setItems([]);
      });
  }, [id]);

  return (
    <>
      <Link to="/payments" className="back-link">
        ← 결제 목록으로 돌아가기
      </Link>
      <section className="list-container">
        <h2 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 10 }}>
          🧾 상세 영수증 (No. {id})
        </h2>
      <div>
        {items.map((item) => (
          <article className="item-row" key={`${item.payment_no}-${item.product_no}`}>
            <div className="item-header">
              <span className="product-no">구매한 상품 이름: {item.product_name}</span>
              <span className="price">{Number(item.price_at_billing || 0).toLocaleString()}원</span>
            </div>
            <p className="date-info">
              📅 구독 기간: {new Date(item.start_date).toLocaleDateString()} ~{' '}
              {new Date(item.end_date).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
      </section>
    </>
  );
}

function DataTable({ headers, rows }) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((column, colIndex) => (
              <td key={`col-${rowIndex}-${colIndex}`}>{column}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function App() {
  return (
    <main>
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex-center">
              <HomePage />
            </div>
          }
        />
        <Route
          path="/users"
          element={
            <>
              <Link to="/" className="home-link">
                🏠 메인 대시보드로 돌아가기
              </Link>
              <UsersPage />
            </>
          }
        />
        <Route
          path="/products"
          element={
            <>
              <Link to="/" className="home-link">
                🏠 메인 대시보드로 돌아가기
              </Link>
              <ProductsPage />
            </>
          }
        />
        <Route
          path="/payments"
          element={
            <>
              <Link to="/" className="home-link">
                🏠 메인 대시보드로 돌아가기
              </Link>
              <PaymentsPage />
            </>
          }
        />
        <Route path="/payments/:id" element={<PaymentItemsPage />} />
      </Routes>
    </main>
  );
}

export default App;
