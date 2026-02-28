import FieldWrapper from "./FieldWrapper";

interface Option {
  value: string;
  label: string;
}

interface SelectOneProps {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function SelectOne({
  id,
  label,
  options,
  value,
  onChange,
  required,
}: SelectOneProps) {
  return (
    <FieldWrapper id={id} label={label} required={required}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="app-dark-select rounded-md border border-white/20 bg-white/15 px-3 py-2 text-sm
                   text-blue-50 shadow-sm outline-none transition
                   focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
      >
        <option value="" className="bg-slate-900 text-blue-50">— Select —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-blue-50">
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
