import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function PaymentItemsPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`/api/admin/payments/${id}/items`)
      .then((response) => response.json())
      .then(setItems)
      .catch((err) => {
        console.error(err);
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
        <div>
          {items.map((item) => (
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
          ))}
        </div>
      </section>
    </>
  );
}

export default PaymentItemsPage;
