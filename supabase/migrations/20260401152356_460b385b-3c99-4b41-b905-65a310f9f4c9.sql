
-- Drop the blocking foreign key and recreate it with ON DELETE SET NULL
ALTER TABLE public.fleet_notices DROP CONSTRAINT IF EXISTS fleet_notices_created_by_fkey;
ALTER TABLE public.fleet_notices ADD CONSTRAINT fleet_notices_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
