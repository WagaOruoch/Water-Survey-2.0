import FieldWrapper from "./FieldWrapper";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function TextField({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
}: TextFieldProps) {
  return (
    <FieldWrapper id={id} label={label} required={required}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-white/20 bg-white/15 px-3 py-2 text-sm
                   text-blue-50 placeholder:text-blue-200/70 shadow-sm outline-none transition
                   focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
      />
    </FieldWrapper>
  );
}
