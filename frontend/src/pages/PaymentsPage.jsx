import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function PaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch("/api/payments")
      .then((response) => response.json())
      .then(setPayments)
      .catch((err) => {
        console.error(err);
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
          {payments.map((payment) => (
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
                <Link to={`/payments/${payment.payment_no}`} className="btn-detail">
                  내역 보기
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default PaymentsPage;
