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

export default function AnalyticsPage() {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 29);

  const [startDate, setStartDate] = useState(toIsoDate(defaultStart));
  const [endDate, setEndDate] = useState(toIsoDate(today));
  const [siteName, setSiteName] = useState("");
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendMode, setTrendMode] = useState<"bar" | "line">("bar");

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

  const siteMax = useMemo(() => {
    if (!data?.site_distribution?.length) return 1;
    return Math.max(...data.site_distribution.map((item) => item.count), 1);
  }, [data?.site_distribution]);

  const sourceLabels: Record<string, string> = {
    piped: "Piped",
    well: "Well",
    spring: "Spring",
    packaged: "Packaged",
    other_sources: "Other sources",
  };

  const sitePalette = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
  ];

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
        color: sitePalette[index % sitePalette.length],
      };
    });
  }, [data?.site_distribution, siteDistributionTotal]);

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setStartDate(toIsoDate(start));
    setEndDate(toIsoDate(end));
  }

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
          <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">Aggregated insights for decision-making.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(90)}
            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            Last 90 days
          </button>
        </div>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All sites</option>
            {siteOptions.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {startDate} to {endDate}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}`}
          className="rounded-lg bg-white p-5 shadow-sm transition hover:bg-blue-50"
        >
          <p className="text-sm font-medium text-gray-500">Total Submissions</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : totalSubmissions}</p>
          <p className={`mt-1 text-xs ${totalDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {loading ? "" : `${totalDelta >= 0 ? "+" : ""}${totalDelta} vs previous period`}
          </p>
        </Link>

        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}&is_staffed=yes`}
          className="rounded-lg bg-white p-5 shadow-sm transition hover:bg-blue-50"
        >
          <p className="text-sm font-medium text-gray-500">Staffed Sites</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : formatPct(staffedPct)}</p>
          <p className="mt-1 text-xs text-gray-500">Among responses with staffed data</p>
        </Link>

        <Link
          href={`/app/responses?${responsesBaseParams}${siteParam}&water_is_treated=yes`}
          className="rounded-lg bg-white p-5 shadow-sm transition hover:bg-blue-50"
        >
          <p className="text-sm font-medium text-gray-500">Treated Water</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : formatPct(treatedPct)}</p>
          <p className="mt-1 text-xs text-gray-500">Among responses with treatment data</p>
        </Link>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Survey Submissions Over Time</h3>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setTrendMode("bar")}
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  trendMode === "bar"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Bar
              </button>
              <button
                type="button"
                onClick={() => setTrendMode("line")}
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  trendMode === "line"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Line
              </button>
            </div>

            <Link href={`/app/responses?${responsesBaseParams}${siteParam}`} className="text-sm text-blue-600 hover:underline">
              Open filtered responses
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Peak day</p>
            <p className="text-sm font-semibold text-gray-800">
              {loading ? "..." : `${trendSummary.peakDate} (${trendSummary.peakCount})`}
            </p>
          </div>
          <div className="rounded-md bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Average per day</p>
            <p className="text-sm font-semibold text-gray-800">{loading ? "..." : trendSummary.average}</p>
          </div>
          <div className="rounded-md bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Total in period</p>
            <p className="text-sm font-semibold text-gray-800">{loading ? "..." : totalSubmissions}</p>
          </div>
        </div>

        <div className="relative h-72 rounded-md border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-3">
          <div className="pointer-events-none absolute inset-x-3 top-3 bottom-9">
            <div className="h-full border-b border-gray-200">
              <div className="h-1/4 border-t border-dashed border-gray-200" />
              <div className="h-1/4 border-t border-dashed border-gray-200" />
              <div className="h-1/4 border-t border-dashed border-gray-200" />
              <div className="h-1/4 border-t border-dashed border-gray-200" />
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Loading trend...</p>
          ) : (data?.submissions_trend.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No data in selected range.</p>
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
                    className="group relative flex h-full min-w-[18px] flex-1 flex-col justify-end"
                    title={`${shortDateLabel(item.date)}: ${item.count}`}
                  >
                    <div
                      className="w-full rounded-t-md bg-blue-600 transition-all duration-150 group-hover:scale-y-[1.03] group-hover:bg-blue-700"
                      style={{ height: `${height}%` }}
                    />
                    {showLabel && (
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
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
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  points={trendPolylinePoints}
                />
                {trendPlotPoints.map((point) => (
                  <circle
                    key={point.date}
                    cx={point.x}
                    cy={point.y}
                    r="1.3"
                    fill="#1d4ed8"
                  />
                ))}
              </svg>

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
                    <span key={`label-${point.date}`} className="text-[10px] text-gray-500">
                      {point.label}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Water Source Distribution</h3>
          <div className="h-72 rounded-md border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4">
            {(data?.water_source_distribution.length ?? 0) > 0 ? (
              <div className="flex h-full items-end gap-3 overflow-x-auto pb-2">
                {(data?.water_source_distribution ?? []).map((item) => {
                  const height = Math.max((item.count / sourceMax) * 100, 6);
                  const label = sourceLabels[item.key] ?? item.key;

                  return (
                    <Link
                      key={item.key}
                      href={`/app/responses?${responsesBaseParams}${siteParam}&water_source_type=${encodeURIComponent(item.key)}`}
                      className="group flex h-full min-w-[90px] flex-1 flex-col items-center justify-end"
                      title={`${label}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                    >
                      <div className="mb-2 text-xs text-gray-600">{item.count}</div>
                      <div
                        className="w-full rounded-t-md bg-blue-600 transition-all duration-150 group-hover:scale-y-[1.03] group-hover:bg-blue-700"
                        style={{ height: `${height}%` }}
                      />
                      <div className="mt-2 text-center text-xs text-gray-600">{label}</div>
                      <div className="text-[11px] text-gray-500">{item.percentage.toFixed(1)}%</div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              !loading && <p className="text-sm text-gray-500">No water source data available.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Site Location Distribution</h3>
          <div className="h-72 rounded-md border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4">
            {(data?.site_distribution.length ?? 0) > 0 ? (
              <div className="grid h-full gap-4 md:grid-cols-[220px_1fr]">
                <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
                  <svg viewBox="0 0 220 220" className="h-52 w-52 -rotate-90">
                    <circle cx="110" cy="110" r="72" fill="none" stroke="#e5e7eb" strokeWidth="24" />

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
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{siteDistributionTotal}</p>
                  </div>
                </div>

                <div className="overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {siteDonutSegments.map((segment) => (
                      <Link
                        key={segment.site_name}
                        href={`/app/responses?${responsesBaseParams}&site_name=${encodeURIComponent(segment.site_name)}`}
                        className="flex items-center justify-between rounded-md px-2 py-2 transition hover:bg-blue-50"
                        title={`${segment.site_name}: ${segment.count} (${segment.percent.toFixed(1)}%)`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm text-gray-700">{segment.site_name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {segment.count} ({segment.percent.toFixed(1)}%)
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              !loading && <p className="text-sm text-gray-500">No site distribution data available.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Service Quality Indicators</h3>
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
              color: "bg-emerald-600",
              href: `/app/responses?${responsesBaseParams}${siteParam}&water_is_treated=yes`,
            },
            {
              label: "Used For Drinking",
              value: data?.service_quality.drinking_pct ?? 0,
              color: "bg-amber-500",
              href: `/app/responses?${responsesBaseParams}${siteParam}&used_for_drinking=yes`,
            },
          ].map((metric) => (
            <Link key={metric.label} href={metric.href} className="block rounded p-2 transition hover:bg-blue-50">
              <div className="mb-1 flex items-center justify-between text-sm text-gray-700">
                <span>{metric.label}</span>
                <span>{formatPct(metric.value)}</span>
              </div>
              <div className="h-3 rounded bg-gray-100">
                <div className={`h-3 rounded ${metric.color}`} style={{ width: `${metric.value}%` }} />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Quality percentages are calculated using non-null responses for each indicator.
        </p>
      </section>
    </div>
  );
}
