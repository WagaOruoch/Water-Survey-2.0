"use client";

import { useState } from "react";
import FieldWrapper from "./FieldWrapper";

interface GeopointFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function GeopointField({
  id,
  label,
  value,
  onChange,
  required,
}: GeopointFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function capture() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
        setLoading(false);
      },
      () => {
        setError("Could not get location. Please allow location access.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <FieldWrapper id={id} label={label} required={required}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={capture}
            disabled={loading}
            className="rounded-md border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium
                       text-blue-50 transition hover:bg-white/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Getting location…" : "Get Current Location"}
          </button>
        </div>
        {value && (
          <p className="rounded-md border border-emerald-200/30 bg-emerald-500/15 px-3 py-1.5 font-mono text-xs text-emerald-100">
            {value}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-200">{error}</p>
        )}
      </div>
    </FieldWrapper>
  );
}
