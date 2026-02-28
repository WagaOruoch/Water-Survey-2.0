"use client";

import { useRef } from "react";
import FieldWrapper from "./FieldWrapper";

interface ImageFieldProps {
  id: string;
  label: string;
  value: string;       // stores base64 image data once captured
  onChange: (value: string) => void;
  required?: boolean;
}

export default function ImageField({
  id,
  label,
  value,
  onChange,
  required,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onChange(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <FieldWrapper id={id} label={label} required={required}>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-input`}
          className="inline-flex w-fit cursor-pointer items-center gap-2
                     rounded-md border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium
                     text-blue-50 transition hover:bg-white/20"
        >
          {value ? "Change Photo" : "Take / Upload Photo"}
          <input
            id={`${id}-input`}
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            className="sr-only"
          />
        </label>
        {value && (
          <p className="rounded-md border border-cyan-200/30 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-100">
            Photo captured
          </p>
        )}
      </div>
    </FieldWrapper>
  );
}
