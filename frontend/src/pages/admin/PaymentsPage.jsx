import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
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
  const [shareRows, setShareRows] = useState([]);
  const [shareLoading, setShareLoading] = useState(true);
  const [shareError, setShareError] = useState("");
  const [shareTotal, setShareTotal] = useState(0);

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
    let cancelled = false;
    setShareLoading(true);
    setShareError("");
    fetch("/api/admin/report/product-payment-share", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "상품별 결제 비율을 불러오지 못했습니다.");
        }
        return data || {};
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        const items = Array.isArray(data.items) ? data.items : [];
        setShareRows(items);
        setShareTotal(Number(data.totalLineCount || 0));
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setShareError(err.message || "상품별 결제 비율을 불러오지 못했습니다.");
          setShareRows([]);
          setShareTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setShareLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
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

  const donutSpec = useMemo(() => {
    if (shareRows.length === 0) {
      return null;
    }
    const labels = shareRows.map((r) => r.product_name);
    const series = shareRows.map((r) => Number(r.line_count || 0));
    const colors = shareRows.map((r) => {
      const name = String(r.product_name || "").replace(/\s+/g, "");
      if (name.includes("매경e신문")) return "#f36f21";
      if (name.includes("매경이코노미")) return "#2563eb";
      if (name.includes("매경럭스맨")) return "#16a34a";
      return "#7c3aed";
    });
    return {
      series,
      options: {
        chart: {
          events: {
            dataPointSelection: (event, chartContext, config) => {
              event?.preventDefault?.();
              return false;
            },
          },
          type: "donut",
          fontFamily: '"Noto Sans KR", sans-serif',
          toolbar: { show: false },
        },
        plotOptions: {
          pie: {
            expandOnClick: false,
          },
        },
        states: {
          active: { filter: { type: "none" } },
        },
        labels,
        colors,
        dataLabels: {
          enabled: true,
          formatter: (val) => `${Number(val).toFixed(1)}%`,
        },
 
        legend: {
          position: "bottom",
          fontSize: "12px",
          onItemClick: {
            toggleDataSeries: false,
          },
        },
        tooltip: {
          custom: ({ seriesIndex }) => {
            const row = shareRows[seriesIndex];
            if (!row) {
              return "";
            }
            const count = Number(row.line_count || 0);
            const sharePct = Number(row.share_pct || 0);
            const yoy = row.yoy_pct;
            const yoyText =
              yoy == null
                ? "작년 대비 데이터 없음"
                : `작년 대비 ${Math.abs(Number(yoy)).toFixed(1)}%${Number(yoy) >= 0 ? "↑" : "↓"}`;
            return `
              <div class="apex-tooltip-custom">
                <strong>${row.product_name}</strong><br/>
                ${count.toLocaleString()}건 (${sharePct.toFixed(1)}%)<br/>
                ${yoyText}
              </div>
            `;
          },
        },
      },
    };
  }, [shareRows, shareTotal]);

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
      <section className="main-report admin-payment-share-report">
        <div className="main-home-head">
          <h1>상품별 결제 비율</h1>
          <span className="main-report-caption">고객 결제에서 각 상품이 차지하는 비율 (라인 기준)</span>
        </div>
        {shareLoading ? (
          <p className="subscription-chart-status">불러오는 중…</p>
        ) : shareError ? (
          <p className="subscription-chart-status subscription-chart-error">{shareError}</p>
        ) : !donutSpec ? (
          <p className="subscription-chart-status">표시할 결제 데이터가 없습니다.</p>
        ) : (
          <div className="subscription-chart-wrap admin-payment-share-donut">
            <ReactApexChart options={donutSpec.options} series={donutSpec.series} type="donut" height={350} />
          </div>
        )}
      </section>
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
