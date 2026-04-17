import { Link, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/admin/HomePage";
import UsersPage from "./pages/admin/UsersPage";
import ProductsPage from "./pages/storefront/ProductsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import PaymentItemsPage from "./pages/admin/PaymentItemsPage";
import { LegacyPaymentRedirect } from "./LegacyPaymentRedirect";
import { CheckoutPage } from "./payment/Checkout";
import { SuccessPage } from "./payment/Success";
import { FailPage } from "./payment/Fail";

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
        <Route path="/users" element={<Navigate to="/admin/users" replace />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/admin/products" element={<Navigate to="/products" replace />} />
        <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
        <Route path="/payments/:id" element={<LegacyPaymentRedirect />} />

        <Route
          path="/admin/users"
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
          path="/admin/payments"
          element={
            <>
              <Link to="/" className="home-link">
                🏠 메인 대시보드로 돌아가기
              </Link>
              <PaymentsPage />
            </>
          }
        />
        <Route path="/admin/payments/:id" element={<PaymentItemsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/fail" element={<FailPage />} />
      </Routes>
    </main>
  );
}

export default App;
