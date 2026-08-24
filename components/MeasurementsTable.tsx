import type { Measurement } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

export function MeasurementsTable({
  measurements,
}: {
  measurements: Measurement[];
}) {
  if (measurements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Nessuna misurazione registrata.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Ora</th>
            <th className="px-4 py-3 font-medium">Massima</th>
            <th className="px-4 py-3 font-medium">Minima</th>
            <th className="px-4 py-3 font-medium">Battiti</th>
            <th className="px-4 py-3 font-medium">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {measurements.map((measurement) => {
            const measuredAt = new Date(measurement.measuredAt);
            return (
              <tr key={measurement.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {dateFormatter.format(measuredAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {timeFormatter.format(measuredAt)}
                </td>
                <td className="px-4 py-3">{measurement.systolic}</td>
                <td className="px-4 py-3">{measurement.diastolic}</td>
                <td className="px-4 py-3">{measurement.pulse}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {measurement.notes ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
