-- Enable uuid extension
create extension if not exists "uuid-ossp";

create table if not exists public.nurses (
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

create table if not exists public.credentials (
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

alter table public.nurses enable row level security;
alter table public.credentials enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nurses'
      and policyname = 'Nurses can query and update their own record'
  ) then
    create policy "Nurses can query and update their own record"
      on public.nurses for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credentials'
      and policyname = 'Nurses can read their own credentials'
  ) then
    create policy "Nurses can read their own credentials"
      on public.credentials for select to authenticated
      using (auth.uid() = nurse_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credentials'
      and policyname = 'Service role override for credentials'
  ) then
    create policy "Service role override for credentials"
      on public.credentials for all to service_role
      using (true) with check (true);
  end if;
end;
$$;
