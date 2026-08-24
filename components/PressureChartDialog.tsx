"use client";

import { useRef } from "react";
import type { Measurement } from "@/lib/types";

const REFERENCE_SYSTOLIC = 120;
const REFERENCE_DIASTOLIC = 80;

const MIN_VIEW_WIDTH = 720;
const VIEW_HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 40 };
const MIN_CHART_WIDTH = MIN_VIEW_WIDTH - MARGIN.left - MARGIN.right;
const CHART_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;
// Spaziatura minima fra due punti consecutivi: sotto questa soglia le
// etichette data/ora si sovrappongono, quindi il grafico diventa più
// largo del contenitore e scrolla in orizzontale (vedi overflow-x-auto).
const PIXELS_PER_POINT = 48;

const axisDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Rome",
});

const axisTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

function niceTicks(min: number, max: number, step: number): number[] {
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end; value += step) {
    ticks.push(value);
  }
  return ticks;
}

function PressureChart({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
  );

  const times = sorted.map((m) => new Date(m.measuredAt).getTime());

  const values = sorted.flatMap((m) => [m.systolic, m.diastolic]);
  values.push(REFERENCE_SYSTOLIC, REFERENCE_DIASTOLIC);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.1 || 5;
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;

  // Un punto = uno slot di larghezza fissa (PIXELS_PER_POINT). Se lo spazio
  // naturale così ottenuto è inferiore alla larghezza minima del grafico, i
  // punti vengono invece distribuiti su tutta quella larghezza (nessuno
  // scroll necessario per pochi dati).
  const naturalWidth = (sorted.length - 1) * PIXELS_PER_POINT;
  const chartWidth = Math.max(MIN_CHART_WIDTH, naturalWidth);
  const step = sorted.length > 1 ? chartWidth / (sorted.length - 1) : 0;
  const totalWidth = chartWidth + MARGIN.left + MARGIN.right;

  function xScale(index: number): number {
    return MARGIN.left + index * step;
  }

  function yScale(value: number): number {
    return (
      MARGIN.top + CHART_HEIGHT - ((value - yMin) / (yMax - yMin)) * CHART_HEIGHT
    );
  }

  const systolicPoints = sorted
    .map((m, i) => `${xScale(i)},${yScale(m.systolic)}`)
    .join(" ");
  const diastolicPoints = sorted
    .map((m, i) => `${xScale(i)},${yScale(m.diastolic)}`)
    .join(" ");

  const yTicks = niceTicks(yMin, yMax, 20);

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalWidth}
        height={VIEW_HEIGHT}
        viewBox={`0 0 ${totalWidth} ${VIEW_HEIGHT}`}
        role="img"
        aria-label="Andamento della pressione nel tempo"
      >
        {yTicks.map((tick) => {
          const y = yScale(tick);
          const isReference =
            tick === REFERENCE_SYSTOLIC || tick === REFERENCE_DIASTOLIC;
          return (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + chartWidth}
                y1={y}
                y2={y}
                stroke={isReference ? "#a1a1aa" : "#e4e4e7"}
                strokeWidth={isReference ? 1.5 : 1}
                strokeDasharray={isReference ? "4 3" : undefined}
              />
              <text
                x={MARGIN.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill={isReference ? "#71717a" : "#a1a1aa"}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {sorted.map((m, index) => {
          const x = xScale(index);
          const date = new Date(times[index]);
          return (
            <text
              key={m.id}
              x={x}
              y={VIEW_HEIGHT - 20}
              textAnchor="middle"
              fontSize={10}
              fill="#a1a1aa"
            >
              <tspan x={x}>{axisDateFormatter.format(date)}</tspan>
              <tspan x={x} dy={12} fontSize={9} fill="#c4c4c8">
                {axisTimeFormatter.format(date)}
              </tspan>
            </text>
          );
        })}

        <polyline
          points={systolicPoints}
          fill="none"
          stroke="#dc2626"
          strokeWidth={2}
        />
        <polyline
          points={diastolicPoints}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
        />

        {sorted.map((m, index) => (
          <g key={m.id}>
            <circle cx={xScale(index)} cy={yScale(m.systolic)} r={2.5} fill="#dc2626" />
            <circle cx={xScale(index)} cy={yScale(m.diastolic)} r={2.5} fill="#2563eb" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4"
        style={
          dashed
            ? { borderTop: `1.5px dashed ${color}` }
            : { backgroundColor: color }
        }
      />
      {label}
    </div>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function PressureChartDialog({
  measurements,
}: {
  measurements: Measurement[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (measurements.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Andamento
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className="w-full max-w-2xl rounded-lg border border-black/10 bg-white p-6 backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Andamento della pressione
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Chiudi"
            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <XIcon />
          </button>
        </div>

        <div className="mt-4">
          <PressureChart measurements={measurements} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Legend color="#dc2626" label="Massima" />
          <Legend color="#2563eb" label="Minima" />
          <Legend color="#a1a1aa" label="Riferimento normale (120/80)" dashed />
        </div>
      </dialog>
    </>
  );
}
