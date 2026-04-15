-- Character Factory MVP schema
-- PostgreSQL 15+

create extension if not exists "pgcrypto";

do $$ begin
  create type character_status as enum ('draft', 'active', 'locked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type job_mode as enum ('explore', 'refine', 'edit');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type job_status as enum ('queued', 'running', 'reviewing', 'completed', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type anchor_role as enum ('master', 'style_anchor', 'pose_anchor', 'deprecated_master');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type image_status as enum ('created', 'reviewed', 'selected', 'rejected', 'candidate_master', 'master');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reviewer_type as enum ('auto', 'human');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type decision_action as enum ('keep', 'reject', 'candidate_master', 'set_master', 'refine_from_this');
exception when duplicate_object then null;
end $$;

create table if not exists universes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  style_constitution_json jsonb not null default '{}'::jsonb,
  global_prompt_template text not null,
  global_negative_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references universes(id) on delete restrict,
  code text not null unique,
  name text not null,
  status character_status not null default 'draft',
  description text,
  fixed_traits_json jsonb not null default '{}'::jsonb,
  semi_fixed_traits_json jsonb not null default '{}'::jsonb,
  variable_defaults_json jsonb not null default '{}'::jsonb,
  palette_json jsonb not null default '{}'::jsonb,
  negative_rules_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  mode job_mode not null,
  status job_status not null default 'queued',
  source_image_id uuid,
  input_config_json jsonb not null default '{}'::jsonb,
  batch_size integer not null default 1,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  job_id uuid references generation_jobs(id) on delete set null,
  parent_prompt_version_id uuid references prompt_versions(id) on delete set null,
  scope text not null default 'job',
  variant_key text,
  strategy text,
  compiled_prompt text not null,
  compiled_negative_prompt text,
  patch_json jsonb,
  debug_payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists generated_images (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  prompt_version_id uuid references prompt_versions(id) on delete set null,
  source_api text not null,
  model_name text not null,
  image_url text not null,
  thumb_url text,
  revised_prompt text,
  generation_meta_json jsonb not null default '{}'::jsonb,
  status image_status not null default 'created',
  created_at timestamptz not null default now()
);

alter table generation_jobs
  drop constraint if exists generation_jobs_source_image_id_fkey;

alter table generation_jobs
  add constraint generation_jobs_source_image_id_fkey
  foreign key (source_image_id) references generated_images(id) on delete set null;

create table if not exists review_results (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references generated_images(id) on delete cascade,
  reviewer_type reviewer_type not null,
  total_score numeric(5,2) not null,
  style_score numeric(5,2) not null,
  identity_score numeric(5,2) not null,
  ratio_score numeric(5,2) not null,
  pose_score numeric(5,2) not null,
  palette_score numeric(5,2) not null,
  sheet_score numeric(5,2) not null,
  master_potential_score numeric(5,2) not null default 0,
  tags_json jsonb not null default '[]'::jsonb,
  notes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists character_anchor_images (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  image_id uuid not null references generated_images(id) on delete cascade,
  role anchor_role not null,
  is_active boolean not null default true,
  prompt_version_id uuid references prompt_versions(id) on delete set null,
  score_snapshot_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists human_decisions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  image_id uuid not null references generated_images(id) on delete cascade,
  action decision_action not null,
  reasons_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_generation_jobs_character_created
  on generation_jobs(character_id, created_at desc);

create index if not exists idx_prompt_versions_job_variant
  on prompt_versions(job_id, variant_key);

create index if not exists idx_generated_images_job
  on generated_images(job_id);

create index if not exists idx_review_results_image_reviewer
  on review_results(image_id, reviewer_type);

create index if not exists idx_anchor_images_character_active
  on character_anchor_images(character_id, is_active);

create index if not exists idx_human_decisions_job
  on human_decisions(job_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_universes_updated_at on universes;
create trigger trg_universes_updated_at
before update on universes
for each row execute procedure set_updated_at();

drop trigger if exists trg_characters_updated_at on characters;
create trigger trg_characters_updated_at
before update on characters
for each row execute procedure set_updated_at();

drop trigger if exists trg_generation_jobs_updated_at on generation_jobs;
create trigger trg_generation_jobs_updated_at
before update on generation_jobs
for each row execute procedure set_updated_at();
