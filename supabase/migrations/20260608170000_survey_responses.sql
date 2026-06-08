-- survey_responses table for HMSP nurse viability study
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- OCR-extracted personal info (from PNC card + CV)
  ocr_name text,
  ocr_cnic text,
  ocr_mobile text,
  ocr_email text,
  ocr_experience_years numeric,
  ocr_pnmc_reg_no text,
  ocr_credentials jsonb,

  -- Survey sections (full form data)
  section_1 jsonb,  -- personal information
  section_2 jsonb,  -- PNC license & professional credentials
  section_3 jsonb,  -- current employment & income
  section_4 jsonb,  -- availability & work preferences
  section_5 jsonb,  -- direct patient interaction & personal safety
  section_6 jsonb,  -- app & platform viability
  section_7 jsonb,  -- final remarks

  consent_accepted boolean default false
);

-- Index for listing recent responses
create index survey_responses_created_at_idx on public.survey_responses(created_at desc);

-- Enable RLS
alter table public.survey_responses enable row level security;

-- Anyone can submit a survey (public form)
create policy "Anyone can insert survey responses"
on public.survey_responses
for insert
to anon, authenticated
with check (true);

-- Only service role can read (admin analytics)
create policy "Service role can read survey responses"
on public.survey_responses
for select
to service_role
using (true);
