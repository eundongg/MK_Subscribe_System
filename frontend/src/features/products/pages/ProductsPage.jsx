import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_IMAGE_MAP } from "../../../constants/productImageMap";
import ProductCardTilt from "../components/ProductCardTilt";

function ProductsPage({ currentUser, onRequireLogin }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
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
    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item.product_no === product.product_no);
      if (exists) {
        return prev.filter((item) => item.product_no !== product.product_no);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const selectedCount = selectedProducts.length;
  const firstSelected = selectedProducts[0] || null;
  const secondSelected = selectedProducts[1] || null;
  const isBundleSelected = selectedCount === 2;
  const originalBundlePrice = selectedProducts.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discountedBundlePrice = Math.floor(originalBundlePrice * 0.95);
  const subscribeProduct =
    selectedCount === 1
      ? firstSelected
      : selectedCount === 2
        ? {
            product_name: `${firstSelected.product_name} + ${secondSelected.product_name} 묶음`,
            price: discountedBundlePrice,
            duration_months: "묶음 상품",
          }
        : null;
  const subscribeDurationText =
    subscribeTarget?.duration_months === "묶음 상품"
      ? "묶음 상품"
      : `${subscribeTarget?.duration_months || "-"}개월`;
  const handleBundleLightMove = (event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--bundle-light-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--bundle-light-y", `${(y / rect.height) * 100}%`);
    card.style.setProperty("--bundle-light-opacity", "0.9");
  };
  const handleBundleLightLeave = (event) => {
    const card = event.currentTarget;
    card.style.setProperty("--bundle-light-opacity", "0");
    card.style.setProperty("--bundle-light-x", "100%");
    card.style.setProperty("--bundle-light-y", "0%");
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
            <p className="product-list-guide">
              왼쪽 목록에서 상품을 선택해 상세 정보를 확인하세요. (최대 2개 선택 가능)
            </p>
            <section className="product-grid">
              {products.map((product) => {
                const isActive = selectedProducts.some(
                  (selectedItem) => selectedItem.product_no === product.product_no
                );
                return (
                  <ProductCardTilt
                    key={product.product_no}
                    className={`product-card${isActive ? " is-active" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
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
            {selectedCount === 1 ? (
              <article className="product-detail-card">
                <img
                  className="product-detail-thumb"
                  src={PRODUCT_IMAGE_MAP[firstSelected.product_name] || "/image/매경e신문.png"}
                  alt={firstSelected.product_name}
                />
                <div className="product-detail-body">
                  <p className="product-detail-eyebrow">선택된 상품</p>
                  <h2 className="product-detail-name">{firstSelected.product_name}</h2>
                  <p className="product-detail-desc">
                    {firstSelected.description || "상품 설명이 아직 등록되지 않았습니다."}
                  </p>
                  <div className="product-detail-meta">
                    <div>
                      <p className="product-detail-meta-label">가격</p>
                      <p className="product-detail-meta-value">
                        {Number(firstSelected.price || 0).toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="product-detail-meta-label">이용 기간</p>
                      <p className="product-detail-meta-value">{firstSelected.duration_months || "-"}개월</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-subscribe product-detail-subscribe"
                    onClick={() => handleOpenSubscribeModal(firstSelected)}
                  >
                    이 상품 구독하기
                  </button>
                </div>
              </article>
            ) : isBundleSelected ? (
              <article
                className="product-detail-card product-detail-card-bundle"
                onMouseMove={handleBundleLightMove}
                onMouseLeave={handleBundleLightLeave}
              >
                <div className="bundle-thumb-stack">
                  <img
                    className="product-detail-thumb product-detail-thumb-split"
                    src={PRODUCT_IMAGE_MAP[firstSelected.product_name] || "/image/매경e신문.png"}
                    alt={firstSelected.product_name}
                  />
                  <img
                    className="product-detail-thumb product-detail-thumb-split"
                    src={PRODUCT_IMAGE_MAP[secondSelected.product_name] || "/image/매경e신문.png"}
                    alt={secondSelected.product_name}
                  />
                </div>
                <div className="product-detail-body">
                  <p className="product-detail-eyebrow">2개 선택 번들</p>
                  <h2 className="product-detail-name">
                    {firstSelected.product_name} + {secondSelected.product_name}
                  </h2>
                  <p className="product-detail-desc">
                    두 상품을 함께 구독하는 조합입니다. 번들 적용 시 결제 금액이 5% 할인됩니다.
                  </p>
                  <div className="product-detail-meta">
                    <div>
                      <p className="product-detail-meta-label">정가 합계</p>
                      <p className="product-detail-meta-value bundle-price-original">
                        {originalBundlePrice.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="product-detail-meta-label">5% 할인 가격</p>
                      <p className="product-detail-meta-value bundle-price-discount">
                        {discountedBundlePrice.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-subscribe product-detail-subscribe"
                    onClick={() => handleOpenSubscribeModal(subscribeProduct)}
                  >
                    번들로 구독하기
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
              {Number(subscribeTarget.price || 0).toLocaleString()}원 / {subscribeDurationText}
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
