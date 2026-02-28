"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAnalyticsSummary } from "@/lib/api";
import { AnalyticsSummaryResponse } from "@/types/survey";

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const SITE_PALETTE = ["#2563eb", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f97316", "#06b6d4", "#a78bfa"];

const SOURCE_PALETTE: Record<string, string> = {
  piped: "#2563eb",
  well: "#0ea5e9",
  spring: "#f59e0b",
  packaged: "#8b5cf6",
  other_sources: "#f97316",
};

export default function AnalyticsPage() {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 6);

  const [startDate, setStartDate] = useState(toIsoDate(defaultStart));
  const [endDate, setEndDate] = useState(toIsoDate(today));
  const [siteName, setSiteName] = useState("");
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendMode, setTrendMode] = useState<"bar" | "line">("line");
  const [activePreset, setActivePreset] = useState<7 | 30 | 90 | "custom">(7);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const summary = await getAnalyticsSummary({
          start_date: startDate,
          end_date: endDate,
          site_name: siteName,
        });
        if (!isMounted) return;
        setData(summary);
      } catch {
        if (!isMounted) return;
        setError("Unable to load analytics right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [endDate, siteName, startDate]);

  const maxTrendCount = useMemo(() => {
    if (!data?.submissions_trend?.length) return 1;
    return Math.max(...data.submissions_trend.map((item) => item.count), 1);
  }, [data?.submissions_trend]);

  const trendSummary = useMemo(() => {
    const trend = data?.submissions_trend ?? [];
    if (trend.length === 0) {
      return {
        peakDate: "N/A",
        peakCount: 0,
        average: 0,
      };
    }

    const peak = trend.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), trend[0]);
    const total = trend.reduce((sum, item) => sum + item.count, 0);

    return {
      peakDate: shortDateLabel(peak.date),
      peakCount: peak.count,
      average: Number((total / trend.length).toFixed(2)),
    };
  }, [data?.submissions_trend]);

  const trendPlotPoints = useMemo(() => {
    const trend = data?.submissions_trend ?? [];
    if (trend.length === 0) return [];

    return trend.map((item, index) => {
      const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100;
      const y = 100 - (item.count / maxTrendCount) * 100;
      return {
        ...item,
        x,
        y,
        label: shortDateLabel(item.date),
      };
    });
  }, [data?.submissions_trend, maxTrendCount]);

  const trendPolylinePoints = useMemo(
    () => trendPlotPoints.map((point) => `${point.x},${point.y}`).join(" "),
    [trendPlotPoints]
  );

  const sourceMax = useMemo(() => {
    if (!data?.water_source_distribution?.length) return 1;
    return Math.max(...data.water_source_distribution.map((item) => item.count), 1);
  }, [data?.water_source_distribution]);

  const sourceLabels: Record<string, string> = {
    piped: "Piped",
    well: "Well",
    spring: "Spring",
    packaged: "Packaged",
    other_sources: "Other sources",
  };

  const siteOptions = useMemo(() => {
    const values = new Set<string>();
    (data?.site_distribution ?? []).forEach((item) => {
      if (item.site_name && item.site_name !== "Unknown") values.add(item.site_name);
    });
    return Array.from(values);
  }, [data?.site_distribution]);

  const siteDistributionTotal = useMemo(
    () => (data?.site_distribution ?? []).reduce((sum, item) => sum + item.count, 0),
    [data?.site_distribution]
  );

  const siteDonutSegments = useMemo(() => {
    if (!siteDistributionTotal) return [];

    let cumulativePct = 0;
    return (data?.site_distribution ?? []).map((item, index) => {
      const percent = (item.count / siteDistributionTotal) * 100;
      const startAngle = (cumulativePct / 100) * 360;
      cumulativePct += percent;
      const endAngle = (cumulativePct / 100) * 360;

      return {
        ...item,
        percent,
        startAngle,
        endAngle,
        color: SITE_PALETTE[index % SITE_PALETTE.length],
      };
    });
  }, [data?.site_distribution, siteDistributionTotal]);

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setStartDate(toIsoDate(start));
    setEndDate(toIsoDate(end));
    if (days === 7 || days === 30 || days === 90) {
      setActivePreset(days);
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    setActivePreset("custom");
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    setActivePreset("custom");
  }

  const activeRangeLabel =
    activePreset === "custom"
      ? "Custom range"
      : activePreset === 7
        ? "Last 7 days"
        : activePreset === 30
          ? "Last 30 days"
          : "Last 90 days";

  const totalSubmissions = data?.kpis.total_submissions.value ?? 0;
  const totalDelta = data?.kpis.total_submissions.delta ?? 0;
  const staffedPct = data?.kpis.staffed_sites_pct.value ?? 0;
  const treatedPct = data?.kpis.treated_water_pct.value ?? 0;

  const responsesBaseParams = `submitted_after=${startDate}&submitted_before=${endDate}`;
  const siteParam = siteName ? `&site_name=${encodeURIComponent(siteName)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics</h2>
          <p className="mt-1 text-sm text-blue-100/85">Aggregated insights for decision-making.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className={`ui-btn-swap rounded-md px-3 py-2 text-xs font-semibold ${
              activePreset === 7
                ? "border border-cyan-300/40 bg-cyan-500/30 text-white hover:bg-cyan-500/45"
                : "border border-white/15 bg-white/10 text-blue-100 hover:bg-white/20"
            }`}
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className={`ui-btn-swap rounded-md px-3 py-2 text-xs font-semibold ${
              activePreset === 30
                ? "border border-cyan-300/40 bg-cyan-500/30 text-white hover:bg-cyan-500/45"
                : "border border-white/15 bg-white/10 text-blue-100 hover:bg-white/20"
            }`}
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(90)}
            className={`ui-btn-swap rounded-md px-3 py-2 text-xs font-semibold ${
              activePreset === 90
                ? "border border-cyan-300/40 bg-cyan-500/30 text-white hover:bg-cyan-500/45"
                : "border border-white/15 bg-white/10 text-blue-100 hover:bg-white/20"
            }`}
          >
            Last 90 days
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-white/20 bg-slate-900/25 p-4 shadow-sm backdrop-blur-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="analytics-start-date" className="text-xs font-medium text-blue-100/90">
              Start date
            </label>
            <input
              id="analytics-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="analytics-end-date" className="text-xs font-medium text-blue-100/90">
              End date
            </label>
            <input
              id="analytics-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="analytics-site-filter" className="text-xs font-medium text-blue-100/90">
              Site
            </label>
            <select
              id="analytics-site-filter"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="app-dark-select rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-50"
            >
              <option value="">All sites</option>
              {siteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-100/90">
            {startDate} to {endDate} · {activeRangeLabel}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}`}
          className="analytics-card-link rounded-lg border border-white/20 bg-slate-900/25 p-5 shadow-sm backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-blue-200">Total Submissions</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "..." : totalSubmissions}</p>
          <p className={`mt-1 text-xs ${totalDelta >= 0 ? "text-emerald-200" : "text-red-200"}`}>
            {loading ? "" : `${totalDelta >= 0 ? "+" : ""}${totalDelta} vs previous period`}
          </p>
        </Link>

        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}&is_staffed=yes`}
          className="analytics-card-link rounded-lg border border-cyan-200/35 bg-cyan-500/10 p-5 shadow-sm backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-cyan-100">Staffed Sites</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "..." : formatPct(staffedPct)}</p>
          <p className="mt-1 text-xs text-cyan-100/85">Among responses with staffed data</p>
        </Link>

        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}&water_is_treated=yes`}
          className="analytics-card-link rounded-lg border border-emerald-200/35 bg-emerald-500/10 p-5 shadow-sm backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-emerald-100">Treated Water</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "..." : formatPct(treatedPct)}</p>
          <p className="mt-1 text-xs text-emerald-100/85">Among responses with treatment data</p>
        </Link>
      </div>

      <section className="rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Survey Submissions Over Time</h3>
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-white/15 bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setTrendMode("bar")}
                className={`ui-btn-swap rounded px-2 py-1 text-xs font-semibold ${
                  trendMode === "bar"
                    ? "bg-white/90 text-blue-800 shadow-sm"
                    : "text-blue-100/85 hover:text-white"
                }`}
              >
                Bar
              </button>
              <button
                type="button"
                onClick={() => setTrendMode("line")}
                className={`ui-btn-swap rounded px-2 py-1 text-xs font-semibold ${
                  trendMode === "line"
                    ? "bg-white/90 text-blue-800 shadow-sm"
                    : "text-blue-100/85 hover:text-white"
                }`}
              >
                Line
              </button>
            </div>

            <Link href={`/app/responses?${responsesBaseParams}${siteParam}`} className="text-sm text-cyan-200 hover:text-white hover:underline">
              Open filtered responses
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs text-blue-200/80">Peak day</p>
            <p className="text-sm font-semibold text-blue-50">
              {loading ? "..." : `${trendSummary.peakDate} (${trendSummary.peakCount})`}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs text-blue-200/80">Average per day</p>
            <p className="text-sm font-semibold text-blue-50">{loading ? "..." : trendSummary.average}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs text-blue-200/80">Total in period</p>
            <p className="text-sm font-semibold text-blue-50">{loading ? "..." : totalSubmissions}</p>
          </div>
        </div>

        <div className="relative h-72 rounded-md border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3">
          <div className="pointer-events-none absolute inset-x-3 top-3 bottom-9">
              <div className="h-full border-b border-white/20">
              <div className="h-1/4 border-t border-dashed border-white/20" />
              <div className="h-1/4 border-t border-dashed border-white/20" />
              <div className="h-1/4 border-t border-dashed border-white/20" />
              <div className="h-1/4 border-t border-dashed border-white/20" />
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-blue-100/80">Loading trend...</p>
          ) : (data?.submissions_trend.length ?? 0) === 0 ? (
            <p className="text-sm text-blue-100/80">No data in selected range.</p>
          ) : trendMode === "bar" ? (
            <div className="relative flex h-full items-end gap-1 overflow-x-auto px-1 pb-6 pt-2">
              {data?.submissions_trend.map((item, index) => {
                const height = Math.max((item.count / maxTrendCount) * 100, item.count > 0 ? 6 : 2);
                const showLabel =
                  index === 0 ||
                  index === data.submissions_trend.length - 1 ||
                  index % Math.max(Math.floor(data.submissions_trend.length / 6), 1) === 0;

                return (
                  <Link
                    key={item.date}
                    href={`/app/responses?${responsesBaseParams}${siteParam}&submitted_after=${item.date}&submitted_before=${item.date}`}
                    className="group relative flex h-full min-w-[24px] flex-1 flex-col justify-end"
                    title={`${shortDateLabel(item.date)}: ${item.count}`}
                  >
                    <div
                      className="w-full rounded-t-md bg-cyan-500 transition-all duration-150 group-hover:scale-y-[1.03] group-hover:bg-cyan-400"
                      style={{ height: `${height}%` }}
                    />
                    {showLabel && (
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-100/75">
                        {shortDateLabel(item.date)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="relative h-full pb-6 pt-2">
              <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="0.4"
                  points={trendPolylinePoints}
                />
              </svg>

              {/* Overlay small round dots using percentage positioning so they stay circular */}
              {trendPlotPoints.map((point) => (
                <span
                  key={point.date}
                  className="absolute h-[5px] w-[5px] rounded-full bg-cyan-300"
                  style={{ left: `${point.x}%`, top: `calc(${point.y}% + 8px)`, transform: "translate(-50%, -50%)" }}
                />
              ))}

              <div className="pointer-events-none absolute inset-x-1 bottom-0 flex justify-between">
                {trendPlotPoints
                  .filter((point, index) => {
                    const trend = data?.submissions_trend ?? [];
                    return (
                      index === 0 ||
                      index === trend.length - 1 ||
                      index % Math.max(Math.floor(trend.length / 6), 1) === 0
                    );
                  })
                  .map((point) => (
                    <span key={`label-${point.date}`} className="text-[10px] text-blue-100/75">
                      {point.label}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white">Water Source Distribution</h3>
          <div className="h-72 rounded-md border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4">
            {(data?.water_source_distribution.length ?? 0) > 0 ? (
              <div className="flex h-full items-end gap-3 overflow-x-auto pb-2">
                {(data?.water_source_distribution ?? []).map((item) => {
                  const height = Math.max((item.count / sourceMax) * 100, 6);
                  const label = sourceLabels[item.key] ?? item.key;
                  const barColor = SOURCE_PALETTE[item.key] ?? "#2563eb";

                  return (
                    <Link
                      key={item.key}
                      href={`/app/responses?${responsesBaseParams}${siteParam}&water_source_type=${encodeURIComponent(item.key)}`}
                      className="group flex h-full min-w-[90px] flex-1 flex-col items-center justify-end"
                      title={`${label}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                    >
                      <div className="mb-2 text-xs text-blue-100/90">{item.count}</div>
                      <div
                        className="w-full rounded-t-md transition-all duration-150 group-hover:scale-y-[1.03] group-hover:opacity-90"
                        style={{ height: `${height}%`, backgroundColor: barColor }}
                      />
                      <div className="mt-2 text-center text-xs text-blue-100/90">{label}</div>
                      <div className="text-[11px] text-blue-200/75">{item.percentage.toFixed(1)}%</div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              !loading && <p className="text-sm text-blue-100/80">No water source data available.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white">Site Location Distribution</h3>
          <div className="h-72 rounded-md border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4">
            {(data?.site_distribution.length ?? 0) > 0 ? (
              <div className="grid h-full gap-4 md:grid-cols-[220px_1fr]">
                <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
                  <svg viewBox="0 0 220 220" className="h-52 w-52 -rotate-90">
                    <circle cx="110" cy="110" r="72" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="24" />

                    {siteDonutSegments.length === 1 && (
                      <circle
                        cx="110"
                        cy="110"
                        r="72"
                        fill="none"
                        stroke={siteDonutSegments[0].color}
                        strokeWidth="24"
                      />
                    )}

                    {siteDonutSegments.length > 1 &&
                      siteDonutSegments.map((segment) => (
                        <path
                          key={`arc-${segment.site_name}`}
                          d={describeArc(110, 110, 72, segment.startAngle, segment.endAngle)}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="24"
                          strokeLinecap="butt"
                        />
                      ))}
                  </svg>

                  <div className="pointer-events-none absolute text-center">
                    <p className="text-xs text-blue-200/80">Total</p>
                    <p className="text-2xl font-bold text-white">{siteDistributionTotal}</p>
                  </div>
                </div>

                <div className="overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {siteDonutSegments.map((segment) => (
                      <Link
                        key={segment.site_name}
                        href={`/app/responses?${responsesBaseParams}&site_name=${encodeURIComponent(segment.site_name)}`}
                        className="flex items-center justify-between rounded-md px-2 py-2 transition hover:bg-white/10"
                        title={`${segment.site_name}: ${segment.count} (${segment.percent.toFixed(1)}%)`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm text-blue-100/95">{segment.site_name}</span>
                        </div>
                        <span className="text-sm font-medium text-blue-100/95">
                          {segment.count} ({segment.percent.toFixed(1)}%)
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              !loading && <p className="text-sm text-blue-100/80">No site distribution data available.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-white">Service Quality Indicators</h3>
        <div className="space-y-3">
          {[
            {
              label: "Staffed",
              value: data?.service_quality.staffed_pct ?? 0,
              color: "bg-blue-600",
              href: `/app/responses?${responsesBaseParams}${siteParam}&is_staffed=yes`,
            },
            {
              label: "Treated",
              value: data?.service_quality.treated_pct ?? 0,
              color: "bg-violet-500",
              href: `/app/responses?${responsesBaseParams}${siteParam}&water_is_treated=yes`,
            },
            {
              label: "Used For Drinking",
              value: data?.service_quality.drinking_pct ?? 0,
              color: "bg-amber-500",
              href: `/app/responses?${responsesBaseParams}${siteParam}&used_for_drinking=yes`,
            },
          ].map((metric) => (
            <Link key={metric.label} href={metric.href} className="block rounded p-2 transition hover:bg-white/10">
              <div className="mb-1 flex items-center justify-between text-sm text-blue-100/90">
                <span>{metric.label}</span>
                <span>{formatPct(metric.value)}</span>
              </div>
              <div className="h-3 rounded bg-white/15">
                <div className={`h-3 rounded ${metric.color}`} style={{ width: `${metric.value}%` }} />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-blue-200/75">
          Quality percentages are calculated using non-null responses for each indicator.
        </p>
      </section>
    </div>
  );
}
