import { useEffect, useState } from "react";
import { PRODUCT_IMAGE_MAP } from "../constants/productImageMap";

function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
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
          </article>
        ))}
      </section>
    </section>
  );
}

export default ProductsPage;
