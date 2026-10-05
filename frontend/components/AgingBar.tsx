import { AGING_BUCKETS, type AgingKey } from "@/lib/aging";
import { formatPct, formatValue } from "@/lib/data";

// One labeled, colored progress bar for a single aging bucket. Used on the
// Dashboard overview and (in compact form) on the Metrics page.
export default function AgingBar({
  bucketKey,
  value,
  percentOfTotal
}: {
  bucketKey: AgingKey;
  value: number;
  percentOfTotal: number;
}) {
  const bucket = AGING_BUCKETS.find((b) => b.key === bucketKey)!;
  const width = Math.min(100, Math.max(percentOfTotal, value > 0 ? 1 : 0));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{bucket.label}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bucket.chipBg} ${bucket.chipText}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${bucket.dot}`} />
            {bucket.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{formatPct(percentOfTotal)}</span>
          <span className="text-sm font-semibold tabular-nums text-gray-900">{formatValue(value)}</span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${bucket.bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
