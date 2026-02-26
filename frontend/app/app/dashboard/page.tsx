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
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Link href="/app/responses" className="rounded-lg bg-white p-6 shadow-sm transition hover:scale-[1.01] hover:bg-blue-50">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Total</div>
          <div className="mb-1 text-4xl font-bold text-gray-900">{loading ? "..." : totalSurveys}</div>
          <div className="text-sm text-gray-500">surveys</div>
        </Link>
        <Link href="/app/responses?period=this_month" className="rounded-lg bg-white p-6 shadow-sm transition hover:scale-[1.01] hover:bg-blue-50">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">This Month</div>
          <div className="mb-1 text-4xl font-bold text-gray-900">{loading ? "..." : surveysThisMonth}</div>
          <div className="text-sm text-gray-500">surveys</div>
        </Link>
        <Link href="/app/responses?period=this_week" className="rounded-lg bg-white p-6 shadow-sm transition hover:scale-[1.01] hover:bg-blue-50">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">This Week</div>
          <div className="mb-1 text-4xl font-bold text-gray-900">{loading ? "..." : surveysThisWeek}</div>
          <div className="text-sm text-gray-500">surveys</div>
        </Link>
      </div>

      <section className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
          <Link
            href="/app/responses"
            className="inline-block rounded px-2 py-1 text-sm font-medium text-blue-600 transition duration-150 hover:scale-105 hover:bg-blue-600 hover:text-white"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">Site Code</th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">Staff</th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">View</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No survey activity yet.
                  </td>
                </tr>
              )}

              {recent.map((item) => {
                const staffed = (item.is_staffed ?? "").toLowerCase() === "yes";
                return (
                  <tr key={item.id}>
                    <td className="border-b border-gray-200 px-4 py-4 font-semibold text-gray-900">
                      {item.site_code ?? "-"}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-4 text-gray-700">
                      {item.location || "-"}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-4 text-gray-700">
                      {formatRelativeTime(item.submitted_at)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          staffed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {staffed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 px-4 py-4">
                      <Link
                        href={`/app/responses?focus=${item.id}`}
                        className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 transition duration-150 hover:scale-105 hover:bg-blue-600 hover:text-white"
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

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-gray-900">Insights</h3>
        <ul className="space-y-3 text-sm leading-6 text-gray-700">
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
              className={index < insights.length - 1 ? "border-b border-gray-100 pb-3" : ""}
            >
              <Link href={href} className="inline-block rounded px-1 py-0.5 transition hover:bg-blue-50 hover:text-blue-700">
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
