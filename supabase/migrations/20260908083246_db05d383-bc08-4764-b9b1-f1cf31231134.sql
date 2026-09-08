ALTER TABLE public.ops_tasks ADD COLUMN IF NOT EXISTS hub text NOT NULL DEFAULT 'provence';
ALTER TABLE public.supply_requests ADD COLUMN IF NOT EXISTS hub text NOT NULL DEFAULT 'provence';
ALTER TABLE public.ops_team_members ADD COLUMN IF NOT EXISTS hub text NOT NULL DEFAULT 'provence';

UPDATE public.ops_tasks SET hub = CASE
  WHEN location ILIKE '%tuscany%' THEN 'tuscany'
  WHEN location ILIKE '%czech%' THEN 'czech'
  WHEN location ILIKE '%croatia%' THEN 'croatia'
  ELSE 'provence'
END;

CREATE INDEX IF NOT EXISTS ops_tasks_hub_idx ON public.ops_tasks (hub);
CREATE INDEX IF NOT EXISTS supply_requests_hub_idx ON public.supply_requests (hub);