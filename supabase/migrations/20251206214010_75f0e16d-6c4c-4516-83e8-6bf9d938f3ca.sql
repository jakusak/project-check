-- Create table to store unit loads data from CSV uploads
CREATE TABLE public.unit_loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hub TEXT NOT NULL,
  ops_area TEXT NOT NULL,
  opx_flo TEXT,
  unit TEXT NOT NULL,
  load_date TEXT,
  loader TEXT,
  unit_type TEXT,
  main INTEGER DEFAULT 0,
  support INTEGER DEFAULT 0,
  extra INTEGER DEFAULT 0,
  no_van INTEGER DEFAULT 0,
  van_number TEXT,
  trailer_number TEXT,
  family TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unit_loads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all unit loads
CREATE POLICY "Authenticated users can view unit loads"
ON public.unit_loads
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can insert/update/delete unit loads
CREATE POLICY "Admins can manage unit loads"
ON public.unit_loads
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_unit_loads_hub ON public.unit_loads(hub);
CREATE INDEX idx_unit_loads_ops_area ON public.unit_loads(ops_area);