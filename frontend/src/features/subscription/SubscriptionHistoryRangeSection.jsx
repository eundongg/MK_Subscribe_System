import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";

const PRODUCT_COLORS = [
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
const PRODUCT_ORDER = ["매경e신문", "매경이코노미", "매경럭스멘"];
const PRODUCT_FIXED_COLORS = {
  "매경e신문": "#f36f21", // 주황
  "매경럭스멘": "#16a34a", // 초록
};

function statusText(status) {
  if (!status) {
    return "-";
  }
  const map = { ING: "이용 중", EXPIRED: "만료", END: "종료", CANCEL: "취소" };
  return map[status] || status;
}

function quarterStartTs(ts) {
  const d = new Date(ts);
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), qMonth, 1).getTime();
}

function addMonthsTs(ts, months) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + months, 1).getTime();
}

/**
 * 구독 이력 타임라인 (RangeBar)
 * @see https://apexcharts.com/docs/chart-types/bar-chart/
 */
export function SubscriptionHistoryRangeSection({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetch("/api/me/subscription-history", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "구독 이력을 불러오지 못했습니다.");
        }
        return Array.isArray(data) ? data : [];
      })
      .then((items) => {
        if (!cancelled) {
          setRows(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setLoadError(err.message || "구독 이력을 불러오지 못했습니다.");
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

    const orderMap = new Map(PRODUCT_ORDER.map((name, idx) => [name, idx]));
    const productNames = [...new Set(rows.map((r) => r.product_name).filter(Boolean))].sort((a, b) => {
      const ai = orderMap.has(a) ? orderMap.get(a) : Number.MAX_SAFE_INTEGER;
      const bi = orderMap.has(b) ? orderMap.get(b) : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) {
        return ai - bi;
      }
      return a.localeCompare(b, "ko-KR");
    });
    const colorByProduct = {};
    productNames.forEach((name, idx) => {
      colorByProduct[name] = PRODUCT_FIXED_COLORS[name] || PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
    });

    const data = rows
      .map((r) => {
        const start = new Date(r.start_date).getTime();
        const end = new Date(r.end_date).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return null;
        }
        return {
          x: r.product_name || "상품",
          y: [start, end],
          fillColor: colorByProduct[r.product_name] || PRODUCT_COLORS[0],
          meta: {
            status: r.status,
            startDate: r.start_date,
            endDate: r.end_date,
          },
        };
      })
      .filter(Boolean);
    const todayTs = Date.now();
    const todayLabel = new Date(todayTs).toLocaleDateString("ko-KR");

    const minStart = Math.min(...data.map((p) => p.y[0]));
    const maxEnd = Math.max(...data.map((p) => p.y[1]));
    const xMin = quarterStartTs(minStart);
    const xMax = addMonthsTs(quarterStartTs(maxEnd), 3);
    const monthsSpan =
      (new Date(xMax).getFullYear() - new Date(xMin).getFullYear()) * 12 +
      (new Date(xMax).getMonth() - new Date(xMin).getMonth());
    const tickAmount = Math.max(2, Math.floor(monthsSpan / 3) + 1);

    return {
      legendRows: productNames.map((name) => ({ name, color: colorByProduct[name] })),
      series: [{ name: "구독 기간", data }],
      options: {
        chart: {
          type: "rangeBar",
          toolbar: { show: false },
          fontFamily: '"Noto Sans KR", sans-serif',
          foreColor: "#58585a",
          zoom: {enabled: false},
          selection: {enabled: false},
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: "65%",
            rangeBarGroupRows: true,
            borderRadius: 4,
          },
        },
        xaxis: {
          type: "datetime",
          min: xMin,
          max: xMax,
          tickAmount,
          labels: {
            datetimeUTC: false,
            style: { fontSize: "12px" },
            format: "yyyy년 M월",
          },
        },
        annotations: {
          xaxis: [
            {
              x: todayTs,
              borderColor: "#ef4444",
              strokeDashArray: 6,
              label: {
                text: `today`,
                style: {
                  color: "#fff",
                  background: "#ef4444",
                  fontSize: "11px",
                  fontWeight: 700,
                },
              },
            },
          ],
        },
        yaxis: {
          labels: { style: { fontSize: "12px" } },
        },
        dataLabels: { enabled: false },
        grid: {
          borderColor: "#e8e8e8",
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
        legend: { show: false },
        tooltip: {
          custom({ seriesIndex, dataPointIndex, w }) {
            const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
            const start = point?.meta?.startDate
              ? new Date(point.meta.startDate).toLocaleDateString("ko-KR")
              : "-";
            const end = point?.meta?.endDate ? new Date(point.meta.endDate).toLocaleDateString("ko-KR") : "-";
            return `
              <div class="apex-tooltip-custom">
                <strong>${point?.x || "상품"}</strong><br/>
                기간: ${start} ~ ${end}<br/>
                상태: ${statusText(point?.meta?.status)}
              </div>
            `;
          },
        },
      },
      height: Math.min(520, Math.max(240, 80 + productNames.length * 38)),
    };
  }, [rows]);

  if (!currentUser) {
    return null;
  }

  return (
    <section className="main-report">
      <div className="main-home-head">
        <h1>구독 히스토리</h1>
        <span className="main-report-caption">상품별 구독 기간을 타임라인으로 확인할 수 있습니다.</span>
      </div>

      {loading ? (
        <p className="subscription-chart-status">불러오는 중…</p>
      ) : loadError ? (
        <p className="subscription-chart-status subscription-chart-error">{loadError}</p>
      ) : !chartSpec || chartSpec.series[0].data.length === 0 ? (
        <p className="subscription-chart-status">표시할 구독 이력이 없습니다.</p>
      ) : (
        <>
          <div className="subscription-history-legend">
            {chartSpec.legendRows.map((item) => (
              <span key={item.name} className="subscription-history-legend-item">
                <i style={{ background: item.color }} aria-hidden />
                {item.name}
              </span>
            ))}
          </div>
          <div className="subscription-chart-wrap subscription-chart-history">
            <ReactApexChart
              options={chartSpec.options}
              series={chartSpec.series}
              type="rangeBar"
              height={chartSpec.height}
            />
          </div>
        </>
      )}
    </section>
  );
}
