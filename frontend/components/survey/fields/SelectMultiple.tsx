import FieldWrapper from "./FieldWrapper";

interface Option {
  value: string;
  label: string;
}

interface SelectMultipleProps {
  id: string;
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

export default function SelectMultiple({
  id,
  label,
  options,
  value,
  onChange,
}: SelectMultipleProps) {
  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  return (
    <FieldWrapper id={id} label={label}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-md border
                       border-gray-200 px-3 py-2 text-sm transition
                       hover:bg-blue-50 has-[:checked]:border-blue-500
                       has-[:checked]:bg-blue-50"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="accent-blue-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}
