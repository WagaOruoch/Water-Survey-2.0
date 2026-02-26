// ─────────────────────────────────────────────────────────────
// Field IDs — meaningful names matching database columns
// ─────────────────────────────────────────────────────────────

export type BackgroundFieldId =
  | "site_code"    // Enter site code (integer)
  | "site_name"    // Choose your current site (select_one)
  | "gps_location" // Record GPS location (geopoint)
  | "survey_date"  // Date of survey (date)
  | "site_photo"   // Take image of site (image)
  | "is_staffed";  // Is this site currently staffed? (yes/no)

export type StaffInterviewFieldId =
  | "consent"               // Do you agree to be interviewed?
  | "staff_role"            // What is your role?
  | "staff_role_other"      // Specify other role (if staff_role == 'other')
  | "years_at_site"         // How many years have you worked here?
  | "months_at_site"        // How many months have you worked here? (0–11)
  | "other_staff_count"     // How many other people work here?
  | "site_age"              // How long has this location been providing water?
  | "has_dry_season"        // Any times of year site is not operating normally?
  | "dry_months"            // Which months? (multi-select array)
  | "water_delivery_method" // How is water delivered to this location?
  | "water_delivery_other"  // State the other delivery method
  | "knows_water_origin"    // Do you know the origin of the water?
  | "water_origin"          // Can you tell me what the origin is?
  | "water_is_treated"      // Do you know if water is treated at the source?
  | "treatment_methods"     // How is the water treated? (multi-select array)
  | "water_delivery_frequency"; // How often is water brought to this location?

export type SiteObservationFieldId =
  | "water_source_type"    // Choose which best reflects the type of site
  | "piped_subtype"        // Piped water sub-type
  | "well_subtype"         // Dug well sub-type
  | "spring_subtype"       // Spring sub-type
  | "packaged_subtype"     // Packaged water sub-type
  | "other_source_subtype" // Other source sub-type
  | "surface_water_type"   // Surface water type
  | "used_for_drinking"    // Is this site used for drinking water?
  | "water_access_method"  // How are people accessing the water?
  | "shore_distances"      // How far from the shore? (multi-select array)
  | "people_count";        // Count people currently getting water

export type FieldId = BackgroundFieldId | StaffInterviewFieldId | SiteObservationFieldId;


// ─────────────────────────────────────────────────────────────
// Field value types
// ─────────────────────────────────────────────────────────────

export type FieldValue = string | string[] | number | null;

export type FormValues = Partial<Record<FieldId, FieldValue>>;


// ─────────────────────────────────────────────────────────────
// Computed flags — derived booleans that drive visibility
// ─────────────────────────────────────────────────────────────

export interface ComputedFlags {
  is_staffed: boolean;               // is_staffed == "yes"
  consent_granted: boolean;          // consent == "yes"
  interview_allowed: boolean;        // is_staffed AND consent_granted
  show_treatment_question: boolean;  // water_delivery_method IN [truck,pipe,other] OR knows_water_origin==no OR water_origin filled
  water_treatment_known: boolean;    // water_is_treated == "yes"
  is_surface_source: boolean;        // other_source_subtype == "surface_91"
  site_observation_visible: boolean; // is_staffed==no OR consent==no OR water_delivery_frequency filled
}


// ─────────────────────────────────────────────────────────────
// Section IDs
// ─────────────────────────────────────────────────────────────

export type SectionId = "background" | "staff_interview" | "site_observation";


// ─────────────────────────────────────────────────────────────
// Option types — named exactly as in the XLSForm choices sheet
// ─────────────────────────────────────────────────────────────

export type YesNo = "yes" | "no";
export type YesNoDk = "yes" | "no" | "idk";

// site_name — site_list
export type SiteOption = "kisumu" | "karemo";

// staff_role
export type StaffRole = "owner" | "staff_person" | "other";

// site_age — site_operation_age
export type SiteOperationAge =
  | "less_one_month"
  | "one_to_six_months"
  | "more_than_six_months";

// dry_months — months (full names from XLSForm)
export type Month =
  | "january" | "february" | "march"     | "april"
  | "may"     | "june"     | "july"      | "august"
  | "september" | "october" | "november" | "december";

// water_delivery_method — delivery_method
export type DeliveryMethod = "truck" | "pipe" | "other" | "idk";

// treatment_methods — water_treatment_method
export type WaterTreatmentMethod =
  | "boil" | "bleach_chlorine" | "cloth" | "water_filter"
  | "solar" | "stand_and_settle" | "treatment_table" | "other" | "idk";

// water_source_type — water_category
export type WaterCategory = "piped" | "well" | "spring" | "packaged" | "other_sources";

// piped_subtype (JMP ladder codes)
export type PipedSubtype = "11" | "12" | "13" | "14";

// well_subtype
export type WellSubtype = "31" | "32";

// spring_subtype
export type SpringSubtype = "41" | "42";

// packaged_subtype
export type PackagedSubtype = "81" | "82";

// other_source_subtype
export type OtherSourceOption =
  | "bh_21" | "rain_water_51" | "tanker_61"
  | "cart_62" | "kiosk_72" | "surface_91";

// surface_water_type
export type SurfaceWaterType = "river" | "stream" | "ditch" | "lake" | "pond";

// water_access_method — accessing_water
export type AccessingWater = "walking" | "stay_on_land" | "nill";

// shore_distances — shore_distance
export type ShoreDistance =
  | "less_than_1_mtr" | "one_to_two_mtr" | "more_than_two_mtr" | "nill";


// ─────────────────────────────────────────────────────────────
// API types
// ─────────────────────────────────────────────────────────────

// Payload sent to POST /api/responses/ — flat form values, no wrapper
export type SurveySubmitPayload = FormValues;

export interface SurveySubmitResponse {
  id: string;
  submitted_at: string;
}

export type SurveyResponseDetail = Record<string, unknown> & {
  id: string;
  submitted_at: string;
};

export interface SurveyResponsesQuery {
  site_name?: string;
  is_staffed?: "yes" | "no" | "";
  water_source_type?: string;
  water_is_treated?: "yes" | "no" | "";
  used_for_drinking?: "yes" | "no" | "";
  submitted_after?: string;
  submitted_before?: string;
  period?: "" | "this_week" | "this_month";
  ordering?: "submitted_at" | "-submitted_at" | "site_code" | "-site_code" | "site_name" | "-site_name";
  page?: number;
  page_size?: number;
}

export interface PaginatedSurveyResponses {
  items: SurveyResponseDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalyticsKpiMetric {
  value: number;
  numerator?: number;
  denominator?: number;
  delta?: number;
  previous_value?: number;
}

export interface AnalyticsTrendItem {
  date: string;
  count: number;
}

export interface AnalyticsWaterSourceItem {
  key: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSiteDistributionItem {
  site_name: string;
  count: number;
}

export interface AnalyticsSummaryResponse {
  filters: {
    start_date: string;
    end_date: string;
    site_name: string;
  };
  kpis: {
    total_submissions: AnalyticsKpiMetric;
    staffed_sites_pct: AnalyticsKpiMetric;
    treated_water_pct: AnalyticsKpiMetric;
  };
  submissions_trend: AnalyticsTrendItem[];
  water_source_distribution: AnalyticsWaterSourceItem[];
  site_distribution: AnalyticsSiteDistributionItem[];
  service_quality: {
    staffed_pct: number;
    treated_pct: number;
    drinking_pct: number;
  };
}

export interface DashboardSummaryResponse {
  total_surveys: number;
  surveys_this_month: number;
  surveys_this_week: number;
  staffing_rate: number;
  top_water_source: string;
  peak_survey_time: string;
}

export interface DashboardRecentActivityItem {
  id: string;
  site_code: number | null;
  location: string | null;
  submitted_at: string;
  is_staffed: string | null;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface GoogleAuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}
