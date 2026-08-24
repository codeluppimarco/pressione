"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { importMeasurements, type ImportState } from "@/app/actions";

const initialState: ImportState = { imported: 0, errors: [], successId: 0 };

export function ImportCsvForm() {
  const [state, formAction, pending] = useActionState(
    importMeasurements,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.successId > 0) {
      formRef.current?.reset();
    }
  }, [state.successId]);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
      >
        {open ? "Nascondi importazione CSV" : "Importa da CSV"}
      </button>

      {open && (
        <form
          ref={formRef}
          action={formAction}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="file"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              File CSV (colonne: Data, Ora, max/min, Pulsazioni, Note)
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="text-sm text-zinc-700 dark:text-zinc-300"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {pending ? "Importazione..." : "Importa"}
          </button>
        </form>
      )}

      {(state.imported > 0 || state.errors.length > 0) && (
        <div className="mt-4 text-sm">
          <p className="text-zinc-700 dark:text-zinc-300">
            {state.imported} misurazion{state.imported === 1 ? "e" : "i"}{" "}
            importat{state.imported === 1 ? "a" : "e"}
            {state.errors.length > 0 &&
              `, ${state.errors.length} riga${state.errors.length === 1 ? "" : "e"} scartata${state.errors.length === 1 ? "" : "e"}`}
            .
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-md bg-zinc-50 p-2 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {state.errors.map((err, index) => (
                <li key={index}>
                  {err.line > 0 ? `Riga ${err.line}: ` : ""}
                  {err.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
