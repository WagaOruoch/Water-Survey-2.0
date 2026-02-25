import { ComputedFlags, FieldId, FieldValue, FormValues } from "@/types/survey";
import { isFieldVisible } from "@/lib/formEngine";
import { SelectOne, SelectMultiple, TextField, IntegerField } from "../fields";
import SectionCard from "./SectionCard";

interface Props {
  values: FormValues;
  flags: ComputedFlags;
  onChange: (fieldId: FieldId, value: FieldValue) => void;
}

const YES_NO = [
  { value: "yes", label: "a. Yes" },
  { value: "no",  label: "b. No"  },
];

const YES_NO_DK = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No"  },
  { value: "idk", label: "I don't know" },
];

const STAFF_ROLE = [
  { value: "owner",        label: "Owner" },
  { value: "staff_person", label: "Staff Person" },
  { value: "other",        label: "Other" },
];

const SITE_AGE = [
  { value: "less_one_month",       label: "a. Less than one month" },
  { value: "one_to_six_months",    label: "b. Between one and six months" },
  { value: "more_than_six_months", label: "c. More than six months" },
];

const DELIVERY_METHOD = [
  { value: "truck", label: "Truck" },
  { value: "pipe",  label: "Pipe"  },
  { value: "other", label: "Other" },
  { value: "idk",   label: "I don't know" },
];

const MONTH_OPTIONS = [
  { value: "january",   label: "January"   },
  { value: "february",  label: "February"  },
  { value: "march",     label: "March"     },
  { value: "april",     label: "April"     },
  { value: "may",       label: "May"       },
  { value: "june",      label: "June"      },
  { value: "july",      label: "July"      },
  { value: "august",    label: "August"    },
  { value: "september", label: "September" },
  { value: "october",   label: "October"   },
  { value: "november",  label: "November"  },
  { value: "december",  label: "December"  },
];

const TREATMENT_OPTIONS = [
  { value: "boil",             label: "a. Boil" },
  { value: "bleach_chlorine",  label: "b. Add bleach or chlorine" },
  { value: "cloth",            label: "c. Strain through a cloth" },
  { value: "water_filter",     label: "d. Use water filter" },
  { value: "solar",            label: "e. Solar disinfection" },
  { value: "stand_and_settle", label: "f. Let it stand and settle" },
  { value: "treatment_table",  label: "g. Water treatment tablet" },
  { value: "other",            label: "h. Other" },
  { value: "idk",              label: "i. I don't know" },
];

function SubHeader({ label }: { label: string }) {
  return (
    <div className="sm:col-span-2 -mx-6 border-t border-gray-100 px-6 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
  );
}

export default function StaffInterview({ values, flags, onChange }: Props) {
  return (
    <SectionCard title="Staff Interview">

      {/* consent */}
      {isFieldVisible("consent", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="consent"
            label="We would like to interview you. Do you agree?"
            options={YES_NO}
            value={(values.consent as string) ?? ""}
            onChange={(v) => onChange("consent", v)}
            required
          />
        </div>
      )}

      {/* ── Staff Background ──────────────────────────────── */}
      {isFieldVisible("staff_role", values, flags) && (
        <SubHeader label="Staff Background" />
      )}

      {isFieldVisible("staff_role", values, flags) && (
        <SelectOne
          id="staff_role"
          label="What is your role?"
          options={STAFF_ROLE}
          value={(values.staff_role as string) ?? ""}
          onChange={(v) => onChange("staff_role", v)}
        />
      )}

      {isFieldVisible("years_at_site", values, flags) && (
        <IntegerField
          id="years_at_site"
          label="How many years have you worked here?"
          value={(values.years_at_site as number) ?? null}
          onChange={(v) => onChange("years_at_site", v)}
          min={0}
        />
      )}

      {isFieldVisible("months_at_site", values, flags) && (
        <IntegerField
          id="months_at_site"
          label="How many months have you worked here? (0–11)"
          value={(values.months_at_site as number) ?? null}
          onChange={(v) => onChange("months_at_site", v)}
          min={0}
        />
      )}

      {isFieldVisible("other_staff_count", values, flags) && (
        <IntegerField
          id="other_staff_count"
          label="How many other people work here?"
          value={(values.other_staff_count as number) ?? null}
          onChange={(v) => onChange("other_staff_count", v)}
          min={0}
        />
      )}

      {/* ── Site Age ──────────────────────────────────────── */}
      {isFieldVisible("site_age", values, flags) && (
        <SubHeader label="Site Age" />
      )}

      {isFieldVisible("site_age", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="site_age"
            label="About how long has this location been here to provide water?"
            options={SITE_AGE}
            value={(values.site_age as string) ?? ""}
            onChange={(v) => onChange("site_age", v)}
          />
        </div>
      )}

      {/* ── Seasonality ───────────────────────────────────── */}
      {isFieldVisible("has_dry_season", values, flags) && (
        <SubHeader label="Seasonality" />
      )}

      {isFieldVisible("has_dry_season", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="has_dry_season"
            label="Are there times of the year when this location is not operating normally (due to drought or other seasonal conditions)?"
            options={YES_NO}
            value={(values.has_dry_season as string) ?? ""}
            onChange={(v) => onChange("has_dry_season", v)}
            required
          />
        </div>
      )}

      {isFieldVisible("dry_months", values, flags) && (
        <div className="sm:col-span-2">
          <SelectMultiple
            id="dry_months"
            label="When is this site not operating usually?"
            options={MONTH_OPTIONS}
            value={(values.dry_months as string[]) ?? []}
            onChange={(v) => onChange("dry_months", v)}
          />
        </div>
      )}

      {/* ── Origin / Delivery ─────────────────────────────── */}
      {isFieldVisible("water_delivery_method", values, flags) && (
        <SubHeader label="Origin" />
      )}

      {isFieldVisible("water_delivery_method", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="water_delivery_method"
            label="How is this water delivered to this location?"
            options={DELIVERY_METHOD}
            value={(values.water_delivery_method as string) ?? ""}
            onChange={(v) => onChange("water_delivery_method", v)}
          />
        </div>
      )}

      {isFieldVisible("water_delivery_other", values, flags) && (
        <div className="sm:col-span-2">
          <TextField
            id="water_delivery_other"
            label="State the other delivery method"
            value={(values.water_delivery_other as string) ?? ""}
            onChange={(v) => onChange("water_delivery_other", v)}
          />
        </div>
      )}

      {isFieldVisible("knows_water_origin", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="knows_water_origin"
            label="Do you know the origin of the water?"
            options={YES_NO}
            value={(values.knows_water_origin as string) ?? ""}
            onChange={(v) => onChange("knows_water_origin", v)}
          />
        </div>
      )}

      {isFieldVisible("water_origin", values, flags) && (
        <div className="sm:col-span-2">
          <TextField
            id="water_origin"
            label="Can you tell me what the origin is?"
            value={(values.water_origin as string) ?? ""}
            onChange={(v) => onChange("water_origin", v)}
          />
        </div>
      )}

      {isFieldVisible("water_is_treated", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="water_is_treated"
            label="Do you know if the water is treated to make it safer for drinking at the source?"
            options={YES_NO_DK}
            value={(values.water_is_treated as string) ?? ""}
            onChange={(v) => onChange("water_is_treated", v)}
          />
        </div>
      )}

      {isFieldVisible("treatment_methods", values, flags) && (
        <div className="sm:col-span-2">
          <SelectMultiple
            id="treatment_methods"
            label="How is the water treated at the source?"
            options={TREATMENT_OPTIONS}
            value={(values.treatment_methods as string[]) ?? []}
            onChange={(v) => onChange("treatment_methods", v)}
          />
        </div>
      )}

      {isFieldVisible("water_delivery_frequency", values, flags) && (
        <div className="sm:col-span-2">
          <TextField
            id="water_delivery_frequency"
            label="How often is water brought to this location?"
            value={(values.water_delivery_frequency as string) ?? ""}
            onChange={(v) => onChange("water_delivery_frequency", v)}
          />
        </div>
      )}

    </SectionCard>
  );
}
