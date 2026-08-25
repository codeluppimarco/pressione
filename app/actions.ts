"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseMeasurementsCsv, type ImportError } from "@/lib/csv";
import { parseLocalDateTime } from "@/lib/date";

export type AuthState = {
  error: string | null;
  message: string | null;
};

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o password non corretti.", message: null };
  }

  redirect("/");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return {
      error: "La password deve avere almeno 6 caratteri.",
      message: null,
    };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  return {
    error: null,
    message: "Controlla la tua email per confermare la registrazione.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type MeasurementState = {
  error: string | null;
  successId: number;
};

export async function addMeasurement(
  prevState: MeasurementState,
  formData: FormData,
): Promise<MeasurementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const systolic = Number(formData.get("systolic"));
  const diastolic = Number(formData.get("diastolic"));
  const pulse = Number(formData.get("pulse"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (
    !date ||
    !time ||
    !Number.isFinite(systolic) ||
    !Number.isFinite(diastolic) ||
    !Number.isFinite(pulse)
  ) {
    return {
      error: "Compila tutti i campi obbligatori con valori validi.",
      successId: prevState.successId,
    };
  }

  const measuredAt = parseLocalDateTime(date, time);
  if (!measuredAt) {
    return { error: "Data od ora non valide.", successId: prevState.successId };
  }

  const { error } = await supabase.from("measurements").insert({
    user_id: user.id,
    measured_at: measuredAt.toISOString(),
    systolic,
    diastolic,
    pulse,
    notes: notes || null,
  });

  if (error) {
    return {
      error: "Errore durante il salvataggio. Riprova.",
      successId: prevState.successId,
    };
  }

  revalidatePath("/");
  return { error: null, successId: prevState.successId + 1 };
}

export type ImportState = {
  imported: number;
  errors: ImportError[];
  successId: number;
};

export async function importMeasurements(
  prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      imported: 0,
      errors: [{ line: 0, reason: "Nessun file selezionato." }],
      successId: prevState.successId,
    };
  }

  const text = await file.text();
  const { rows, errors } = parseMeasurementsCsv(text);

  if (rows.length === 0) {
    return { imported: 0, errors, successId: prevState.successId };
  }

  const { error } = await supabase.from("measurements").insert(
    rows.map((row) => ({
      user_id: user.id,
      measured_at: row.measuredAt,
      systolic: row.systolic,
      diastolic: row.diastolic,
      pulse: row.pulse,
      notes: row.notes,
    })),
  );

  if (error) {
    return {
      imported: 0,
      errors: [{ line: 0, reason: "Errore durante il salvataggio. Riprova." }],
      successId: prevState.successId,
    };
  }

  revalidatePath("/");
  return { imported: rows.length, errors, successId: prevState.successId + 1 };
}

export async function updateMeasurement(
  prevState: MeasurementState,
  formData: FormData,
): Promise<MeasurementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const systolic = Number(formData.get("systolic"));
  const diastolic = Number(formData.get("diastolic"));
  const pulse = Number(formData.get("pulse"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (
    !id ||
    !date ||
    !time ||
    !Number.isFinite(systolic) ||
    !Number.isFinite(diastolic) ||
    !Number.isFinite(pulse)
  ) {
    return {
      error: "Compila tutti i campi obbligatori con valori validi.",
      successId: prevState.successId,
    };
  }

  const measuredAt = parseLocalDateTime(date, time);
  if (!measuredAt) {
    return { error: "Data od ora non valide.", successId: prevState.successId };
  }

  const { error } = await supabase
    .from("measurements")
    .update({
      measured_at: measuredAt.toISOString(),
      systolic,
      diastolic,
      pulse,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error: "Errore durante il salvataggio. Riprova.",
      successId: prevState.successId,
    };
  }

  revalidatePath("/");
  return { error: null, successId: prevState.successId + 1 };
}

export async function deleteMeasurement(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("measurements").delete().eq("id", id);
  }

  revalidatePath("/");
}
