import type { Measurement } from "@/lib/types";
import { zonedDateTimeToUtc } from "@/lib/date";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\r") {
      i += 1;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  return rows;
}

export function toCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type ParsedDate = { year: number; month: number; day: number };
type ParsedTime = { hour: number; minute: number };

function parseDate(raw: string): ParsedDate | null {
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return null;

  const [a, b, c] = parts;
  let year: string;
  let month: string;
  let day: string;

  if (a.length === 4) {
    [year, month, day] = [a, b, c];
  } else if (c.length === 4) {
    [day, month, year] = [a, b, c];
  } else {
    return null;
  }

  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);

  if (
    !Number.isInteger(yearNum) ||
    !Number.isInteger(monthNum) ||
    !Number.isInteger(dayNum) ||
    monthNum < 1 ||
    monthNum > 12 ||
    dayNum < 1 ||
    dayNum > 31
  ) {
    return null;
  }

  return { year: yearNum, month: monthNum, day: dayNum };
}

function parseTime(raw: string): ParsedTime | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

export type ParsedMeasurementRow = {
  measuredAt: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string | null;
};

export type ImportError = { line: number; reason: string };

export function parseMeasurementsCsv(text: string): {
  rows: ParsedMeasurementRow[];
  errors: ImportError[];
} {
  const table = parseCsv(text);
  const rows: ParsedMeasurementRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const line = i + 1;
    const fields = table[i];

    if (fields.every((field) => field.trim() === "")) {
      continue;
    }

    const [rawDate, rawTime, rawRange, rawPulse, rawNotes] = fields;

    const date = parseDate(rawDate ?? "");
    if (!date) {
      errors.push({ line, reason: "formato data non riconosciuto" });
      continue;
    }

    const time = parseTime(rawTime ?? "");
    if (!time) {
      errors.push({ line, reason: "ora non valida" });
      continue;
    }

    const rangeParts = (rawRange ?? "").split("/");
    const systolic = Number(rangeParts[0]);
    const diastolic = Number(rangeParts[1]);
    if (
      rangeParts.length !== 2 ||
      !Number.isFinite(systolic) ||
      !Number.isFinite(diastolic)
    ) {
      errors.push({ line, reason: "formato massima/minima non valido" });
      continue;
    }

    const pulse = Number(rawPulse);
    if (!Number.isFinite(pulse)) {
      errors.push({ line, reason: "battiti non validi" });
      continue;
    }

    const measuredAt = zonedDateTimeToUtc(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    const notes = (rawNotes ?? "").trim();

    rows.push({
      measuredAt: measuredAt.toISOString(),
      systolic,
      diastolic,
      pulse,
      notes: notes || null,
    });
  }

  return { rows, errors };
}

export function measurementsToCsv(measurements: Measurement[]): string {
  const header = ["Data", "Ora", "max/min", "Pulsazioni", "Note"];
  const lines = [header.map(toCsvField).join(",")];

  for (const measurement of measurements) {
    const date = new Date(measurement.measuredAt);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const fields = [
      `${year}/${month}/${day}`,
      `${hours}:${minutes}`,
      `${measurement.systolic}/${measurement.diastolic}`,
      String(measurement.pulse),
      measurement.notes ?? "",
    ];

    lines.push(fields.map(toCsvField).join(","));
  }

  return lines.join("\r\n");
}
