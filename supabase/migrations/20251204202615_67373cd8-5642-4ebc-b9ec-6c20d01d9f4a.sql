-- Add regions array column to equipment_items
ALTER TABLE public.equipment_items 
ADD COLUMN regions text[] DEFAULT ARRAY['europe', 'usa_lappa', 'canada']::text[];

-- Add region column to ops_area_to_hub table
ALTER TABLE public.ops_area_to_hub 
ADD COLUMN region text DEFAULT 'europe';

-- Create index for faster region filtering
CREATE INDEX idx_equipment_items_regions ON public.equipment_items USING GIN(regions);
CREATE INDEX idx_ops_area_to_hub_region ON public.ops_area_to_hub(region);