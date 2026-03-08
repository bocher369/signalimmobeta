ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS territorial_data jsonb;
