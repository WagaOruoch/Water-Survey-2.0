import {
  ComputedFlags,
  FieldId,
  FormValues,
  SectionId,
} from "@/types/survey";

// ─────────────────────────────────────────────────────────────
// computeFlags
// ─────────────────────────────────────────────────────────────

export function computeFlags(values: FormValues): ComputedFlags {
  const is_staffed = values.is_staffed === "yes";

  const consent_granted = values.consent === "yes";

  const interview_allowed = is_staffed && consent_granted;

  // water_is_treated visible when:
  // water_delivery_method is truck/pipe/other  OR  knows_water_origin is no  OR  water_origin has a value
  const show_treatment_question =
    (typeof values.water_delivery_method === "string" &&
      ["truck", "pipe", "other"].includes(values.water_delivery_method)) ||
    values.knows_water_origin === "no" ||
    (typeof values.water_origin === "string" && values.water_origin.trim() !== "");

  const water_treatment_known = values.water_is_treated === "yes";

  const is_surface_source = values.other_source_subtype === "surface_91";

  // Site observation visible when:
  // is_staffed == no  (unstaffed — skip interview)  OR
  // consent == no  (consent declined — skip interview)  OR
  // water_delivery_frequency is filled  (interview completed)
  const site_observation_visible =
    values.is_staffed === "no" ||
    values.consent === "no" ||
    (typeof values.water_delivery_frequency === "string" &&
      values.water_delivery_frequency.trim() !== "");

  return {
    is_staffed,
    consent_granted,
    interview_allowed,
    show_treatment_question,
    water_treatment_known,
    is_surface_source,
    site_observation_visible,
  };
}


// ─────────────────────────────────────────────────────────────
// isSectionVisible
// ─────────────────────────────────────────────────────────────

export function isSectionVisible(
  sectionId: SectionId,
  flags: ComputedFlags
): boolean {
  switch (sectionId) {
    case "background":
      return true;
    case "staff_interview":
      return flags.is_staffed;
    case "site_observation":
      return flags.site_observation_visible;
  }
}


// ─────────────────────────────────────────────────────────────
// isFieldVisible
// Each case mirrors the field's relevant expression in the XLSForm.
// ─────────────────────────────────────────────────────────────

export function isFieldVisible(
  fieldId: FieldId,
  values: FormValues,
  flags: ComputedFlags
): boolean {
  switch (fieldId) {

    // ── Background — always visible ───────────────────────
    case "site_code":
    case "site_name":
    case "gps_location":
    case "survey_date":
    case "site_photo":
    case "is_staffed":
      return true;

    // ── Staff Interview ───────────────────────────────────
    case "consent":
      return flags.is_staffed;

    // Visible only when interview_allowed (is_staffed AND consent_granted)
    case "staff_role":
    case "years_at_site":
    case "months_at_site":
    case "other_staff_count":
    case "site_age":
    case "has_dry_season":
    case "water_delivery_method":
    case "water_delivery_frequency":
      return flags.interview_allowed;

    case "dry_months":
      // relevant: has_dry_season == 'yes'
      return values.has_dry_season === "yes";

    case "water_delivery_other":
      // relevant: water_delivery_method == 'other'
      return values.water_delivery_method === "other";

    case "knows_water_origin":
      // relevant: water_delivery_method == 'idk'
      return values.water_delivery_method === "idk";

    case "water_origin":
      // relevant: knows_water_origin == 'yes'
      return values.knows_water_origin === "yes";

    case "water_is_treated":
      return flags.show_treatment_question;

    case "treatment_methods":
      // relevant: water_is_treated == 'yes'
      return flags.water_treatment_known;

    // ── Site Observation ──────────────────────────────────
    case "water_source_type":
    case "used_for_drinking":
    case "shore_distances":
    case "people_count":
      return flags.site_observation_visible;

    case "piped_subtype":
      return values.water_source_type === "piped";

    case "well_subtype":
      return values.water_source_type === "well";

    case "spring_subtype":
      return values.water_source_type === "spring";

    case "packaged_subtype":
      return values.water_source_type === "packaged";

    case "other_source_subtype":
      return values.water_source_type === "other_sources";

    case "surface_water_type":
      // relevant: other_source_subtype == 'surface_91'
      return flags.is_surface_source;

    case "water_access_method":
      // relevant: used_for_drinking == 'yes'
      return values.used_for_drinking === "yes";
  }
}


// ─────────────────────────────────────────────────────────────
// clearHiddenFields
// Strips values for hidden fields before submission.
// Iterates until stable (cascading clears settle in ≤3 passes).
// ─────────────────────────────────────────────────────────────

export function clearHiddenFields(values: FormValues): FormValues {
  const allFields: FieldId[] = [
    // Background
    "site_code", "site_name", "gps_location", "survey_date", "site_photo", "is_staffed",
    // Staff Interview
    "consent", "staff_role", "years_at_site", "months_at_site", "other_staff_count",
    "site_age", "has_dry_season", "dry_months",
    "water_delivery_method", "water_delivery_other", "knows_water_origin", "water_origin",
    "water_is_treated", "treatment_methods", "water_delivery_frequency",
    // Site Observation
    "water_source_type", "piped_subtype", "well_subtype", "spring_subtype",
    "packaged_subtype", "other_source_subtype", "surface_water_type",
    "used_for_drinking", "water_access_method", "shore_distances", "people_count",
  ];

  let current = { ...values };

  for (let pass = 0; pass < 10; pass++) {
    const flags = computeFlags(current);
    const next: FormValues = {};

    for (const fieldId of allFields) {
      if (
        fieldId in current &&
        current[fieldId] !== undefined &&
        isFieldVisible(fieldId, current, flags)
      ) {
        next[fieldId] = current[fieldId];
      }
    }

    if (Object.keys(next).length === Object.keys(current).length) {
      return next;
    }

    current = next;
  }

  return current;
}
