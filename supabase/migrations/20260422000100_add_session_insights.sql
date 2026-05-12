alter table public.sessions
  add column if not exists insight_label text,
  add column if not exists insight_reason text,
  add column if not exists insight_classifier_version text;
