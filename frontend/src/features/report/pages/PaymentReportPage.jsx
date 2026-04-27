import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { SubscriptionHistoryRangeSection } from "../components/SubscriptionHistoryRangeSection";

const PERIODS = [
  { id: "all", label: "전체" },
  { id: "30d", label: "최근 30일" },
  { id: "90d", label: "최근 90일" },
  { id: "year", label: "올해" },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function filterByPeriod(payments, periodId) {
  if (periodId === "all") {
    return payments;
  }
  const now = new Date();
  if (periodId === "year") {
    const y = now.getFullYear();
    return payments.filter((p) => {
      if (!p.payment_date) {
        return false;
      }
      const t = new Date(p.payment_date);
      return t.getFullYear() === y;
    });
  }
  const days = periodId === "30d" ? 30 : 90;
  const cutoff = startOfDay(now);
  cutoff.setDate(cutoff.getDate() - days);
  return payments.filter((p) => {
    if (!p.payment_date) {
      return false;
    }
    return new Date(p.payment_date) >= cutoff;
  });
}

/** 상품 플랜 개월 우선, 없으면 구독 시작·종료일로 대략 개월 수 추정 */
function subscriptionMonthsLabel(it) {
  const planMonths = Number(it.product_duration_months);
  if (planMonths > 0) {
    return `${planMonths}개월 구독`;
  }
  if (it.start_date && it.end_date) {
    const s = new Date(it.start_date);
    const e = new Date(it.end_date);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e >= s) {
      const inclusiveDays = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
      const approx = Math.max(1, Math.round(inclusiveDays / 30));
      return `${approx}개월 구독`;
    }
  }
  return "개월 정보 없음";
}

function productCountLabel(payment, items) {
  if (Array.isArray(items) && items.length > 0) {
    const names = items.map((it) => it.product_name).filter(Boolean);
    const uniqueCount = new Set(names).size || items.length;
    return `상품 ${uniqueCount}개`;
  }
  const raw = (payment?.product_names || "").trim();
  if (!raw) {
    return "상품 0개";
  }
  const count = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean).length;
  return `상품 ${count}개`;
}

export default function PaymentReportPage({ currentUser }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [period, setPeriod] = useState("all");
  const [expandedNo, setExpandedNo] = useState(null);
  const [itemsByPayment, setItemsByPayment] = useState({});
  const [itemsLoadingNo, setItemsLoadingNo] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [productsByNo, setProductsByNo] = useState({});
  const [selectedRenewProduct, setSelectedRenewProduct] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setPayments([]);
      setLoading(false);
      setLoadError("");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetch("/api/me/payments", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "결제 내역을 불러오지 못했습니다.");
        }
        return Array.isArray(data) ? data : [];
      })
      .then((rows) => {
        if (!cancelled) {
          setPayments(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "결제 내역을 불러오지 못했습니다.");
          setPayments([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.member_no]);

  useEffect(() => {
    if (!currentUser) {
      setHistoryRows([]);
      return undefined;
    }
    let cancelled = false;
    fetch("/api/me/subscription-history", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "구독 이력을 불러오지 못했습니다.");
        }
        return Array.isArray(data) ? data : [];
      })
      .then((rows) => {
        if (!cancelled) {
          setHistoryRows(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.member_no]);

  useEffect(() => {
    if (!currentUser) {
      setProductsByNo({});
      return undefined;
    }
    let cancelled = false;
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((products) => {
        if (cancelled) {
          return;
        }
        const map = {};
        (Array.isArray(products) ? products : []).forEach((p) => {
          map[p.product_no] = p;
        });
        setProductsByNo(map);
      })
      .catch(() => {
        if (!cancelled) {
          setProductsByNo({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.member_no]);

  const filtered = useMemo(() => filterByPeriod(payments, period), [payments, period]);

  const summary = useMemo(() => {
    const count = filtered.length;
    const total = filtered.reduce((s, p) => s + Number(p.total_price || 0), 0);
    let lastDate = null;
    filtered.forEach((p) => {
      if (!p.payment_date) {
        return;
      }
      const t = new Date(p.payment_date);
      if (!lastDate || t > lastDate) {
        lastDate = t;
      }
    });
    return { count, total, lastDate };
  }, [filtered]);

  const renewTarget = useMemo(() => {
    if (!Array.isArray(historyRows) || historyRows.length === 0) {
      return null;
    }
    const now = new Date();
    const candidates = historyRows
      .filter((row) => String(row.status || "").toUpperCase() === "ING" && row.end_date)
      .map((row) => {
        const end = new Date(row.end_date);
        return { ...row, endDate: end };
      })
      .filter((row) => !Number.isNaN(row.endDate.getTime()) && row.endDate >= now);
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort((a, b) => a.endDate - b.endDate);
    const target = candidates[0];
    const diffDays = Math.max(
      0,
      Math.ceil((target.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (diffDays > 14) {
      return null;
    }
    return {
      ...target,
      dDay: diffDays,
      displayProduct: productsByNo[target.product_no] || null,
    };
  }, [historyRows, productsByNo]);

  const loadItems = useCallback(
    (paymentNo) => {
      if (itemsByPayment[paymentNo]) {
        return;
      }
      setItemsLoadingNo(paymentNo);
      fetch(`/api/me/payments/${paymentNo}/items`, { credentials: "include" })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(data?.message || "상세를 불러오지 못했습니다.");
          }
          return Array.isArray(data) ? data : [];
        })
        .then((items) => {
          setItemsByPayment((prev) => ({ ...prev, [paymentNo]: items }));
        })
        .catch(() => {
          setItemsByPayment((prev) => ({ ...prev, [paymentNo]: [] }));
        })
        .finally(() => {
          setItemsLoadingNo(null);
        });
    },
    [itemsByPayment]
  );

  const toggleExpand = (paymentNo) => {
    if (expandedNo === paymentNo) {
      setExpandedNo(null);
      return;
    }
    setExpandedNo(paymentNo);
    loadItems(paymentNo);
  };

  if (!currentUser) {
    return (
      <section className="payment-report-page">
        <div className="payment-report-guest">
          <div className="payment-report-guest-card">
            <h1>결제 리포트</h1>
            <p>결제 리포트는 로그인 후 확인할 수 있습니다. 상단 메뉴에서 로그인해 주세요.</p>
            <Link to="/" className="payment-report-back-home">
              홈으로
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-report-page">
      <header className="payment-report-header">
        <div>
          <p className="payment-report-eyebrow">내 구독 · 결제</p>
          <h1>결제 리포트</h1>
          <p className="payment-report-lead">
            결제일·금액·수단을 한눈에 보고, 각 건마다 구매한 상품 내역을 펼쳐 확인할 수 있습니다.
          </p>
        </div>
      </header>

      {renewTarget ? (
        <button
          type="button"
          className="renew-bubble"
          onClick={() => setSelectedRenewProduct(renewTarget.displayProduct || renewTarget)}
        >
          <img src="/image/지붕이.png" alt="지붕이 캐릭터" className="renew-bubble-image" />
          <span className="renew-bubble-balloon">
            {renewTarget.dDay <= 7
              ? `${renewTarget.product_name} 곧 끝나요! (D-${renewTarget.dDay})`
              : `${renewTarget.product_name} 계속 구독할까요?`}
          </span>
        </button>
      ) : null}

      <SubscriptionHistoryRangeSection currentUser={currentUser} />

      <div className="payment-report-summary-row">
        <article className="payment-report-stat">
          <span className="payment-report-stat-label">선택 기간 결제액</span>
          <strong className="payment-report-stat-value">
            {summary.total.toLocaleString()}
            <small>원</small>
          </strong>
        </article>
        <article className="payment-report-stat">
          <span className="payment-report-stat-label">결제 건수</span>
          <strong className="payment-report-stat-value">{summary.count.toLocaleString()}건</strong>
        </article>
        <article className="payment-report-stat payment-report-stat-muted">
          <span className="payment-report-stat-label">가장 최근 결제</span>
          <strong className="payment-report-stat-value payment-report-stat-value-sm">
            {summary.lastDate ? summary.lastDate.toLocaleDateString("ko-KR") : "-"}
          </strong>
        </article>
      </div>

      <div className="payment-report-toolbar">
        <span className="payment-report-toolbar-label">기간</span>
        <div className="payment-report-chips" role="tablist" aria-label="기간 필터">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`payment-report-chip ${period === p.id ? "is-active" : ""}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="payment-report-status">불러오는 중…</p>
      ) : loadError ? (
        <p className="payment-report-status payment-report-status-error">{loadError}</p>
      ) : filtered.length === 0 ? (
        <div className="payment-report-empty">
          <p>이 기간에 표시할 결제 내역이 없습니다.</p>
          <span>다른 기간을 선택해 보세요.</span>
        </div>
      ) : (
        <ul className="payment-report-timeline">
          {filtered.map((p) => {
            const open = expandedNo === p.payment_no;
            const items = itemsByPayment[p.payment_no];
            const loadingItems = itemsLoadingNo === p.payment_no;
            return (
              <li key={p.payment_no} className="payment-report-card-wrap">
                <article className="payment-report-card">
                  <button
                    type="button"
                    className="payment-report-card-main"
                    onClick={() => toggleExpand(p.payment_no)}
                    aria-expanded={open}
                    aria-label={open ? "결제 상세 접기" : "결제 상세 펼치기"}
                  >
                    <div className="payment-report-card-date">
                      <span className="payment-report-dot" aria-hidden />
                      <time dateTime={p.payment_date || undefined}>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </time>
                    </div>
                    <div className="payment-report-card-body">
                      <div className="payment-report-card-top">
                        <span className="payment-report-card-product-names" title={p.product_names || ""}>
                          {(p.product_names || "").trim() ||
                            ((items || [])
                              .map((x) => x.product_name)
                              .filter(Boolean)
                              .filter((v, i, a) => a.indexOf(v) === i)
                              .join(", ") ||
                              "상품 정보 없음")}
                        </span>
                        <span className="payment-report-card-amount">
                          {Number(p.total_price || 0).toLocaleString()}원
                        </span>
                      </div>
                      <div className="payment-report-card-meta">
                        <span className="payment-report-pill">{p.method_name || "수단 미상"}</span>
                      </div>
                    </div>
                  </button>
                  {open ? (
                    <div className="payment-report-detail">
                      <div className="payment-report-detail-meta">
                        <span className="payment-report-success-badge">결제 완료</span>
                        <span className="payment-report-item-count">{productCountLabel(p, items)}</span>
                      </div>
                      {loadingItems ? (
                        <p className="payment-report-detail-status">상세 불러오는 중…</p>
                      ) : !items || items.length === 0 ? (
                        <p className="payment-report-detail-status">표시할 품목이 없습니다.</p>
                      ) : (
                        <ul className="payment-report-lines">
                          {items.map((it) => (
                            <li key={`${it.payment_no}-${it.product_no}-${it.start_date ?? ""}`}>
                              <div className="payment-report-line-simple">
                                <span className="payment-report-line-name">{it.product_name}</span>
                                <span className="payment-report-line-months">{subscriptionMonthsLabel(it)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {selectedRenewProduct ? (
        <div className="modal-backdrop" onClick={() => setSelectedRenewProduct(null)}>
          <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h2>이 상품을 구독할까요?</h2>
            <p className="confirm-product-name">{selectedRenewProduct.product_name}</p>
            <p className="confirm-product-price">
              {Number(selectedRenewProduct.price || 0).toLocaleString()}원 /{" "}
              {selectedRenewProduct.duration_months || "-"}개월
            </p>
            <p className="confirm-help-text">확인하면 결제 내역 화면으로 이동합니다.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedRenewProduct(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                onClick={() => {
                  setSelectedRenewProduct(null);
                  navigate("/checkout");
                }}
              >
                구독 진행
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
