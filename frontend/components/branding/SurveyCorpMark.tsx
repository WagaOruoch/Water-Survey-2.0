interface SurveyCorpMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

type SizeSpec = {
  container: number;
  shape1: number;
  shape2: number;
  shape3: number;
  shape3Top: number;
  shape3Right: number;
  radius1: number;
  radius3: number;
};

const SIZE_SPECS: Record<NonNullable<SurveyCorpMarkProps["size"]>, SizeSpec> = {
  sm: {
    container: 32,
    shape1: 18,
    shape2: 13,
    shape3: 10,
    shape3Top: 5,
    shape3Right: 1,
    radius1: 4,
    radius3: 2,
  },
  md: {
    container: 48,
    shape1: 28,
    shape2: 20,
    shape3: 16,
    shape3Top: 8,
    shape3Right: 2,
    radius1: 6,
    radius3: 3,
  },
  lg: {
    container: 64,
    shape1: 36,
    shape2: 26,
    shape3: 20,
    shape3Top: 12,
    shape3Right: 2,
    radius1: 7,
    radius3: 3,
  },
};

export default function SurveyCorpMark({ size = "sm", className = "" }: SurveyCorpMarkProps) {
  const spec = SIZE_SPECS[size];

  return (
    <div
      className={`relative ${className}`.trim()}
      style={{ width: spec.container, height: spec.container }}
      aria-hidden="true"
    >
      <span
        className="absolute left-0 top-0 rotate-45"
        style={{
          width: spec.shape1,
          height: spec.shape1,
          borderRadius: spec.radius1,
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        }}
      />
      <span
        className="absolute bottom-0 right-0"
        style={{
          width: spec.shape2,
          height: spec.shape2,
          borderRadius: 9999,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        }}
      />
      <span
        className="absolute"
        style={{
          width: spec.shape3,
          height: spec.shape3,
          top: spec.shape3Top,
          right: spec.shape3Right,
          borderRadius: spec.radius3,
          background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        }}
      />
    </div>
  );
}
