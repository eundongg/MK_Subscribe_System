import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCardTilt from "../../components/ProductCardTilt";
import { PRODUCT_IMAGE_MAP } from "../../constants/productImageMap";

function ProductsPage({ currentUser, onRequireLogin }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    setSelectedProduct(product);
  };

  return (
    <>
      <section className="list-container">
        <header>
          <h1>상품 목록</h1>
          <span className="count-badge">판매중 {products.length}종</span>
        </header>
        <section className="product-grid">
          {products.map((product) => (
            <ProductCardTilt key={product.product_no} className="product-card">
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
            </ProductCardTilt>
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
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedProduct(null)}
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
