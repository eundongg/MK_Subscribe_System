import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthInlineActions } from "./features/auth/components/AuthInlineActions";
import { AuthModal } from "./features/auth/components/AuthModal";
import { useProductAuth } from "./features/auth/hooks/useProductAuth";
import UsersPage from "./pages/admin/UsersPage";
import ProductsPage from "./pages/storefront/ProductsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import PaymentItemsPage from "./pages/admin/PaymentItemsPage";
import { LegacyPaymentRedirect } from "./LegacyPaymentRedirect";
import { CheckoutPage } from "./pages/payment/Checkout";
import { SuccessPage } from "./pages/payment/Success";
import { FailPage } from "./pages/payment/Fail";

function MainHome() {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const mockSubscriptionReport = [
    { productName: "매경e신문", monthly: { "1개월": 32, "3개월": 18, "6개월": 10 } },
    { productName: "매경이코노미", monthly: { "1개월": 21, "3개월": 14, "6개월": 7 } },
    { productName: "지면신문", monthly: { "1개월": 16, "3개월": 12, "6개월": 5 } },
  ];

  useEffect(() => {
    fetch("/api/store/products")
      .then((response) => response.json())
      .then((products) => {
        if (!Array.isArray(products) || products.length === 0) {
          setRecommendedProducts([]);
          return;
        }
        const shuffled = [...products].sort(() => Math.random() - 0.5);
        setRecommendedProducts(shuffled.slice(0, 2));
      })
      .catch((error) => {
        console.error(error);
        setRecommendedProducts([]);
      });
  }, []);

  return (
    <section className="main-home">
      <div className="main-home-head">
        <h1>오늘의 추천 상품</h1>
        <Link to="/products" className="text-link-btn">
          전체 상품 보기
        </Link>
      </div>
      <div className="main-reco-grid">
        {recommendedProducts.map((product, index) => (
          <article className="main-reco-card" key={product.product_no}>
            <span className="main-reco-rank">추천 {index + 1}</span>
            <div className="main-reco-body">
              <h2>{product.product_name}</h2>
              <span className="main-reco-desc">
                {product.description || "지금 가장 많이 보는 구독 상품입니다."}
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="main-report">
        <div className="main-home-head">
          <h1>구독 리포트</h1>
          <span className="main-report-caption">가상 데이터 기준</span>
        </div>
        <div className="main-report-list">
          {mockSubscriptionReport.map((item) => {
            const maxCount = Math.max(...Object.values(item.monthly));
            return (
              <article className="main-report-card" key={item.productName}>
                <h2>{item.productName}</h2>
                <div className="main-report-metrics">
                  {Object.entries(item.monthly).map(([period, count]) => (
                    <div className="main-report-row" key={period}>
                      <span className="main-report-period">{period}</span>
                      <div className="main-report-bar-wrap">
                        <div
                          className="main-report-bar"
                          style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                        />
                      </div>
                      <span className="main-report-count">{count}건</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function App() {
  const auth = useProductAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link to="/" className="brand-link">
          <img src="/image/logo_maekyung.jpg" alt="매일경제 로고" className="brand-logo" />
          <span className="brand-text">매경 구독 서비스</span>
        </Link>
        <nav className="top-nav-links">
          <Link to="/products">상품</Link>
          <Link to="/admin/users">회원</Link>
          <Link to="/admin/payments">결제내역</Link>
        </nav>
        <div className="top-nav-auth">
          <AuthInlineActions
            currentUser={auth.currentUser}
            onLogin={auth.openLogin}
            onSignup={auth.openSignup}
            onLogout={auth.logout}
          />
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<MainHome />} />
          <Route path="/users" element={<Navigate to="/admin/users" replace />} />
          <Route
            path="/products"
            element={<ProductsPage currentUser={auth.currentUser} onRequireLogin={auth.openLogin} />}
          />
          <Route path="/admin/products" element={<Navigate to="/products" replace />} />
          <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
          <Route path="/payments/:id" element={<LegacyPaymentRedirect />} />

          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/payments/:id" element={<PaymentItemsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/fail" element={<FailPage />} />
        </Routes>
      </main>

      <AuthModal
        authMode={auth.authMode}
        authMessage={auth.authMessage}
        signupForm={auth.signupForm}
        loginForm={auth.loginForm}
        idCheck={auth.idCheck}
        passwordMatches={auth.passwordMatches}
        canProceedSignup={auth.canProceedSignup}
        canProceedLogin={auth.canProceedLogin}
        passwordMinLength={auth.passwordMinLength}
        onClose={auth.closeAuthModal}
        onChangeSignupField={auth.changeSignupField}
        onChangeLoginField={auth.changeLoginField}
        onCheckLoginId={auth.checkLoginId}
        onSignup={auth.signup}
        onLogin={auth.login}
      />

      <footer className="app-footer">© 2026 Maekyung Subscription</footer>
    </div>
  );
}

export default App;
