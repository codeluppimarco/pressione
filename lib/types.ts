export type Measurement = {
  id: string;
  userId: string;
  measuredAt: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string | null;
};
