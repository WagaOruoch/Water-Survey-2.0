import { ComputedFlags, FieldId, FieldValue, FormValues } from "@/types/survey";
import { isFieldVisible } from "@/lib/formEngine";
import { SelectOne, SelectMultiple, IntegerField } from "../fields";
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

const WATER_CATEGORY = [
  { value: "piped",         label: "Piped water" },
  { value: "well",          label: "Dug Well" },
  { value: "spring",        label: "Water from spring" },
  { value: "packaged",      label: "Packaged Water" },
  { value: "other_sources", label: "Other Sources" },
];

// JMP ladder codes — piped
const PIPED_OPTIONS = [
  { value: "11", label: "11 — Piped into dwelling" },
  { value: "12", label: "12 — Piped into compound, yard or plot" },
  { value: "13", label: "13 — Piped to neighbour" },
  { value: "14", label: "14 — Public tap / standpipe" },
];

// JMP ladder codes — well
const WELL_OPTIONS = [
  { value: "31", label: "31 — Protected well" },
  { value: "32", label: "32 — Unprotected well" },
];

// JMP ladder codes — spring
const SPRING_OPTIONS = [
  { value: "41", label: "41 — Protected spring" },
  { value: "42", label: "42 — Unprotected spring" },
];

// JMP ladder codes — packaged
const PACKAGED_OPTIONS = [
  { value: "81", label: "81 — Bottled water" },
  { value: "82", label: "82 — Sachet water" },
];

// Other sources
const OTHER_SOURCE_OPTIONS = [
  { value: "bh_21",        label: "Borehole or tube well" },
  { value: "rain_water_51",label: "Rain water collection" },
  { value: "tanker_61",    label: "Tanker-truck" },
  { value: "cart_62",      label: "Cart with small tank / drum" },
  { value: "kiosk_72",     label: "Water kiosk" },
  { value: "surface_91",   label: "Surface water (river, stream, lake, dam, pond, canal, irrigation channel)" },
];

// Surface water sub-type
const SURFACE_WATER_OPTIONS = [
  { value: "river",  label: "a. River (larger than 10 metres across)" },
  { value: "stream", label: "b. Stream (between 3 and 10 metres across)" },
  { value: "ditch",  label: "c. Ditch (less than 3 metres across)" },
  { value: "lake",   label: "d. Lake" },
  { value: "pond",   label: "e. Pond" },
];

// Accessing water
const ACCESSING_WATER_OPTIONS = [
  { value: "walking",       label: "a. Walking into the river" },
  { value: "stay_on_land",  label: "b. Staying on land or rocks and reaching down" },
  { value: "nill",          label: "c. No people present" },
];

// Shore distance
const SHORE_DISTANCE_OPTIONS = [
  { value: "less_than_1_mtr",   label: "a. Within 1 metre" },
  { value: "one_to_two_mtr",    label: "b. 1–2 metres" },
  { value: "more_than_two_mtr", label: "c. More than 2 metres" },
  { value: "nill",              label: "d. No people present" },
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

export default function SiteObservation({ values, flags, onChange }: Props) {
  return (
    <SectionCard title="Site Observation">

      {/* water_source_type — site type */}
      {isFieldVisible("water_source_type", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="water_source_type"
            label="Choose which best reflects the type of site"
            options={WATER_CATEGORY}
            value={(values.water_source_type as string) ?? ""}
            onChange={(v) => onChange("water_source_type", v)}
            required
          />
        </div>
      )}

      {/* ── Piped ─────────────────────────────────────────── */}
      {isFieldVisible("piped_subtype", values, flags) && (
        <SubHeader label="Piped Water" />
      )}
      {isFieldVisible("piped_subtype", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="piped_subtype"
            label="Piped Water"
            options={PIPED_OPTIONS}
            value={(values.piped_subtype as string) ?? ""}
            onChange={(v) => onChange("piped_subtype", v)}
          />
        </div>
      )}

      {/* ── Well ──────────────────────────────────────────── */}
      {isFieldVisible("well_subtype", values, flags) && (
        <SubHeader label="Dug Well" />
      )}
      {isFieldVisible("well_subtype", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="well_subtype"
            label="Dug Well"
            options={WELL_OPTIONS}
            value={(values.well_subtype as string) ?? ""}
            onChange={(v) => onChange("well_subtype", v)}
          />
        </div>
      )}

      {/* ── Spring ────────────────────────────────────────── */}
      {isFieldVisible("spring_subtype", values, flags) && (
        <SubHeader label="Water from Spring" />
      )}
      {isFieldVisible("spring_subtype", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="spring_subtype"
            label="Water from Spring"
            options={SPRING_OPTIONS}
            value={(values.spring_subtype as string) ?? ""}
            onChange={(v) => onChange("spring_subtype", v)}
          />
        </div>
      )}

      {/* ── Packaged ──────────────────────────────────────── */}
      {isFieldVisible("packaged_subtype", values, flags) && (
        <SubHeader label="Packaged Water" />
      )}
      {isFieldVisible("packaged_subtype", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="packaged_subtype"
            label="Packaged Water"
            options={PACKAGED_OPTIONS}
            value={(values.packaged_subtype as string) ?? ""}
            onChange={(v) => onChange("packaged_subtype", v)}
          />
        </div>
      )}

      {/* ── Other sources ─────────────────────────────────── */}
      {isFieldVisible("other_source_subtype", values, flags) && (
        <SubHeader label="Other Sources" />
      )}
      {isFieldVisible("other_source_subtype", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="other_source_subtype"
            label="Others"
            options={OTHER_SOURCE_OPTIONS}
            value={(values.other_source_subtype as string) ?? ""}
            onChange={(v) => onChange("other_source_subtype", v)}
          />
        </div>
      )}

      {isFieldVisible("surface_water_type", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="surface_water_type"
            label="What type of water surface is it?"
            options={SURFACE_WATER_OPTIONS}
            value={(values.surface_water_type as string) ?? ""}
            onChange={(v) => onChange("surface_water_type", v)}
          />
        </div>
      )}

      {/* ── Water access ──────────────────────────────────── */}
      {isFieldVisible("used_for_drinking", values, flags) && (
        <SubHeader label="Water Access" />
      )}
      {isFieldVisible("used_for_drinking", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="used_for_drinking"
            label="Is this site used for drinking water?"
            options={YES_NO}
            value={(values.used_for_drinking as string) ?? ""}
            onChange={(v) => onChange("used_for_drinking", v)}
          />
        </div>
      )}

      {isFieldVisible("water_access_method", values, flags) && (
        <div className="sm:col-span-2">
          <SelectOne
            id="water_access_method"
            label="How are people accessing the water?"
            options={ACCESSING_WATER_OPTIONS}
            value={(values.water_access_method as string) ?? ""}
            onChange={(v) => onChange("water_access_method", v)}
          />
        </div>
      )}

      {isFieldVisible("shore_distances", values, flags) && (
        <div className="sm:col-span-2">
          <SelectMultiple
            id="shore_distances"
            label="How far away from the shore are people accessing the water?"
            options={SHORE_DISTANCE_OPTIONS}
            value={(values.shore_distances as string[]) ?? []}
            onChange={(v) => onChange("shore_distances", v)}
          />
        </div>
      )}

      {/* ── People count ──────────────────────────────────── */}
      {isFieldVisible("people_count", values, flags) && (
        <SubHeader label="Site Activity" />
      )}
      {isFieldVisible("people_count", values, flags) && (
        <IntegerField
          id="people_count"
          label="Count the number of people who are getting water currently at this site"
          value={(values.people_count as number) ?? null}
          onChange={(v) => onChange("people_count", v)}
          min={0}
        />
      )}

    </SectionCard>
  );
}
