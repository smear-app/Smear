create extension if not exists pgcrypto;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending',
  source text not null default 'landing_page',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_requests_email_not_blank check (length(btrim(email)) > 0),
  constraint access_requests_status_check check (status in ('pending', 'invited', 'rejected'))
);

create or replace function public.set_access_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_access_requests_updated_at on public.access_requests;

create trigger set_access_requests_updated_at
before update on public.access_requests
for each row
execute function public.set_access_requests_updated_at();
