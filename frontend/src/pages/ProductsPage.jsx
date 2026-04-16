import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_IMAGE_MAP } from "../constants/productImageMap";

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [signupForm, setSignupForm] = useState({
    loginId: "",
    password: "",
    name: "",
    isOver14: false,
    agreeSignup: false,
  });

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        setProducts([]);
      });
  }, []);

  const handleOpenSubscribeModal = (product) => {
    setSelectedProduct(product);
    setSignupForm({
      loginId: "",
      password: "",
      name: "",
      isOver14: false,
      agreeSignup: false,
    });
  };

  const handleChangeField = (field, value) => {
    setSignupForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const canProceedSubscribe =
    signupForm.loginId.trim() !== "" &&
    signupForm.password.trim() !== "" &&
    signupForm.name.trim() !== "" &&
    signupForm.isOver14 &&
    signupForm.agreeSignup;

  return (
    <>
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
                src={PRODUCT_IMAGE_MAP[product.product_name] || "/image/매경e신문.png"}
                alt={product.product_name}
              />
              <div className="product-body">
                <h2 className="product-name">{product.product_name}</h2>
                <p className="product-desc">
                  {product.description || "상품 설명이 아직 등록되지 않았습니다."}
                </p>
                <div className="product-meta">
                  <span className="price-tag">{Number(product.price || 0).toLocaleString()}원</span>
                  <span>{product.duration_months || "-"}개월</span>
                </div>
                <button
                  type="button"
                  className="btn-subscribe"
                  onClick={() => handleOpenSubscribeModal(product)}
                >
                  구독하기
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
      {selectedProduct ? (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h2>이 상품을 구독할까요?</h2>
            <p className="confirm-product-name">{selectedProduct.product_name}</p>
            <p className="confirm-product-price">
              {Number(selectedProduct.price || 0).toLocaleString()}원 /{" "}
              {selectedProduct.duration_months || "-"}개월
            </p>
            <p className="confirm-help-text">확인하면 결제 내역 화면으로 이동합니다.</p>
            <div className="signup-fields">
              <label className="signup-field">
                회원 아이디
                <input
                  type="text"
                  value={signupForm.loginId}
                  onChange={(event) => handleChangeField("loginId", event.target.value)}
                  placeholder="아이디를 입력하세요"
                />
              </label>
              <label className="signup-field">
                비밀번호
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => handleChangeField("password", event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
              </label>
              <label className="signup-field">
                이름
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(event) => handleChangeField("name", event.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={signupForm.isOver14}
                  onChange={(event) => handleChangeField("isOver14", event.target.checked)}
                />
                만 14세 이상입니다.
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={signupForm.agreeSignup}
                  onChange={(event) => handleChangeField("agreeSignup", event.target.checked)}
                />
                위 정보로 회원가입 및 이용약관에 동의합니다.
              </label>
            </div>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedProduct(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                disabled={!canProceedSubscribe}
                onClick={() => navigate("/checkout")} // 토스페이먼츠 api 호출
              >
                구독 진행
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default ProductsPage;
