import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthInlineActions } from "./features/auth/components/AuthInlineActions";
import { AuthModal } from "./features/auth/components/AuthModal";
import { useProductAuth } from "./features/auth/hooks/useProductAuth";
import { TodayPopularProducts } from "./features/home/TodayPopularProducts";
import IntroductionPage from "./features/introduction/pages/IntroductionPage";
import ProductsPage from "./features/products/pages/ProductsPage";
import { SubscriptionAccumulatedSection } from "./features/report/components/SubscriptionAccumulatedSection";
import PaymentReportPage from "./features/report/pages/PaymentReportPage";
import UsersPage from "./pages/admin/UsersPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import PaymentItemsPage from "./pages/admin/PaymentItemsPage";
import { LegacyPaymentRedirect } from "./LegacyPaymentRedirect";
import { CheckoutPage } from "./pages/payment/Checkout";
import { SuccessPage } from "./pages/payment/Success";
import { FailPage } from "./pages/payment/Fail";

function AdminRoute({ currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (!currentUser.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainHome({ currentUser }) {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [currentSubscriptionDays, setCurrentSubscriptionDays] = useState(0);

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

  useEffect(() => {
    if (!currentUser) {
      setCurrentSubscriptionDays(0);
      return;
    }

    let cancelled = false;
    fetch("/api/me/subscription-current-days", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          return 0;
        }
        return Number(data?.current_subscription_days) || 0;
      })
      .then((days) => {
        if (!cancelled) {
          setCurrentSubscriptionDays(days);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentSubscriptionDays(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.member_no]);

  return (
    <section className="main-home">
      {currentUser ? (
        <p className="subscription-current-days">
          🔔현재 구독 <strong>{Math.max(0, currentSubscriptionDays).toLocaleString()}일째</strong>
        </p>
      ) : null}
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

      <TodayPopularProducts />
      {currentUser ? <SubscriptionAccumulatedSection currentUser={currentUser} /> : null}
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
          <Link to="/introduction">소개</Link>
          <Link to="/products">상품</Link>
          {auth.currentUser ? <Link to="/report/payments">결제 리포트</Link> : null}
          {auth.currentUser?.is_admin ? (
            <>
              <Link to="/admin/users">회원</Link>
              <Link to="/admin/payments">결제내역</Link>
            </>
          ) : null}
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
          <Route path="/" element={<MainHome currentUser={auth.currentUser} />} />
          <Route path="/introduction" element={<IntroductionPage />} />
          <Route
            path="/report/payments"
            element={<PaymentReportPage currentUser={auth.currentUser} />}
          />
          <Route path="/users" element={<Navigate to="/admin/users" replace />} />
          <Route
            path="/products"
            element={<ProductsPage currentUser={auth.currentUser} onRequireLogin={auth.openLogin} />}
          />
          <Route path="/admin/products" element={<Navigate to="/products" replace />} />
          <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
          <Route path="/payments/:id" element={<LegacyPaymentRedirect />} />

          <Route
            path="/admin/users"
            element={
              <AdminRoute currentUser={auth.currentUser}>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute currentUser={auth.currentUser}>
                <PaymentsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments/:id"
            element={
              <AdminRoute currentUser={auth.currentUser}>
                <PaymentItemsPage />
              </AdminRoute>
            }
          />
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
        passwordRuleMessage={auth.passwordRuleMessage}
        passwordRuleSatisfied={auth.passwordRuleSatisfied}
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
