-- Add backroads_van_number column to fleet_vehicles
ALTER TABLE public.fleet_vehicles 
ADD COLUMN backroads_van_number TEXT;

-- Create index for faster lookups by license plate
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_license_plate 
ON public.fleet_vehicles (LOWER(license_plate));

-- Create index for lookups by backroads van number
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_backroads_van_number 
ON public.fleet_vehicles (backroads_van_number) WHERE backroads_van_number IS NOT NULL;