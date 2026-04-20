import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * 비로그인 메인: 전역 기준 인기 상품(진행 중 구독이 많은 순) 2개, 추천 상품과 동일한 카드 UI
 * 개인 식별·로그인 여부와 무관
 */
export function TodayPopularProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/store/popular-products")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!Array.isArray(data) || data.length === 0) {
          setProducts([]);
          return;
        }
        setProducts(data.slice(0, 2));
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) {
          setProducts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="main-popular main-report" aria-labelledby="popular-heading">
      <div className="main-home-head">
        <h1 id="popular-heading">오늘의 인기 상품</h1>
        <Link to="/products" className="text-link-btn">
          전체 상품 보기
        </Link>
      </div>
      <div className="main-reco-grid">
        {products.map((product, index) => (
          <article className="main-reco-card main-reco-card-popular" key={product.product_no}>
            <span className="main-reco-rank popular-rank">인기 {index + 1}</span>
            <div className="main-reco-body">
              <h2>{product.product_name}</h2>
              <span className="main-reco-desc">
                {product.description || "지금 가장 많이 선택받는 구독 상품입니다."}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
