-- Create trips placeholder table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code text NOT NULL,
  trip_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  ops_area text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create guest_reservations placeholder table
CREATE TABLE public.guest_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  reservation_code text,
  bike_size text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create bike_assignments table
CREATE TABLE public.bike_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  bike_sku text NOT NULL,
  bike_unique_id text NOT NULL,
  equipment_item_id uuid REFERENCES public.equipment_items(id) ON DELETE SET NULL,
  guest_reservation_id uuid REFERENCES public.guest_reservations(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  assigned_by_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned')),
  notes text,
  returned_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_assignments ENABLE ROW LEVEL SECURITY;

-- Trips RLS policies
CREATE POLICY "Authenticated users can view trips"
ON public.trips FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage trips"
ON public.trips FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "TPS can manage trips"
ON public.trips FOR ALL
USING (has_role(auth.uid(), 'tps'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Guest reservations RLS policies
CREATE POLICY "Authenticated users can view reservations"
ON public.guest_reservations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reservations"
ON public.guest_reservations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "TPS can manage reservations"
ON public.guest_reservations FOR ALL
USING (has_role(auth.uid(), 'tps'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Bike assignments RLS policies
CREATE POLICY "TPS can view all bike assignments"
ON public.bike_assignments FOR SELECT
USING (has_role(auth.uid(), 'tps'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "TPS can create bike assignments"
ON public.bike_assignments FOR INSERT
WITH CHECK ((has_role(auth.uid(), 'tps'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) AND assigned_by_user_id = auth.uid());

CREATE POLICY "TPS can update bike assignments"
ON public.bike_assignments FOR UPDATE
USING (has_role(auth.uid(), 'tps'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage all bike assignments"
ON public.bike_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Unique constraint to prevent same bike assigned twice when status=assigned
CREATE UNIQUE INDEX idx_bike_unique_active_assignment 
ON public.bike_assignments (bike_unique_id) 
WHERE status = 'assigned';

-- Indexes for performance
CREATE INDEX idx_bike_assignments_trip ON public.bike_assignments(trip_id);
CREATE INDEX idx_bike_assignments_bike_sku ON public.bike_assignments(bike_sku);
CREATE INDEX idx_bike_assignments_bike_unique_id ON public.bike_assignments(bike_unique_id);
CREATE INDEX idx_bike_assignments_status ON public.bike_assignments(status);
CREATE INDEX idx_guest_reservations_trip ON public.guest_reservations(trip_id);

-- Updated_at triggers
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guest_reservations_updated_at
BEFORE UPDATE ON public.guest_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bike_assignments_updated_at
BEFORE UPDATE ON public.bike_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();