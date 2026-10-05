import type { ReactNode } from "react";

type Segment = { value: number; color: string };

// A ring/donut chart built from plain SVG circles (stroke-dasharray trick) -
// no charting library needed for four static segments. Purely presentational,
// so it stays a Server Component; the center label is passed in as children.
export default function DonutChart({
  segments,
  size = 176,
  strokeWidth = 12,
  children
}: {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let offsetAccum = 0;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} strokeWidth={strokeWidth} className="fill-none stroke-gray-100" />
        {total > 0 &&
          segments.map((segment, i) => {
            const fraction = segment.value / total;
            const length = fraction * circumference;
            const dashoffset = -offsetAccum;
            offsetAccum += length;
            if (length <= 0) return null;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                style={{ stroke: segment.color }}
                className="fill-none transition-all duration-500"
              />
            );
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
