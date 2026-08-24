"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMeasurement, type MeasurementState } from "@/app/actions";

const initialState: MeasurementState = { error: null, successId: 0 };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function now(): string {
  return new Date().toISOString().slice(11, 16);
}

export function AddMeasurementForm() {
  const [state, formAction, pending] = useActionState(
    addMeasurement,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.successId > 0) {
      formRef.current?.reset();
    }
  }, [state.successId]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-lg border border-black/10 bg-white p-4 sm:grid-cols-3 md:grid-cols-6 dark:border-white/10 dark:bg-zinc-900"
    >
      <Field label="Data" htmlFor="date">
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={today()}
          className="input"
        />
      </Field>

      <Field label="Ora" htmlFor="time">
        <input
          id="time"
          name="time"
          type="time"
          required
          defaultValue={now()}
          className="input"
        />
      </Field>

      <Field label="Massima" htmlFor="systolic">
        <input
          id="systolic"
          name="systolic"
          type="number"
          inputMode="numeric"
          required
          min={0}
          max={400}
          className="input"
        />
      </Field>

      <Field label="Minima" htmlFor="diastolic">
        <input
          id="diastolic"
          name="diastolic"
          type="number"
          inputMode="numeric"
          required
          min={0}
          max={400}
          className="input"
        />
      </Field>

      <Field label="Battiti" htmlFor="pulse">
        <input
          id="pulse"
          name="pulse"
          type="number"
          inputMode="numeric"
          required
          min={0}
          max={400}
          className="input"
        />
      </Field>

      <Field label="Note" htmlFor="notes">
        <input id="notes" name="notes" type="text" className="input" />
      </Field>

      {state.error && (
        <p className="col-span-full text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="col-span-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-1 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Salvataggio..." : "Aggiungi"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
