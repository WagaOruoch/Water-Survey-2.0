import FieldWrapper from "./FieldWrapper";

interface IntegerFieldProps {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  required?: boolean;
}

export default function IntegerField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  required,
}: IntegerFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <FieldWrapper id={id} label={label} required={required}>
      <input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={handleChange}
        min={min}
        max={max}
        step={1}
        className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm
                   shadow-sm outline-none transition
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </FieldWrapper>
  );
}
