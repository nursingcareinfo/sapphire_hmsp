-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- Nurse registration table
create table public.nurses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null,
  cnic text not null unique,
  mobile_number text,
  email_address text,
  total_years_experience numeric,
  city text,
  neighborhood text,
  shift_preferences text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Nurse credentials table
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  nurse_id uuid references public.nurses(user_id) on delete cascade,
  pnmc_reg_no text not null unique,
  valid_upto date,
  initial_reg_date date,
  specializations text[] default '{}',
  ocr_confidence_score numeric,
  validation_status text default 'Pending_Verification',
  raw_ocr_payload jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on both tables
alter table public.nurses enable row level security;
alter table public.credentials enable row level security;

-- Nurses can query and update their own record
create policy "Nurses can query and update their own record"
on public.nurses
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Nurses can read their own credentials
create policy "Nurses can read their own credentials"
on public.credentials
for select
to authenticated
using (auth.uid() = nurse_id);

-- Service role override for OCR registrar backend
create policy "Service role override for credentials"
on public.credentials
for all
to service_role
using (true)
with check (true);
