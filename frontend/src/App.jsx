import { Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentItemsPage from "./pages/PaymentItemsPage";
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
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/fail" element={<FailPage />} />
      </Routes>
    </main>
  );
}

export default App;
