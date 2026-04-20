import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmMessage, setConfirmMessage] = useState("결제를 확인하고 있습니다.");
  const orderId = searchParams.get("orderId") || "-";
  const amount = Number(searchParams.get("amount") || 0);
  const paymentKey = searchParams.get("paymentKey") || "-";
  const maskedPaymentKey = useMemo(() => {
    if (!paymentKey || paymentKey === "-") {
      return "-";
    }
    if (paymentKey.length <= 14) {
      return paymentKey;
    }
    return `${paymentKey.slice(0, 8)}...${paymentKey.slice(-6)}`;
  }, [paymentKey]);

  useEffect(() => {
    // 쿼리 파라미터 값이 결제 요청할 때 보낸 데이터와 동일한지 반드시 확인하세요.
    // 클라이언트에서 결제 금액을 조작하는 행위를 방지할 수 있습니다.
    const requestData = {
      orderId: searchParams.get("orderId"),
      amount: searchParams.get("amount"),
      paymentKey: searchParams.get("paymentKey"),
    };

    async function confirm() {
      try {
        const response = await fetch("/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const json = await response.json();

        if (!response.ok) {
          // 결제 실패 비즈니스 로직을 구현하세요.
          navigate(`/fail?message=${json.message}&code=${json.code}`);
          return;
        }

        setConfirmMessage("결제가 정상적으로 완료되었습니다.");
      } catch (error) {
        console.error(error);
        setConfirmMessage("결제 완료 정보를 확인하지 못했습니다. 잠시 후 관리자에게 문의해 주세요.");
      } finally {
        setIsConfirming(false);
      }
    }
    confirm();
  }, [navigate, searchParams]);

  return (
    <section className="payment-result-page">
      <div className="payment-result-card success">
        <div className="payment-result-badge">PAYMENT SUCCESS</div>
        <h1>결제가 완료되었습니다</h1>
        <p className="payment-result-description">{confirmMessage}</p>

        <dl className="payment-result-summary">
          <div>
            <dt>주문번호</dt>
            <dd>{orderId}</dd>
          </div>
          <div>
            <dt>결제 금액</dt>
            <dd>{amount.toLocaleString()}원</dd>
          </div>
        </dl>

        <div className="payment-result-actions">
          <Link to="/products" className="payment-link-btn">
            상품 더 보기
          </Link>
          <Link to="/" className="payment-link-btn primary">
            메인으로 이동
          </Link>
        </div>

        {isConfirming ? <p className="payment-result-caption">결제 승인 상태를 확인 중입니다.</p> : null}
      </div>
    </section>
  );
}
