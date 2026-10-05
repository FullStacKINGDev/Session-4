import Icon from "@/components/Icon";

type KpiCardProps = {
  label: string;
  value: string;
  icon: string;
  footnote: string;
  footnoteIcon: string;
  accent?: boolean;
};

// A reusable KPI card - it doesn't know or care where its numbers came
// from, the parent page passes everything in as props.
export default function KpiCard({ label, value, icon, footnote, footnoteIcon, accent }: KpiCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            accent ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon name={icon} className="text-[20px]" />
        </div>
      </div>
      <div>
        <span className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">{value}</span>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Icon name={footnoteIcon} className="text-[16px]" />
          <span>{footnote}</span>
        </div>
      </div>
    </div>
  );
}
