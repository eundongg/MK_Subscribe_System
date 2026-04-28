import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

function parsePaymentNo(raw) {
  if (raw == null || raw === "") {
    return null;
  }
  if (!/^\d+$/.test(String(raw))) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailPaymentNo = useMemo(() => parsePaymentNo(searchParams.get("payment")), [searchParams]);

  const [payments, setPayments] = useState([]);
  const [listLoadError, setListLoadError] = useState("");

  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payments", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error(data?.message || response.statusText);
          setListLoadError(
            response.status === 401
              ? "관리자 데이터를 보려면 로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요."
              : data?.message || "결제 내역을 불러오지 못했습니다."
          );
          setPayments([]);
          return;
        }
        setListLoadError("");
        setPayments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setListLoadError("결제 내역을 불러오지 못했습니다.");
        setPayments([]);
      });
  }, []);

  useEffect(() => {
    if (detailPaymentNo == null) {
      setDetailItems([]);
      setDetailError("");
      setDetailLoading(false);
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    fetch(`/api/admin/payments/${detailPaymentNo}/items`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요."
              : data?.message || "내역을 불러오지 못했습니다."
          );
        }
        return Array.isArray(data) ? data : [];
      })
      .then((items) => {
        if (!cancelled) {
          setDetailItems(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setDetailError(err.message || "내역을 불러오지 못했습니다.");
          setDetailItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailPaymentNo]);

  const openDetail = (paymentNo) => {
    setSearchParams({ payment: String(paymentNo) });
  };

  const closeDetail = () => {
    setSearchParams({});
  };

  const selectedPayment = useMemo(() => {
    if (detailPaymentNo == null) {
      return null;
    }
    return payments.find((p) => Number(p.payment_no) === detailPaymentNo) || null;
  }, [payments, detailPaymentNo]);

  return (
    <section className="list-container">
      <header>
        <h1>전체 결제 내역</h1>
        <span
          style={{
            background: "#ff9500",
            color: "white",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 13,
          }}
        >
          누적 {payments.length}건
        </span>
      </header>
      {listLoadError ? <p className="field-error">{listLoadError}</p> : null}
      <table>
        <thead>
          <tr>
            <th>결제번호</th>
            <th>주문자명</th>
            <th>결제 수단</th>
            <th>총 결제금액</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <tr key={payment.payment_no}>
                <td>{payment.payment_no}</td>
                <td>{payment.member_name}</td>
                <td>{payment.method_name || "-"}</td>
                <td>{Number(payment.total_price || 0).toLocaleString()}원</td>
                <td>
                  <button
                    type="button"
                    className="btn-detail"
                    onClick={() => openDetail(payment.payment_no)}
                  >
                    내역 보기
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 50, color: "#ccc" }}>
                {listLoadError ? "위 안내를 확인해 주세요." : "등록된 결제 내역이 없습니다."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {detailPaymentNo != null ? (
        <div className="modal-backdrop" onClick={closeDetail}>
          <section className="confirm-modal admin-payment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h2>상세 영수증</h2>
            {selectedPayment ? (
              <p className="admin-payment-detail-meta confirm-help-text">
                {selectedPayment.member_name ? `${selectedPayment.member_name} · ` : ""}
                {selectedPayment.payment_date
                  ? new Date(selectedPayment.payment_date).toLocaleString("ko-KR")
                  : ""}
                {selectedPayment.total_price != null
                  ? ` · ${Number(selectedPayment.total_price).toLocaleString()}원`
                  : ""}
              </p>
            ) : null}
            {detailLoading ? (
              <p className="confirm-help-text">내역을 불러오는 중…</p>
            ) : (
              <>
                {detailError ? <p className="field-error">{detailError}</p> : null}
                {!detailError && detailItems.length > 0 ? (
                  <div className="admin-payment-detail-body">
                    {detailItems.map((item) => (
                      <article className="item-row" key={`${item.payment_no}-${item.product_no}`}>
                        <div className="item-header">
                          <span className="product-no">구매한 상품: {item.product_name}</span>
                          <span className="price">{Number(item.price_at_billing || 0).toLocaleString()}원</span>
                        </div>
                        <p className="date-info">
                          구독 기간: {new Date(item.start_date).toLocaleDateString()} ~{" "}
                          {new Date(item.end_date).toLocaleDateString()}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}
                {!detailLoading && !detailError && detailItems.length === 0 ? (
                  <p className="confirm-help-text" style={{ textAlign: "center", padding: "20px 0" }}>
                    표시할 결제 상품 내역이 없습니다.
                  </p>
                ) : null}
              </>
            )}
            <div className="confirm-actions">
              <button type="button" className="btn-modal-cancel" onClick={closeDetail}>
                닫기
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default PaymentsPage;
