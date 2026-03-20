-- Create supply request enums
CREATE TYPE public.supply_request_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE public.supply_request_category AS ENUM ('kitchen_supplies', 'office_supplies');
CREATE TYPE public.supply_request_priority AS ENUM ('low', 'medium', 'high');

-- Create supply_requests table
CREATE TABLE public.supply_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category supply_request_category NOT NULL DEFAULT 'kitchen_supplies',
  items text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  priority supply_request_priority NOT NULL DEFAULT 'medium',
  notes text,
  requested_by text NOT NULL,
  status supply_request_status NOT NULL DEFAULT 'open',
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view supply requests"
  ON public.supply_requests FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create supply requests"
  ON public.supply_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update supply requests"
  ON public.supply_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE TRIGGER update_supply_requests_updated_at
  BEFORE UPDATE ON public.supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();