alter table public.climbs
  add column if not exists attempts integer;

alter table public.climbs
  drop constraint if exists climbs_attempts_valid;

alter table public.climbs
  add constraint climbs_attempts_valid
  check (attempts is null or attempts between 1 and 99);

create table if not exists public.user_canonical_climb_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_climb_id uuid not null references public.canonical_climbs(id) on delete cascade,
  pre_send_attempt_count integer not null default 0,
  first_send_attempt_count integer,
  first_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, canonical_climb_id),
  constraint user_canonical_climb_progress_pre_send_nonnegative
    check (pre_send_attempt_count >= 0),
  constraint user_canonical_climb_progress_first_send_positive
    check (first_send_attempt_count is null or first_send_attempt_count >= 1)
);

create index if not exists user_canonical_climb_progress_canonical_idx
  on public.user_canonical_climb_progress (canonical_climb_id);
