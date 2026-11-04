import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  trend: string;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
      <div className="metric-trend">
        <ArrowUpRight size={14} />
        <span>{trend}</span>
      </div>
    </article>
  );
}
