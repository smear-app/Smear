create table coaching_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null check (insight_type in ('pre-session', 'post-session', 'training-focus')),
  insight_text text not null,
  generated_at timestamptz not null default now(),
  is_valid boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index on coaching_insights(user_id, insight_type) where is_valid = true;
create index on coaching_insights(user_id, insight_type, is_valid);
