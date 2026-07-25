import type { Weekday } from "@/types/editorial-calendar";

export interface Theme {
  id: string;
  brandId: string;
  label: string;
  objective: string;
  weekdays: Weekday[];
  order: number;
  active: boolean;
  createdAt: string;
}
