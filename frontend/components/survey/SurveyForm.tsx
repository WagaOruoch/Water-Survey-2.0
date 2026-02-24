"use client";

import { useState, useMemo } from "react";
import { FieldId, FieldValue, FormValues } from "@/types/survey";
import { computeFlags, isSectionVisible, clearHiddenFields } from "@/lib/formEngine";
import { submitSurveyResponse } from "@/lib/api";
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

type Status = "idle" | "loading" | "success" | "error";

export default function SurveyForm() {
  const [values, setValues]           = useState<FormValues>({});
  const [status, setStatus]           = useState<Status>("idle");
  const [submissionId, setSubmissionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const flags = useMemo(() => computeFlags(values), [values]);

  function handleChange(fieldId: FieldId, value: FieldValue) {
    // Clear validation errors as the user corrects the form
    if (validationErrors.length > 0) setValidationErrors([]);
    setValues((prev) => ({ ...prev, [fieldId]: value }));
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

    try {
      // 3. POST to Django
      const response = await submitSurveyResponse(cleanedValues);

      // 4. Success
      setSubmissionId(response.id);
      setStatus("success");
    } catch (err: unknown) {
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

        <Background values={values} flags={flags} onChange={handleChange} />

        {isSectionVisible("staff_interview", flags) && (
          <StaffInterview values={values} flags={flags} onChange={handleChange} />
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
