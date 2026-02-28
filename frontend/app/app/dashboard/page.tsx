"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getDashboardRecentActivity,
  getDashboardSummary,
} from "@/lib/api";
import {
  DashboardRecentActivityItem,
  DashboardSummaryResponse,
} from "@/types/survey";

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const sourceLabels: Record<string, string> = {
  piped: "Piped water",
  well: "Well",
  spring: "Spring",
  packaged: "Packaged",
  other_sources: "Other sources",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [recent, setRecent] = useState<DashboardRecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [summaryData, recentData] = await Promise.all([
          getDashboardSummary(),
          getDashboardRecentActivity(),
        ]);

        if (!isMounted) return;
        setSummary(summaryData);
        setRecent(recentData);
      } catch {
        if (!isMounted) return;
        setError("Unable to load dashboard data right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const insights = useMemo(() => {
    if (!summary) return [];

    const waterSource =
      sourceLabels[summary.top_water_source] ?? summary.top_water_source ?? "N/A";
    const peakTime = summary.peak_survey_time || "N/A";

    return [
      `${summary.staffing_rate}% of sites are staffed`,
      `Most common water source: ${waterSource}`,
      `Peak survey time: ${peakTime}`,
    ];
  }, [summary]);

  const totalSurveys = summary?.total_surveys ?? 0;
  const surveysThisMonth = summary?.surveys_this_month ?? 0;
  const surveysThisWeek = summary?.surveys_this_week ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Link href="/app/responses" className="analytics-card-link rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-200">Total</div>
          <div className="mb-1 text-4xl font-bold text-white">{loading ? "..." : totalSurveys}</div>
          <div className="text-sm text-blue-100/90">surveys</div>
        </Link>
        <Link href="/app/responses?period=this_month" className="analytics-card-link rounded-lg border border-cyan-200/35 bg-cyan-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-cyan-100">This Month</div>
          <div className="mb-1 text-4xl font-bold text-white">{loading ? "..." : surveysThisMonth}</div>
          <div className="text-sm text-cyan-100/90">surveys</div>
        </Link>
        <Link href="/app/responses?period=this_week" className="analytics-card-link rounded-lg border border-emerald-200/35 bg-emerald-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-emerald-100">This Week</div>
          <div className="mb-1 text-4xl font-bold text-white">{loading ? "..." : surveysThisWeek}</div>
          <div className="text-sm text-emerald-100/90">surveys</div>
        </Link>
      </div>

      <section className="mb-8 rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          <Link
            href="/app/responses"
            data-btn="true"
            className="inline-block rounded border border-white/20 bg-white/5 px-2 py-1 text-sm font-medium text-blue-100 transition duration-150 hover:scale-105 hover:bg-blue-500/70 hover:text-white"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-white/5">
              <tr>
                <th className="border-b border-white/15 px-4 py-3 text-left text-sm font-semibold text-blue-100">Site Code</th>
                <th className="border-b border-white/15 px-4 py-3 text-left text-sm font-semibold text-blue-100">Location</th>
                <th className="border-b border-white/15 px-4 py-3 text-left text-sm font-semibold text-blue-100">Date</th>
                <th className="border-b border-white/15 px-4 py-3 text-left text-sm font-semibold text-blue-100">Staff</th>
                <th className="border-b border-white/15 px-4 py-3 text-left text-sm font-semibold text-blue-100">View</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-blue-200/80">
                    No survey activity yet.
                  </td>
                </tr>
              )}

              {recent.map((item) => {
                const staffed = (item.is_staffed ?? "").toLowerCase() === "yes";
                return (
                  <tr key={item.id}>
                    <td className="border-b border-white/10 px-4 py-4 font-semibold text-white">
                      {item.site_code ?? "-"}
                    </td>
                    <td className="border-b border-white/10 px-4 py-4 text-blue-100/90">
                      {item.location || "-"}
                    </td>
                    <td className="border-b border-white/10 px-4 py-4 text-blue-100/90">
                      {formatRelativeTime(item.submitted_at)}
                    </td>
                    <td className="border-b border-white/10 px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          staffed
                            ? "border border-emerald-200/40 bg-emerald-500/20 text-emerald-100"
                            : "border border-amber-200/40 bg-amber-500/20 text-amber-100"
                        }`}
                      >
                        {staffed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="border-b border-white/10 px-4 py-4">
                      <Link
                        href={`/app/responses?focus=${item.id}`}
                        data-btn="true"
                        className="rounded border border-cyan-200/30 bg-cyan-500/15 px-3 py-1 text-sm text-cyan-100 transition duration-150 hover:scale-105 hover:bg-cyan-500/40 hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/20 bg-slate-900/25 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Insights</h3>
        <ul className="space-y-3 text-sm leading-6 text-blue-100/90">
          {insights.map((insight, index) => {
            let href = "/app/responses";
            if (index === 0) href = "/app/responses?is_staffed=yes";
            if (index === 1) {
              const topSource = summary?.top_water_source ?? "";
              href = topSource ? `/app/responses?water_source_type=${encodeURIComponent(topSource)}` : "/app/responses";
            }
            if (index === 2) href = "/app/responses?period=this_week";

            return (
            <li
              key={insight}
              className={index < insights.length - 1 ? "border-b border-white/10 pb-3" : ""}
            >
              <Link href={href} className="inline-block rounded px-1 py-0.5 transition hover:bg-white/10 hover:text-white">
                {insight}
              </Link>
            </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
