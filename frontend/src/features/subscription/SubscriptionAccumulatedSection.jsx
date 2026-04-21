import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";

/** 상품 시리즈마다 다른 색 (스택 세그먼트 순서와 대응) */
const STACK_COLORS = [
  "#f36f21",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#e11d48",
  "#ca8a04",
  "#0891b2",
  "#4f46e5",
  "#db2777",
  "#ea580c",
  "#0d9488",
  "#7c3aed",
];

/**
 * 로그인한 경우에만 렌더링. 상품별로 구매한 구독 플랜 개월(duration_months) 합계 — 개인 데이터
 * 차트: ApexCharts normal stacked horizontal bar
 * @see https://apexcharts.com/docs/chart-types/bar-chart/
 */
export function SubscriptionAccumulatedSection({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let cancelled = false;

    setLoading(true);
    setLoadError("");

    fetch("/api/me/subscription-accumulated", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const msg = data?.message || "데이터를 불러오지 못했습니다.";
          throw new Error(msg);
        }
        return Array.isArray(data) ? data : [];
      })
      .then((list) => {
        if (!cancelled) {
          setRows(list);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setLoadError(err.message || "데이터를 불러오지 못했습니다.");
          setRows([]);
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

  const chartSpec = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    const getMonths = (r) => Number(r.total_subscription_months) || 0;

    const sorted = [...rows].sort((a, b) => getMonths(b) - getMonths(a));

    const series = sorted.map((r) => ({
      name: r.product_name,
      data: [getMonths(r)],
    }));

    const colors = sorted.map((_, i) => STACK_COLORS[i % STACK_COLORS.length]);

    const categoryLabel = "총 구독 개월 (합계)";

    return {
      series,
      options: {
        chart: {
          type: "bar",
          stacked: true,
          stackType: "normal",
          toolbar: { show: false },
          fontFamily: '"Noto Sans KR", sans-serif',
          foreColor: "#58585a",
        },
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 4,
            dataLabels: {
              total: {
                enabled: true,
                offsetX: 8,
                formatter(val) {
                  return val != null && Number(val) > 0 ? `합 ${Math.round(Number(val))}개월` : "";
                },
              },
            },
          },
        },
        colors,
        dataLabels: {
          enabled: true,
          formatter(val) {
            if (val == null || Number(val) === 0) {
              return "";
            }
            return `${Math.round(Number(val))}개월`;
          },
          style: { fontSize: "11px", colors: ["#221e1f"] },
        },
        xaxis: {
          categories: [categoryLabel],
          labels: { style: { fontSize: "12px" } },
        },
        yaxis: {
          labels: {
            maxWidth: 200,
            style: { fontSize: "12px" },
          },
        },
        grid: {
          borderColor: "#e8e8e8",
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
        legend: {
          position: "bottom",
          fontSize: "12px",
          markers: { width: 10, height: 10, radius: 2 },
        },
        tooltip: {
          shared: false,
          intersect: true, // 개별 상품 툴팁 표시
          custom({ series, seriesIndex, dataPointIndex, w }) {
            const months = Math.round(Number(series?.[seriesIndex]?.[dataPointIndex]) || 0);
            const allSeries = w?.config?.series ?? [];
            const total = allSeries.reduce((sum, s) => {
              const v = Number(s?.data?.[dataPointIndex]) || 0;
              return sum + v;
            }, 0);
            const ratio = total > 0 ? (months / total) * 100 : 0;
            const productName = w?.globals?.seriesNames?.[seriesIndex] || "상품";

            return `
              <div class="apex-tooltip-custom">
                <strong>${productName}</strong><br/>
                ${months}개월 (${ratio.toFixed(1)}%)
              </div>
            `;
          },
        },
      },
    };
  }, [rows]);

  if (!currentUser) {
    return null;
  }

  const title = "구독 리포트";
  const caption =
    "결제한 각 구독의 상품 플랜 개월 수를 상품별로 더한 값입니다. 막대는 상품별로 색이 다릅니다.";

  return (
    <section className="main-report">
      <div className="main-home-head">
        <h1>{title}</h1>
        <span className="main-report-caption">{caption}</span>
      </div>

      {loading ? (
        <p className="subscription-chart-status">불러오는 중…</p>
      ) : loadError ? (
        <p className="subscription-chart-status subscription-chart-error">{loadError}</p>
      ) : !chartSpec ? (
        <p className="subscription-chart-status">
          구독 이력이 없습니다. 구매 후에는 여기에 상품별 총 구독 개월이 표시됩니다.
        </p>
      ) : (
        <div className="subscription-chart-wrap subscription-chart-stacked">
          <ReactApexChart
            options={chartSpec.options}
            series={chartSpec.series}
            type="bar"
            height={Math.min(420, Math.max(200, 56 + rows.length * 28))}
          />
        </div>
      )}
    </section>
  );
}
