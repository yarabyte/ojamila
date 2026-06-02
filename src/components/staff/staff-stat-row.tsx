import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StaffStat = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "gold" | "warning" | "success";
};

export function StaffStatRow({ stats }: { stats: StaffStat[] }) {
  return (
    <div className="staff-stat-scroll">
      {stats.map(({ label, value, icon: Icon, tone = "default" }) => (
        <div
          key={label}
          className={cn(
            "staff-stat-card",
            tone === "gold" && "staff-stat-card-gold",
            tone === "warning" && "staff-stat-card-warning",
            tone === "success" && "staff-stat-card-success"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              tone === "gold" && "text-gold-deep",
              tone === "warning" && "text-warning",
              tone === "success" && "text-success",
              tone === "default" && "text-muted-foreground"
            )}
          />
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">
              {value.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
