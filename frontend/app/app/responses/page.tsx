"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { exportSurveyResponsesCsv, getSurveyResponses } from "@/lib/api";
import { SurveyResponseDetail, SurveyResponsesQuery } from "@/types/survey";

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

export default function ResponsesPage() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus") ?? "";

  const [rows, setRows] = useState<SurveyResponseDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string>("");

  const [siteName, setSiteName] = useState("");
  const [isStaffed, setIsStaffed] = useState<"" | "yes" | "no">("");
  const [waterSourceType, setWaterSourceType] = useState("");
  const [waterIsTreated, setWaterIsTreated] = useState<"" | "yes" | "no">("");
  const [usedForDrinking, setUsedForDrinking] = useState<"" | "yes" | "no">("");
  const [submittedAfter, setSubmittedAfter] = useState("");
  const [submittedBefore, setSubmittedBefore] = useState("");
  const [period, setPeriod] = useState<"" | "this_week" | "this_month">("");
  const [ordering, setOrdering] = useState<
    "submitted_at" | "-submitted_at" | "site_code" | "-site_code" | "site_name" | "-site_name"
  >("-submitted_at");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sourceLabels: Record<string, string> = {
    piped: "Piped",
    well: "Well",
    spring: "Spring",
    packaged: "Packaged",
    other_sources: "Other sources",
  };

  const query = useMemo<SurveyResponsesQuery>(
    () => ({
      site_name: siteName,
      is_staffed: isStaffed,
      water_source_type: waterSourceType,
      water_is_treated: waterIsTreated,
      used_for_drinking: usedForDrinking,
      submitted_after: submittedAfter,
      submitted_before: submittedBefore,
      period,
      ordering,
      page,
      page_size: pageSize,
    }),
    [
      isStaffed,
      ordering,
      page,
      pageSize,
      period,
      siteName,
      submittedAfter,
      submittedBefore,
      usedForDrinking,
      waterSourceType,
      waterIsTreated,
    ]
  );

  useEffect(() => {
    const initialSite = searchParams.get("site_name") ?? "";
    const initialStaffed = (searchParams.get("is_staffed") ?? "") as "" | "yes" | "no";
    const initialPeriod = (searchParams.get("period") ?? "") as "" | "this_week" | "this_month";
    const initialSource = searchParams.get("water_source_type") ?? "";
    const initialTreated = (searchParams.get("water_is_treated") ?? "") as "" | "yes" | "no";
    const initialDrinking = (searchParams.get("used_for_drinking") ?? "") as "" | "yes" | "no";
    const initialAfter = searchParams.get("submitted_after") ?? "";
    const initialBefore = searchParams.get("submitted_before") ?? "";

    if (initialSite) setSiteName(initialSite);
    if (["yes", "no", ""].includes(initialStaffed)) setIsStaffed(initialStaffed);
    if (["this_week", "this_month", ""].includes(initialPeriod)) setPeriod(initialPeriod);
    if (initialSource) setWaterSourceType(initialSource);
    if (["yes", "no", ""].includes(initialTreated)) setWaterIsTreated(initialTreated);
    if (["yes", "no", ""].includes(initialDrinking)) setUsedForDrinking(initialDrinking);
    if (initialAfter) setSubmittedAfter(initialAfter);
    if (initialBefore) setSubmittedBefore(initialBefore);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadResponses() {
      setLoading(true);
      setError("");

      try {
        const data = await getSurveyResponses(query);
        if (!isMounted) return;
        setRows(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch {
        if (!isMounted) return;
        setError("Unable to load responses.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [query]);

  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
  }, [focusId]);

  const orderedRows = useMemo(() => {
    if (!focusId) return rows;

    const focusIndex = rows.findIndex((row) => row.id === focusId);
    if (focusIndex <= 0) return rows;

    const focused = rows[focusIndex];
    const remaining = rows.filter((row) => row.id !== focusId);
    return [focused, ...remaining];
  }, [focusId, rows]);

  function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  async function handleExportCsv() {
    setExporting(true);
    setError("");

    try {
      const blob = await exportSurveyResponsesCsv(query);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "survey_responses.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to export CSV right now.");
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSiteName("");
    setIsStaffed("");
    setWaterSourceType("");
    setWaterIsTreated("");
    setUsedForDrinking("");
    setSubmittedAfter("");
    setSubmittedBefore("");
    setPeriod("");
    setOrdering("-submitted_at");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Responses</h2>
          <p className="mt-1 text-sm text-gray-600">All submitted responses</p>
        </div>
        <Link
          href="/app/dashboard"
          data-btn="true"
          className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="ui-btn-swap rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="ui-btn-swap rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={siteName}
            onChange={(e) => {
              setPage(1);
              setSiteName(e.target.value);
            }}
            placeholder="Site name (e.g. kisumu)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={isStaffed}
            onChange={(e) => {
              setPage(1);
              setIsStaffed(e.target.value as "" | "yes" | "no");
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Staffed: all</option>
            <option value="yes">Staffed: yes</option>
            <option value="no">Staffed: no</option>
          </select>

          <select
            value={waterSourceType}
            onChange={(e) => {
              setPage(1);
              setWaterSourceType(e.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Water source: all</option>
            <option value="piped">Piped</option>
            <option value="well">Well</option>
            <option value="spring">Spring</option>
            <option value="packaged">Packaged</option>
            <option value="other_sources">Other sources</option>
          </select>

          <select
            value={period}
            onChange={(e) => {
              setPage(1);
              setPeriod(e.target.value as "" | "this_week" | "this_month");
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Period: all</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
          </select>

          <select
            value={waterIsTreated}
            onChange={(e) => {
              setPage(1);
              setWaterIsTreated(e.target.value as "" | "yes" | "no");
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Treated: all</option>
            <option value="yes">Treated: yes</option>
            <option value="no">Treated: no</option>
          </select>

          <select
            value={usedForDrinking}
            onChange={(e) => {
              setPage(1);
              setUsedForDrinking(e.target.value as "" | "yes" | "no");
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Drinking use: all</option>
            <option value="yes">Drinking use: yes</option>
            <option value="no">Drinking use: no</option>
          </select>

          <input
            type="date"
            value={submittedAfter}
            onChange={(e) => {
              setPage(1);
              setSubmittedAfter(e.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={submittedBefore}
            onChange={(e) => {
              setPage(1);
              setSubmittedBefore(e.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={ordering}
            onChange={(e) => {
              setPage(1);
              setOrdering(
                e.target.value as
                  | "submitted_at"
                  | "-submitted_at"
                  | "site_code"
                  | "-site_code"
                  | "site_name"
                  | "-site_name"
              );
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="-submitted_at">Sort: newest first</option>
            <option value="submitted_at">Sort: oldest first</option>
            <option value="site_code">Sort: site code asc</option>
            <option value="-site_code">Sort: site code desc</option>
            <option value="site_name">Sort: site name asc</option>
            <option value="-site_name">Sort: site name desc</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Site Code
                </th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Location
                </th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Submitted
                </th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Staffed
                </th>
                <th className="border-b-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No responses yet.
                  </td>
                </tr>
              )}

              {orderedRows.map((row) => {
                const siteCode = row.site_code as number | null | undefined;
                const location = row.site_name as string | null | undefined;
                const isStaffed = (row.is_staffed as string | null | undefined) ?? "";
                const waterSourceTypeValue = (row.water_source_type as string | null | undefined) ?? "";
                const staffed = isStaffed.toLowerCase() === "yes";
                const isExpanded = expandedId === row.id;
                const isFocused = focusId === row.id;
                const detailEntries = Object.entries(row);

                return (
                  <Fragment key={row.id}>
                    <tr className={isFocused ? "bg-blue-50/60" : ""}>
                      <td className="border-b border-gray-200 px-4 py-4 font-semibold text-gray-900">
                        {siteCode ?? "-"}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-4 text-gray-700">
                        {location || "-"}
                        {waterSourceTypeValue && (
                          <div className="mt-1 text-xs text-gray-500">
                            {sourceLabels[waterSourceTypeValue] ?? waterSourceTypeValue}
                          </div>
                        )}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-4 text-gray-700">
                        {typeof row.submitted_at === "string" ? formatRelativeTime(row.submitted_at) : "-"}
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
                        <button
                          type="button"
                          onClick={() => setExpandedId((prev) => (prev === row.id ? "" : row.id))}
                          className="ui-btn-swap inline-block rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 transition duration-150 hover:scale-105 hover:bg-blue-600 hover:text-white"
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="border-b border-gray-200 bg-gray-50 px-4 py-4">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Field
                                  </th>
                                  <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailEntries.map(([field, value]) => (
                                  <tr key={`${row.id}-${field}`}>
                                    <td className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
                                      {field}
                                    </td>
                                    <td className="border-b border-gray-100 px-3 py-2 text-xs text-gray-600">
                                      {formatValue(value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-600">
          Showing page {page} of {totalPages} ({total} total records)
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="ui-btn-swap rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="ui-btn-swap rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
