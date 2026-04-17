import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function PaymentItemsPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/payments/${id}/items`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error(data?.message || response.statusText);
          setLoadError(
            response.status === 401
              ? "로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요."
              : data?.message || "내역을 불러오지 못했습니다."
          );
          setItems([]);
          return;
        }
        setLoadError("");
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("내역을 불러오지 못했습니다.");
        setItems([]);
      });
  }, [id]);

  return (
    <>
      <Link to="/admin/payments" className="back-link">
        ← 결제 목록으로 돌아가기
      </Link>
      <section className="list-container">
        <h2 style={{ borderBottom: "2px solid var(--primary)", paddingBottom: 10 }}>
          상세 영수증 (No. {id})
        </h2>
        {loadError ? <p className="field-error">{loadError}</p> : null}
        <div>
          {items.length > 0 ? (
            items.map((item) => (
              <article className="item-row" key={`${item.payment_no}-${item.product_no}`}>
                <div className="item-header">
                  <span className="product-no">구매한 상품 이름: {item.product_name}</span>
                  <span className="price">
                    {Number(item.price_at_billing || 0).toLocaleString()}원
                  </span>
                </div>
                <p className="date-info">
                  📅 구독 기간: {new Date(item.start_date).toLocaleDateString()} ~{" "}
                  {new Date(item.end_date).toLocaleDateString()}
                </p>
              </article>
            ))
          ) : (
            <p style={{ textAlign: "center", padding: 40, color: "#ccc" }}>
              내역이 없거나, 로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

export default PaymentItemsPage;
