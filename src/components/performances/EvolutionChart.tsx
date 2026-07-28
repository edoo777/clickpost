"use client";

import { useState } from "react";
import { sumByDate, type NumericMetricKey } from "@/lib/analytics-report";
import type { DailyMetricPoint } from "@/types/analytics";

const METRIC_OPTIONS: { key: NumericMetricKey; label: string }[] = [
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Portée" },
  { key: "interactions", label: "Interactions" },
  { key: "clicks", label: "Clics" },
  { key: "newFollowers", label: "Nouveaux abonnés" },
];

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 8, left: 8 };
const numberFormatter = new Intl.NumberFormat("fr-FR");
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

interface EvolutionChartProps {
  currentPoints: DailyMetricPoint[];
  previousPoints: DailyMetricPoint[] | null;
}

export function EvolutionChart({ currentPoints, previousPoints }: EvolutionChartProps) {
  const [metric, setMetric] = useState<NumericMetricKey>("impressions");

  const currentSeries = sumByDate(currentPoints, metric);
  const previousSeries = previousPoints ? sumByDate(previousPoints, metric) : null;

  const maxValue = Math.max(1, ...currentSeries.map((p) => p.value), ...(previousSeries?.map((p) => p.value) ?? []));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const baselineY = PADDING.top + innerHeight;

  function seriesToPoints(series: { date: string; value: number }[]) {
    return series.map((point, index) => ({
      ...point,
      x: PADDING.left + (series.length === 1 ? innerWidth / 2 : (index / (series.length - 1)) * innerWidth),
      y: PADDING.top + innerHeight - (point.value / maxValue) * innerHeight,
    }));
  }

  function toPath(points: { x: number; y: number }[]) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  }

  const currentPlotted = seriesToPoints(currentSeries);
  const previousPlotted = previousSeries ? seriesToPoints(previousSeries) : [];
  const lastPoint = currentPlotted[currentPlotted.length - 1];

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Évolution des performances</h2>
        <select
          value={metric}
          onChange={(event) => setMetric(event.target.value as NumericMetricKey)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/[.08] dark:bg-zinc-950 dark:text-zinc-300"
        >
          {METRIC_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {previousSeries && (
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" /> Période actuelle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-zinc-400 dark:bg-zinc-600" /> Période précédente
          </span>
        </div>
      )}

      {currentPlotted.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Pas assez de données sur cette période.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="Graphique d'évolution des performances"
          >
            <line
              x1={PADDING.left}
              y1={baselineY}
              x2={PADDING.left + innerWidth}
              y2={baselineY}
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />

            {previousPlotted.length > 0 && (
              <path
                d={toPath(previousPlotted)}
                fill="none"
                stroke="currentColor"
                className="text-zinc-400 dark:text-zinc-600"
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            <path
              d={`${toPath(currentPlotted)} L${lastPoint.x.toFixed(1)},${baselineY} L${currentPlotted[0].x.toFixed(1)},${baselineY} Z`}
              fill="currentColor"
              className="text-blue-500/10"
            />
            <path
              d={toPath(currentPlotted)}
              fill="none"
              stroke="currentColor"
              className="text-blue-600 dark:text-blue-400"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {currentPlotted.map((point) => (
              <circle key={point.date} cx={point.x} cy={point.y} r={6} className="fill-transparent">
                <title>{`${dateFormatter.format(new Date(`${point.date}T00:00:00`))} : ${numberFormatter.format(point.value)}`}</title>
              </circle>
            ))}

            <circle cx={lastPoint.x} cy={lastPoint.y} r={4} className="fill-blue-600 dark:fill-blue-400" stroke="white" strokeWidth={2} />
            <text
              x={lastPoint.x}
              y={lastPoint.y - 10}
              textAnchor="end"
              className="fill-zinc-700 text-[10px] font-medium dark:fill-zinc-300"
            >
              {numberFormatter.format(lastPoint.value)}
            </text>
          </svg>

          <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-600">
            <span>{dateFormatter.format(new Date(`${currentSeries[0].date}T00:00:00`))}</span>
            <span>{dateFormatter.format(new Date(`${currentSeries[currentSeries.length - 1].date}T00:00:00`))}</span>
          </div>
        </>
      )}
    </section>
  );
}
