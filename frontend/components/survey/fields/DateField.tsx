import FieldWrapper from "./FieldWrapper";

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function DateField({
  id,
  label,
  value,
  onChange,
  required,
}: DateFieldProps) {
  return (
    <FieldWrapper id={id} label={label} required={required}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm
                   shadow-sm outline-none transition
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </FieldWrapper>
  );
}
