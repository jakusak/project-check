-- Create ops_area_to_hub mapping table
CREATE TABLE public.ops_area_to_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_area text NOT NULL UNIQUE,
  hub text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Seed the ops_area_to_hub mapping
INSERT INTO public.ops_area_to_hub (ops_area, hub) VALUES
  -- Czechia HUB
  ('Czechia - Cesky Krumlov', 'Czechia HUB'),
  ('Germany - Bavaria', 'Czechia HUB'),
  ('Germany - Berlin', 'Czechia HUB'),
  ('Latvia - Riga', 'Czechia HUB'),
  ('Netherlands - Amsterdam', 'Czechia HUB'),
  ('Poland - Krakow', 'Czechia HUB'),
  ('Sweden - Malmo', 'Czechia HUB'),
  ('Norway - Alesund', 'Czechia HUB'),
  ('Norway - Lofoten', 'Czechia HUB'),
  ('Norway - Oslo', 'Czechia HUB'),
  ('Norway - Tromso', 'Czechia HUB'),
  ('Norway - Voss', 'Czechia HUB'),
  ('England - Cotswalds', 'Czechia HUB'),
  ('England - Cornwall', 'Czechia HUB'),
  ('Finland - Rovaniemi', 'Czechia HUB'),
  -- Italy (Tuscany) HUB
  ('Italy - Ala', 'Italy (Tuscany) HUB'),
  ('Italy - Naples', 'Italy (Tuscany) HUB'),
  ('Italy - Puglia', 'Italy (Tuscany) HUB'),
  ('Italy - Sardinia', 'Italy (Tuscany) HUB'),
  ('Italy - Sicily', 'Italy (Tuscany) HUB'),
  ('Italy - Tuscany', 'Italy (Tuscany) HUB'),
  ('Italy - Val Gardena', 'Italy (Tuscany) HUB'),
  -- Pernes HUB (France)
  ('Italy - Asti', 'Pernes HUB (France)'),
  ('Italy - Milan', 'Pernes HUB (France)'),
  ('Croatia - Dubrovnik', 'Pernes HUB (France)'),
  ('Croatia - Split', 'Pernes HUB (France)'),
  ('Croatia - Cyprus', 'Pernes HUB (France)'),
  ('France - Bordeaux', 'Pernes HUB (France)'),
  ('France - Occitanie', 'Pernes HUB (France)'),
  ('France - Chamonix', 'Pernes HUB (France)'),
  ('France - Corsica', 'Pernes HUB (France)'),
  ('France - Provence', 'Pernes HUB (France)'),
  ('France - Riviera', 'Pernes HUB (France)'),
  ('France - Saint-Malo', 'Pernes HUB (France)'),
  ('France - Savoie', 'Pernes HUB (France)'),
  ('France - Tours', 'Pernes HUB (France)'),
  ('Greece - Crete', 'Pernes HUB (France)'),
  ('Greece - Peloponnese', 'Pernes HUB (France)'),
  ('Iceland - Reykjavik', 'Pernes HUB (France)'),
  ('Ireland - Dublin', 'Pernes HUB (France)'),
  ('Ireland - Kenmare', 'Pernes HUB (France)'),
  ('Morocco - Morocco', 'Pernes HUB (France)'),
  ('Portugal - Algarve', 'Pernes HUB (France)'),
  ('Portugal - Azores', 'Pernes HUB (France)'),
  ('Portugal - Lisbon', 'Pernes HUB (France)'),
  ('Portugal - Madeira', 'Pernes HUB (France)'),
  ('Portugal - Porto', 'Pernes HUB (France)'),
  ('Scotland - Aviemore', 'Pernes HUB (France)'),
  ('Scotland - Stirling', 'Pernes HUB (France)'),
  ('Slovenia - Jasenice', 'Pernes HUB (France)'),
  ('Spain - Basque', 'Pernes HUB (France)'),
  ('Spain - Catalonia', 'Pernes HUB (France)'),
  ('Spain - Cuenca', 'Pernes HUB (France)'),
  ('Spain - Mallorca', 'Pernes HUB (France)'),
  ('Spain - Salamanca', 'Pernes HUB (France)'),
  ('Spain - Ronda', 'Pernes HUB (France)'),
  ('Spain - Canaries', 'Pernes HUB (France)'),
  ('Spain - Cantabria', 'Pernes HUB (France)'),
  ('Swiss - Berne', 'Pernes HUB (France)'),
  ('Swiss - Davos', 'Pernes HUB (France)'),
  ('England - Wales', 'Pernes HUB (France)'),
  ('Finland - Levi', 'Pernes HUB (France)');

-- Enable RLS on ops_area_to_hub
ALTER TABLE public.ops_area_to_hub ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read ops areas
CREATE POLICY "Anyone can view ops area mappings"
ON public.ops_area_to_hub
FOR SELECT
USING (true);

-- Only admins can modify mappings
CREATE POLICY "Admins can manage ops area mappings"
ON public.ops_area_to_hub
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add hub field to equipment_requests (rename delivery_region to ops_area for clarity)
ALTER TABLE public.equipment_requests
ADD COLUMN hub text,
ADD COLUMN ops_area text;

-- Migrate existing delivery_region data to ops_area
UPDATE public.equipment_requests SET ops_area = delivery_region WHERE delivery_region IS NOT NULL;

-- Add reason, approval_status, and decline_reason to line items
ALTER TABLE public.equipment_request_line_items
ADD COLUMN reason text,
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'declined')),
ADD COLUMN decline_reason text,
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone;

-- Create inventory sync logs table
CREATE TABLE public.inventory_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.equipment_requests(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.equipment_items(id),
  hub text NOT NULL,
  quantity integer NOT NULL,
  netsuite_transaction_id text,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on inventory_sync_logs
ALTER TABLE public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync logs
CREATE POLICY "Admins can view sync logs"
ON public.inventory_sync_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert sync logs
CREATE POLICY "Admins can create sync logs"
ON public.inventory_sync_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for line items to allow admins to update approval status
CREATE POLICY "Admins can update line items"
ON public.equipment_request_line_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));