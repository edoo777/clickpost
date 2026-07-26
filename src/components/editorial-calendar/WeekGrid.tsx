import { DayCard } from "@/components/editorial-calendar/DayCard";
import { WEEKDAYS } from "@/lib/editorial-constants";
import type { EditorialDayPlan, EditorialWeekPlan } from "@/types/editorial-calendar";
import type { Theme } from "@/types/theme";

interface WeekGridProps {
  plan: EditorialWeekPlan;
  themes: Theme[];
  editable: boolean;
  onChangeDay: (day: EditorialDayPlan) => void;
}

export function WeekGrid({ plan, themes, editable, onChangeDay }: WeekGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {WEEKDAYS.map((day) => {
        const dayPlan = plan.days.find((d) => d.day === day);
        if (!dayPlan) return null;
        return (
          <DayCard key={day} plan={dayPlan} themes={themes} editable={editable} onChange={onChangeDay} />
        );
      })}
    </div>
  );
}
