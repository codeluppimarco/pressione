"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { measurementsToCsv } from "@/lib/csv";
import type { Measurement } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Rome",
});

const timeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  measurements,
  userEmail,
}: {
  measurements: Measurement[];
  userEmail: string;
}) {
  function exportCsv() {
    const csv = measurementsToCsv(measurements);
    downloadBlob(csv, "misurazioni.csv", "text/csv;charset=utf-8;");
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Misurazioni pressione", 14, 15);
    doc.setFontSize(10);
    doc.text(userEmail, 14, 21);

    const body = measurements.map((measurement) => {
      const measuredAt = new Date(measurement.measuredAt);
      return [
        dateFormatter.format(measuredAt),
        timeFormatter.format(measuredAt),
        String(measurement.systolic),
        String(measurement.diastolic),
        String(measurement.pulse),
        measurement.notes ?? "",
      ];
    });

    autoTable(doc, {
      startY: 27,
      head: [["Data", "Ora", "Massima", "Minima", "Battiti", "Note"]],
      body,
      styles: { fontSize: 9 },
    });

    doc.save("misurazioni.pdf");
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Esporta CSV
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Esporta PDF
      </button>
    </div>
  );
}
