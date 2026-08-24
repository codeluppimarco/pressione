create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  systolic smallint not null,
  diastolic smallint not null,
  pulse smallint not null,
  notes text,
  created_at timestamptz not null default now()
);

create index measurements_user_id_measured_at_idx
  on public.measurements (user_id, measured_at desc);

alter table public.measurements enable row level security;

create policy "Users can view own measurements"
  on public.measurements for select
  using (auth.uid() = user_id);

create policy "Users can insert own measurements"
  on public.measurements for insert
  with check (auth.uid() = user_id);

create policy "Users can update own measurements"
  on public.measurements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own measurements"
  on public.measurements for delete
  using (auth.uid() = user_id);
