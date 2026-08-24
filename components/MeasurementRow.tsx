"use client";

import { useActionState, useState } from "react";
import {
  updateMeasurement,
  deleteMeasurement,
  type MeasurementState,
} from "@/app/actions";
import type { Measurement } from "@/lib/types";

const initialState: MeasurementState = { error: null, successId: 0 };

// Fuso orario fissato esplicitamente: il rendering lato server (Vercel, UTC)
// e quello lato client (browser in Italia) devono produrre lo stesso testo,
// altrimenti si genera un mismatch di idratazione e un orario sbagliato.
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

function toDateValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeValue(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
      className="h-4 w-4"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function MeasurementRow({ measurement }: { measurement: Measurement }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMeasurement,
    initialState,
  );
  const [lastSuccessId, setLastSuccessId] = useState(state.successId);

  if (state.successId !== lastSuccessId) {
    setLastSuccessId(state.successId);
    setEditing(false);
  }

  if (editing) {
    const formId = `edit-measurement-${measurement.id}`;

    return (
      <tr className="bg-zinc-50 dark:bg-zinc-800/50">
        <td className="px-2 py-2">
          <input
            form={formId}
            type="date"
            name="date"
            defaultValue={toDateValue(measurement.measuredAt)}
            required
            className="input"
          />
        </td>
        <td className="px-2 py-2">
          <input
            form={formId}
            type="time"
            name="time"
            defaultValue={toTimeValue(measurement.measuredAt)}
            required
            className="input"
          />
        </td>
        <td className="px-2 py-2">
          <input
            form={formId}
            type="number"
            name="systolic"
            defaultValue={measurement.systolic}
            required
            min={0}
            max={400}
            className="input w-20"
          />
        </td>
        <td className="px-2 py-2">
          <input
            form={formId}
            type="number"
            name="diastolic"
            defaultValue={measurement.diastolic}
            required
            min={0}
            max={400}
            className="input w-20"
          />
        </td>
        <td className="px-2 py-2">
          <input
            form={formId}
            type="number"
            name="pulse"
            defaultValue={measurement.pulse}
            required
            min={0}
            max={400}
            className="input w-20"
          />
        </td>
        <td className="px-2 py-2">
          <input
            form={formId}
            type="text"
            name="notes"
            defaultValue={measurement.notes ?? ""}
            className="input"
          />
        </td>
        <td className="px-2 py-2">
          <form id={formId} action={formAction}>
            <input type="hidden" name="id" value={measurement.id} />
          </form>
          <div className="flex items-center gap-3">
            <button
              form={formId}
              type="submit"
              disabled={pending}
              aria-label="Salva"
              className="text-green-600 hover:text-green-700 disabled:opacity-50 dark:text-green-500"
            >
              <CheckIcon />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Annulla"
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <XIcon />
            </button>
          </div>
          {state.error && (
            <p className="mt-1 text-xs whitespace-nowrap text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
        </td>
      </tr>
    );
  }

  const measuredAt = new Date(measurement.measuredAt);

  return (
    <tr>
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
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Modifica"
            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <PencilIcon />
          </button>
          <form
            action={deleteMeasurement}
            onSubmit={(event) => {
              if (!confirm("Eliminare questa misurazione?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={measurement.id} />
            <button
              type="submit"
              aria-label="Elimina"
              className="text-red-500 hover:text-red-700 dark:text-red-400"
            >
              <TrashIcon />
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
