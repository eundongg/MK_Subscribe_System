import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";

/**
 * 관리자용 — 선택한 월의 가입일(created_at) 일자별 가입자 수. X축: 1일~말일.
 * 마커 표시: https://apexcharts.com/docs/chart-types/line-chart/ (Controlling markers/points)
 */
export function SignupMonthlyChart() {
  const nowInit = new Date();
  const [year, setYear] = useState(nowInit.getFullYear());
  const [month, setMonth] = useState(nowInit.getMonth() + 1);
  const [series, setSeries] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const y0 = new Date().getFullYear();
    const list = [];
    for (let y = y0; y >= y0 - 8; y -= 1) {
      list.push(y);
    }
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    fetch(`/api/admin/signups-daily?${params.toString()}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "일자별 가입 통계를 불러오지 못했습니다.");
        }
        return Array.isArray(data?.series) ? data.series : [];
      })
      .then((rows) => {
        if (!cancelled) {
          setSeries(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setLoadError(err.message || "일자별 가입 통계를 불러오지 못했습니다.");
          setSeries([]);
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
  }, [year, month]);

  const chartSpec = useMemo(() => {
    if (series.length === 0) {
      return null;
    }
    const categories = series.map((row) => `${Number(row.day)}일`);
    const data = series.map((row) => Number(row.count) || 0);
    const manyDays = series.length > 16;
    return {
      options: {
        chart: {
          type: "line",
          toolbar: { show: false },
          zoom: { enabled: false },
          selection: { enabled: false },
          fontFamily: "inherit",
        },
        stroke: {
          curve: "smooth",
          width: 2,
        },
        markers: {
          size: 5,
          hover: { size: 7 },
        },
        dataLabels: { enabled: false },
        colors: ["#2563eb"],
        xaxis: {
          categories,
          title: { text: "일 (해당 월)" },
          labels: {
            rotate: manyDays ? -45 : 0,
            rotateAlways: manyDays,
            hideOverlappingLabels: true,
          },
        },
        yaxis: {
          title: { text: "가입자 수 (명)" },
          min: 0,
          labels: {
            formatter: (val) => (Number.isFinite(val) ? Math.round(val).toLocaleString() : ""),
          },
        },
        tooltip: {
          x: {
            formatter: (_val, opts) => {
              const i = opts.dataPointIndex;
              const d = series[i]?.day;
              return d != null ? `${year}년 ${month}월 ${d}일` : "";
            },
          },
          y: {
            formatter: (val) => `${Number(val || 0).toLocaleString()}명`,
          },
        },
        grid: {
          borderColor: "#e5e7eb",
        },
      },
      series: [{ name: "가입자 수", data }],
    };
  }, [series, year, month]);

  const periodLabel = `${year}년 ${month}월`;

  return (
    <div className="admin-signup-chart-wrap">
      <div className="admin-signup-chart-head">
        <h2 className="admin-signup-chart-title">월별 가입자 추이 (일자)</h2>
        <div className="admin-signup-chart-controls">
          <label className="admin-signup-chart-select-label">
            연도
            <select
              className="admin-signup-chart-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </label>
          <label className="admin-signup-chart-select-label">
            월
            <select
              className="admin-signup-chart-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <p className="admin-signup-chart-hint">
        {periodLabel} 기준 가입일(등록일)의 일자별 신규 가입 인원입니다. 가로축은 해당 월의 일수(1일~말일)입니다.
      </p>
      {loading ? (
        <p className="admin-signup-chart-placeholder">통계를 불러오는 중…</p>
      ) : null}
      {loadError ? <p className="field-error">{loadError}</p> : null}
      {!loading && !loadError && chartSpec ? (
        <div className="admin-signup-chart-inner">
          <ReactApexChart options={chartSpec.options} series={chartSpec.series} type="line" height={320} />
        </div>
      ) : null}
    </div>
  );
}
