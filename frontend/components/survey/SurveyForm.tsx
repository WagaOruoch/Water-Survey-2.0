"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldId, FieldValue, FormValues } from "@/types/survey";
import { computeFlags, isSectionVisible, clearHiddenFields } from "@/lib/formEngine";
import { postSyncTelemetry, submitSurveyResponse } from "@/lib/api";
import {
  createClientSubmissionId,
  enqueueSubmission,
  flushOutbox,
  getOutboxCount,
} from "@/lib/offlineOutbox";
import { Background, StaffInterview, SiteObservation } from "./sections";

// ─────────────────────────────────────────────────────────────
// Required field definitions
// label is shown in the validation error message so the
// enumerator knows exactly which field is missing.
// ─────────────────────────────────────────────────────────────
const ALWAYS_REQUIRED: { id: FieldId; label: string }[] = [
  { id: "site_code", label: "Site code" },
  { id: "site_name", label: "Current site" },
  { id: "is_staffed", label: "Is this site currently staffed?" },
];

// Required only when the Staff Interview section is visible
const CONDITIONAL_REQUIRED: { id: FieldId; label: string }[] = [
  { id: "consent", label: "Respondent consent" },
];

// Required only when the Site Observation section is visible
const OBSERVATION_REQUIRED: { id: FieldId; label: string }[] = [
  { id: "water_source_type", label: "Type of site" },
];

const DEPENDENT_CLEAR_MAP: Partial<Record<FieldId, FieldId[]>> = {
  // Staff interview branches
  staff_role: ["staff_role_other"],
  has_dry_season: ["dry_months"],
  water_delivery_method: [
    "water_delivery_other",
    "knows_water_origin",
    "water_origin",
    "water_is_treated",
    "treatment_methods",
  ],
  knows_water_origin: ["water_origin", "water_is_treated", "treatment_methods"],
  water_is_treated: ["treatment_methods"],

  // Site observation branches
  water_source_type: [
    "piped_subtype",
    "well_subtype",
    "spring_subtype",
    "packaged_subtype",
    "other_source_subtype",
    "surface_water_type",
  ],
  other_source_subtype: ["surface_water_type"],
  used_for_drinking: ["water_access_method"],
};

type Status = "idle" | "loading" | "success" | "error" | "queued";

type LiveFieldErrors = {
  site_code?: string;
  months_at_site?: string;
};

export default function SurveyForm() {
  const [values, setValues]           = useState<FormValues>({});
  const [status, setStatus]           = useState<Status>("idle");
  const [submissionId, setSubmissionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [liveFieldErrors, setLiveFieldErrors] = useState<LiveFieldErrors>({});
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  const flags = useMemo(() => computeFlags(values), [values]);

  function getLiveFieldError(fieldId: "site_code" | "months_at_site", value: FieldValue): string {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value !== "number") return "";

    if (fieldId === "site_code") {
      if (value < 100000 || value > 999999) {
        return "Site code must be a 6 digit number.";
      }
      return "";
    }

    if (value < 1 || value > 11) {
      return "Months at site must be between 1 and 11.";
    }

    return "";
  }

  function isNetworkSubmissionError(error: unknown): boolean {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return true;
    }

    if (typeof error === "object" && error !== null && "response" in error) {
      const response = (error as { response?: unknown }).response;
      return !response;
    }

    return false;
  }

  useEffect(() => {
    let isMounted = true;

    async function refreshQueueCount() {
      const count = await getOutboxCount();
      if (isMounted) setQueuedCount(count);
    }

    async function trySync(event: string) {
      if (!navigator.onLine || syncInProgressRef.current) return;
      syncInProgressRef.current = true;
      setIsSyncing(true);

      try {
        const queuedBefore = await getOutboxCount();
        const result = await flushOutbox();
        if (isMounted) setQueuedCount(result.remaining);

        if (queuedBefore > 0 || result.synced > 0 || result.failed > 0) {
          await postSyncTelemetry({
            event,
            queued: queuedBefore,
            synced: result.synced,
            failed: result.failed,
          });
        }
      } catch {
      } finally {
        syncInProgressRef.current = false;
        if (isMounted) setIsSyncing(false);
      }
    }

    refreshQueueCount();
    trySync("mount");

    const onOnline = () => {
      void trySync("online");
    };

    const onVisibility = () => {
      if (!document.hidden) {
        void trySync("visibility");
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isMounted = false;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function handleChange(fieldId: FieldId, value: FieldValue) {
    // Clear validation errors as the user corrects the form
    if (validationErrors.length > 0) setValidationErrors([]);
    setValues((prev) => {
      const nextValues = { ...prev, [fieldId]: value };

      const dependentFields = DEPENDENT_CLEAR_MAP[fieldId] ?? [];
      for (const dependentField of dependentFields) {
        delete nextValues[dependentField];
      }

      return clearHiddenFields(nextValues);
    });

    if (fieldId === "site_code" || fieldId === "months_at_site") {
      const nextError = getLiveFieldError(fieldId, value);
      setLiveFieldErrors((prev) => ({
        ...prev,
        [fieldId]: nextError || undefined,
      }));
    }
  }

  // ── Validation ───────────────────────────────────────────
  // Returns a list of error strings. Empty array = valid.
  function validateForm(): string[] {
    const errors: string[] = [];

    for (const { id, label } of ALWAYS_REQUIRED) {
      const val = values[id];
      if (val === undefined || val === null || val === "") {
        errors.push(`"${label}" is required.`);
      }
    }

    // Only validate conditional required fields if their section is visible
    if (isSectionVisible("staff_interview", flags)) {
      for (const { id, label } of CONDITIONAL_REQUIRED) {
        const val = values[id];
        if (val === undefined || val === null || val === "") {
          errors.push(`"${label}" is required.`);
        }
      }
    }

    if (isSectionVisible("site_observation", flags)) {
      for (const { id, label } of OBSERVATION_REQUIRED) {
        const val = values[id];
        if (val === undefined || val === null || val === "") {
          errors.push(`"${label}" is required.`);
        }
      }
    }

    const siteCode = values.site_code;
    if (typeof siteCode === "number" && (siteCode < 100000 || siteCode > 999999)) {
      errors.push('"Site code" must be a 6 digit number.');
    }

    const monthsAtSite = values.months_at_site;
    if (typeof monthsAtSite === "number" && (monthsAtSite < 1 || monthsAtSite > 11)) {
      errors.push('"How many months have you worked here?" must be between 1 and 11.');
    }

    return errors;
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Client-side validation
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    // 2. Strip values for any fields that are currently hidden
    const cleanedValues = clearHiddenFields(values);
    const clientSubmissionId = createClientSubmissionId();

    try {
      // 3. POST to Django
      const response = await submitSurveyResponse(cleanedValues, {
        clientSubmissionId,
      });

      // 4. Success
      setSubmissionId(response.id);
      setStatus("success");
    } catch (err: unknown) {
      if (isNetworkSubmissionError(err)) {
        await enqueueSubmission(cleanedValues, clientSubmissionId);
        const count = await getOutboxCount();
        setQueuedCount(count);
        setStatus("queued");
        setErrorMessage("");
        return;
      }

      // 5. Error — surface a readable message
      let message = "Submission failed. Please check your connection and try again.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: unknown } }).response?.data === "object"
      ) {
        message = JSON.stringify(
          (err as { response: { data: unknown } }).response.data
        );
      }

      setErrorMessage(message);
      setStatus("error");
    }
  }

  function handleReset() {
    setValues({});
    setStatus("idle");
    setSubmissionId("");
    setErrorMessage("");
    setValidationErrors([]);
    setLiveFieldErrors({});
  }

  if (status === "queued") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-8 py-10 text-center shadow-sm">
        <div className="mb-3 text-4xl">⏳</div>
        <h2 className="text-lg font-semibold text-amber-800">Saved for sync</h2>
        <p className="mt-2 text-sm text-amber-700">
          You appear to be offline. This survey is queued and will auto-sync when you reconnect.
        </p>
        <p className="mt-4 rounded-lg bg-white px-4 py-2 text-xs text-gray-600 shadow-inner">
          Pending queued surveys: {queuedCount}
        </p>
        <button
          onClick={handleReset}
          className="mt-6 rounded-lg bg-amber-700 px-6 py-2.5 text-sm font-semibold
                     text-white transition hover:bg-amber-800"
        >
          Continue surveying
        </button>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────
  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-8 py-10 text-center shadow-sm">
        <div className="mb-3 text-4xl">✓</div>
        <h2 className="text-lg font-semibold text-green-800">Survey submitted</h2>
        <p className="mt-2 text-sm text-green-700">
          The response has been saved successfully.
        </p>
        <p className="mt-4 rounded-lg bg-white px-4 py-2 font-mono text-xs text-gray-500 shadow-inner">
          ID: {submissionId}
        </p>
        <button
          onClick={handleReset}
          className="mt-6 rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold
                     text-white transition hover:bg-green-800"
        >
          Submit another response
        </button>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-6">

        {queuedCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {isSyncing
              ? `Syncing queued surveys... (${queuedCount} pending)`
              : `${queuedCount} survey${queuedCount > 1 ? "s are" : " is"} queued for sync.`}
          </div>
        )}

        <Background
          values={values}
          flags={flags}
          onChange={handleChange}
          fieldErrors={{
            site_code: liveFieldErrors.site_code,
          }}
        />

        {isSectionVisible("staff_interview", flags) && (
          <StaffInterview
            values={values}
            flags={flags}
            onChange={handleChange}
            fieldErrors={{
              months_at_site: liveFieldErrors.months_at_site,
            }}
          />
        )}

        {isSectionVisible("site_observation", flags) && (
          <SiteObservation values={values} flags={flags} onChange={handleChange} />
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="mb-1 text-sm font-semibold text-red-700">
              Please fix the following before submitting:
            </p>
            <ul className="list-inside list-disc space-y-0.5">
              {validationErrors.map((err) => (
                <li key={err} className="text-sm text-red-600">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* API error */}
        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">Submission error</p>
            <p className="mt-0.5 text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5
                       text-sm font-semibold text-white shadow-sm transition
                       hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {status === "loading" && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {status === "loading" ? "Submitting…" : "Submit Survey"}
          </button>
        </div>

      </div>
    </form>
  );
}
