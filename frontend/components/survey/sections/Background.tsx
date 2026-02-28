import { ComputedFlags, FieldId, FieldValue, FormValues } from "@/types/survey";
import { IntegerField, SelectOne, DateField, GeopointField, ImageField } from "../fields";
import SectionCard from "./SectionCard";

interface Props {
  values: FormValues;
  flags: ComputedFlags;
  onChange: (fieldId: FieldId, value: FieldValue) => void;
  fieldErrors?: {
    site_code?: string;
  };
}

const SITE_OPTIONS = [
  { value: "kisumu", label: "a. Kisumu" },
  { value: "karemo", label: "b. Karemo" },
];

const YES_NO = [
  { value: "yes", label: "a. Yes" },
  { value: "no",  label: "b. No"  },
];

export default function Background({ values, onChange, fieldErrors }: Props) {
  return (
    <SectionCard title="Background">

      <IntegerField
        id="site_code"
        label="Enter site code"
        value={(values.site_code as number) ?? null}
        onChange={(v) => onChange("site_code", v)}
        min={100000}
        max={999999}
        error={fieldErrors?.site_code}
        required
      />

      <SelectOne
        id="site_name"
        label="Choose your current site"
        options={SITE_OPTIONS}
        value={(values.site_name as string) ?? ""}
        onChange={(v) => onChange("site_name", v)}
        required
      />

      <GeopointField
        id="gps_location"
        label="Record GPS location"
        value={(values.gps_location as string) ?? ""}
        onChange={(v) => onChange("gps_location", v)}
        required
      />

      <DateField
        id="survey_date"
        label="Date of survey"
        value={(values.survey_date as string) ?? ""}
        onChange={(v) => onChange("survey_date", v)}
        required
      />

      <ImageField
        id="site_photo"
        label="Take image of site"
        value={(values.site_photo as string) ?? ""}
        onChange={(v) => onChange("site_photo", v)}
      />

      <SelectOne
        id="is_staffed"
        label="Is this site currently staffed?"
        options={YES_NO}
        value={(values.is_staffed as string) ?? ""}
        onChange={(v) => onChange("is_staffed", v)}
        required
      />

    </SectionCard>
  );
}
