import { StatCard } from "@/components/dashboard/StatCard";
import { performanceMetrics } from "@/lib/demo-data";

export function PerformanceOverview() {
  return (
    <section
      aria-label="Aperçu des performances"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {performanceMetrics.map((metric) => (
        <StatCard key={metric.id} {...metric} />
      ))}
    </section>
  );
}
