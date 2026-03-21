
ALTER TABLE public.ops_tasks ADD COLUMN IF NOT EXISTS planning_horizon text DEFAULT NULL;
ALTER TABLE public.supply_requests ADD COLUMN IF NOT EXISTS planning_horizon text DEFAULT NULL;
