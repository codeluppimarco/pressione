import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddMeasurementForm } from "@/components/AddMeasurementForm";
import { MeasurementsTable } from "@/components/MeasurementsTable";
import { LogoutButton } from "@/components/LogoutButton";
import type { Measurement } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("measurements")
    .select("id, measured_at, systolic, diastolic, pulse, notes")
    .order("measured_at", { ascending: false });

  if (error) {
    throw new Error("Impossibile caricare le misurazioni.");
  }

  const measurements: Measurement[] = data.map((row) => ({
    id: row.id,
    userId: user.id,
    measuredAt: row.measured_at,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    notes: row.notes,
  }));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Le mie misurazioni
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
          </div>
          <LogoutButton />
        </div>

        <AddMeasurementForm />

        <MeasurementsTable measurements={measurements} />
      </div>
    </div>
  );
}
