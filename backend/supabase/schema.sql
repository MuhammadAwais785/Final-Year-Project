create extension if not exists "pgcrypto";

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  pin_hash text,
  language text not null default 'en' check (language in ('en', 'ur')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  name text not null,
  age integer not null check (age >= 3 and age <= 7),
  language text not null default 'en' check (language in ('en', 'ur')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  audio_local_allowed boolean not null default true,
  camera_allowed boolean not null default false,
  derived_sync_allowed boolean not null default false,
  version integer not null check (version >= 1),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (child_id, version)
);

create table if not exists public.child_goals (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  client_goal_id text not null,
  type text not null check (type in ('weekly_words', 'daily_minutes', 'skill')),
  target integer check (target >= 1),
  skill text check (skill in ('naming_objects', 'naming_animals', 'naming_food', 'colours')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baselines (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  baseline_id text not null,
  checklist_version text not null,
  task_ids jsonb not null,
  responses jsonb not null default '[]'::jsonb,
  attempts integer not null default 1 check (attempts >= 1 and attempts <= 3),
  baseline_score integer check (baseline_score >= 0 and baseline_score <= 100),
  status text not null check (status in ('incomplete', 'complete')),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, baseline_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  client_id text not null,
  activity text not null check (activity in ('object_naming', 'colour_matching', 'sound_imitation')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  stars integer not null default 0 check (stars >= 0),
  practiced integer not null default 0 check (practiced >= 0),
  correct integer not null default 0 check (correct >= 0),
  partial boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, client_id)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  session_client_id text not null,
  prompt_id text not null,
  status text not null check (status in ('recognized', 'incorrect', 'inconclusive', 'no_response')),
  score double precision check (score >= 0 and score <= 100),
  hint_level integer not null default 0 check (hint_level >= 0),
  at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (guardian_id, session_client_id, prompt_id, at)
);

alter table public.guardians enable row level security;
alter table public.child_profiles enable row level security;
alter table public.consent_records enable row level security;
alter table public.child_goals enable row level security;
alter table public.baselines enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;

grant usage on schema public to service_role;
grant all privileges on table
  public.guardians,
  public.child_profiles,
  public.consent_records,
  public.child_goals,
  public.baselines,
  public.sessions,
  public.attempts
  to service_role;
grant all privileges on all sequences in schema public to service_role;
