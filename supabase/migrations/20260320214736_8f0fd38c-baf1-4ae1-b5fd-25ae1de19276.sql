
-- Add new simplified owner columns
ALTER TABLE public.ops_tasks ADD COLUMN main_owner_id uuid REFERENCES public.ops_team_members(id);
ALTER TABLE public.ops_tasks ADD COLUMN other_owner_id uuid REFERENCES public.ops_team_members(id);

-- Migrate data: primary_owner → main_owner, current_owner → other_owner
UPDATE public.ops_tasks SET main_owner_id = primary_owner_id WHERE primary_owner_id IS NOT NULL;
UPDATE public.ops_tasks SET other_owner_id = COALESCE(secondary_owner_id, current_owner_id) WHERE COALESCE(secondary_owner_id, current_owner_id) IS NOT NULL;

-- Drop old foreign keys and columns
ALTER TABLE public.ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_current_owner_id_fkey;
ALTER TABLE public.ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_primary_owner_id_fkey;
ALTER TABLE public.ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_secondary_owner_id_fkey;
ALTER TABLE public.ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_rightful_owner_id_fkey;

ALTER TABLE public.ops_tasks DROP COLUMN current_owner_id;
ALTER TABLE public.ops_tasks DROP COLUMN primary_owner_id;
ALTER TABLE public.ops_tasks DROP COLUMN secondary_owner_id;
ALTER TABLE public.ops_tasks DROP COLUMN rightful_owner_id;
