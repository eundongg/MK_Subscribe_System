import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payments", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error(data?.message || response.statusText);
          setLoadError(
            response.status === 401
              ? "관리자 데이터를 보려면 로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요."
              : data?.message || "결제 내역을 불러오지 못했습니다."
          );
          setPayments([]);
          return;
        }
        setLoadError("");
        setPayments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("결제 내역을 불러오지 못했습니다.");
        setPayments([]);
      });
  }, []);

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
      {loadError ? <p className="field-error">{loadError}</p> : null}
      <table>
        <thead>
          <tr>
            <th>결제번호</th>
            <th>주문자명</th>
            <th>결제 수단</th>
            <th>총 결제금액</th>
            <th>결제 시간</th>
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
                <td style={{ color: "#666", fontSize: 13 }}>
                  {payment.payment_date
                    ? new Date(payment.payment_date).toLocaleString("ko-KR")
                    : "-"}
                </td>
                <td>
                  <Link to={`/admin/payments/${payment.payment_no}`} className="btn-detail">
                    내역 보기
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 50, color: "#ccc" }}>
                {loadError ? "위 안내를 확인해 주세요." : "등록된 결제 내역이 없습니다."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default PaymentsPage;
