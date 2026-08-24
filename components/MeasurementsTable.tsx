"use client";

import { useState } from "react";
import { MeasurementRow } from "@/components/MeasurementRow";
import type { Measurement } from "@/lib/types";

type SortOrder = "asc" | "desc";

export function MeasurementsTable({
  measurements,
}: {
  measurements: Measurement[];
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  if (measurements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Nessuna misurazione registrata.
      </p>
    );
  }

  const sorted = [...measurements].sort((a, b) => {
    const diff =
      new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime();
    return sortOrder === "asc" ? diff : -diff;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">
              <button
                type="button"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex items-center gap-1 uppercase hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Data
                <span aria-hidden="true">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              </button>
            </th>
            <th className="px-4 py-3 font-medium">Ora</th>
            <th className="px-4 py-3 font-medium">Massima</th>
            <th className="px-4 py-3 font-medium">Minima</th>
            <th className="px-4 py-3 font-medium">Battiti</th>
            <th className="px-4 py-3 font-medium">Note</th>
            <th className="px-4 py-3 font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {sorted.map((measurement) => (
            <MeasurementRow key={measurement.id} measurement={measurement} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
