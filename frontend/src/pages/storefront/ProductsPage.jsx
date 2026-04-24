import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCardTilt from "../../components/ProductCardTilt";
import { PRODUCT_IMAGE_MAP } from "../../constants/productImageMap";

function ProductsPage({ currentUser, onRequireLogin }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [subscribeTarget, setSubscribeTarget] = useState(null);

  useEffect(() => {
    fetch("/api/store/products")
      .then((response) => response.json())
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        setProducts([]);
      });
  }, []);

  const handleOpenSubscribeModal = (product) => {
    if (!currentUser) {
      onRequireLogin("구독하려면 먼저 로그인해 주세요.");
      return;
    }
    setSubscribeTarget(product);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  return (
    <>
      <section className="list-container">
        <header>
          <h1>상품 목록</h1>
          <span className="count-badge">판매중 {products.length}종</span>
        </header>
        <section className="storefront-split">
          <section className="product-list-pane">
            <p className="product-list-guide">왼쪽 목록에서 상품을 선택해 상세 정보를 확인하세요.</p>
            <section className="product-grid">
              {products.map((product) => {
                const isActive = selectedProduct?.product_no === product.product_no;
                return (
                  <ProductCardTilt
                    key={product.product_no}
                    className={`product-card${isActive ? " is-active" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProduct(product)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelectProduct(product);
                      }
                    }}
                  >
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
                    </div>
                  </ProductCardTilt>
                );
              })}
            </section>
          </section>

          <section className="product-detail-pane">
            {selectedProduct ? (
              <article className="product-detail-card">
                <img
                  className="product-detail-thumb"
                  src={PRODUCT_IMAGE_MAP[selectedProduct.product_name] || "/image/매경e신문.png"}
                  alt={selectedProduct.product_name}
                />
                <div className="product-detail-body">
                  <p className="product-detail-eyebrow">선택된 상품</p>
                  <h2 className="product-detail-name">{selectedProduct.product_name}</h2>
                  <p className="product-detail-desc">
                    {selectedProduct.description || "상품 설명이 아직 등록되지 않았습니다."}
                  </p>
                  <div className="product-detail-meta">
                    <div>
                      <p className="product-detail-meta-label">가격</p>
                      <p className="product-detail-meta-value">
                        {Number(selectedProduct.price || 0).toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="product-detail-meta-label">이용 기간</p>
                      <p className="product-detail-meta-value">{selectedProduct.duration_months || "-"}개월</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-subscribe product-detail-subscribe"
                    onClick={() => handleOpenSubscribeModal(selectedProduct)}
                  >
                    이 상품 구독하기
                  </button>
                </div>
              </article>
            ) : (
              <article className="product-detail-empty">
                <h2>상품을 선택해 주세요</h2>
                <p>왼쪽 목록에서 원하는 상품 카드를 클릭하면 상세 정보가 이곳에 표시됩니다.</p>
              </article>
            )}
          </section>
        </section>
      </section>

      {subscribeTarget ? (
        <div className="modal-backdrop" onClick={() => setSubscribeTarget(null)}>
          <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h2>이 상품을 구독할까요?</h2>
            <p className="confirm-product-name">{subscribeTarget.product_name}</p>
            <p className="confirm-product-price">
              {Number(subscribeTarget.price || 0).toLocaleString()}원 /{" "}
              {subscribeTarget.duration_months || "-"}개월
            </p>
            <p className="confirm-help-text">확인하면 결제 내역 화면으로 이동합니다.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSubscribeTarget(null)}
              >
                취소
              </button>
              <button type="button" className="btn-modal-confirm" onClick={() => navigate("/checkout")}>
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
