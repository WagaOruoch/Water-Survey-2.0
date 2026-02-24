interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FieldWrapper({
  id,
  label,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
