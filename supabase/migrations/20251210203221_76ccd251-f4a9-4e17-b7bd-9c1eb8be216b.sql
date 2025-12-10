-- Create inventory_moves table
CREATE TABLE public.inventory_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  source_ops_area TEXT NOT NULL,
  source_location_name TEXT NOT NULL,
  target_ops_area TEXT NOT NULL,
  target_location_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_move_lines table
CREATE TABLE public.inventory_move_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  move_id UUID NOT NULL REFERENCES public.inventory_moves(id) ON DELETE CASCADE,
  equipment_item_id UUID REFERENCES public.equipment_items(id),
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_move_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_moves
CREATE POLICY "Admins can manage all moves"
ON public.inventory_moves FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "OPX can view moves for their areas"
ON public.inventory_moves FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE user_id = auth.uid()
    AND (ops_area = inventory_moves.source_ops_area OR ops_area = inventory_moves.target_ops_area)
  )
);

CREATE POLICY "OPX can create moves for their areas"
ON public.inventory_moves FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin') OR
  (
    auth.uid() = created_by_user_id AND
    EXISTS (
      SELECT 1 FROM opx_area_assignments
      WHERE user_id = auth.uid()
      AND (ops_area = inventory_moves.source_ops_area OR ops_area = inventory_moves.target_ops_area)
    )
  )
);

CREATE POLICY "OPX can update moves for their areas"
ON public.inventory_moves FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin') OR
  EXISTS (
    SELECT 1 FROM opx_area_assignments
    WHERE user_id = auth.uid()
    AND (ops_area = inventory_moves.source_ops_area OR ops_area = inventory_moves.target_ops_area)
  )
);

-- RLS policies for inventory_move_lines
CREATE POLICY "Admins can manage all move lines"
ON public.inventory_move_lines FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "OPX can view move lines for their areas"
ON public.inventory_move_lines FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  EXISTS (
    SELECT 1 FROM inventory_moves im
    JOIN opx_area_assignments oa ON (oa.ops_area = im.source_ops_area OR oa.ops_area = im.target_ops_area)
    WHERE im.id = inventory_move_lines.move_id AND oa.user_id = auth.uid()
  )
);

CREATE POLICY "OPX can create move lines for their moves"
ON public.inventory_move_lines FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin') OR
  EXISTS (
    SELECT 1 FROM inventory_moves im
    JOIN opx_area_assignments oa ON (oa.ops_area = im.source_ops_area OR oa.ops_area = im.target_ops_area)
    WHERE im.id = inventory_move_lines.move_id AND oa.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_inventory_moves_updated_at
BEFORE UPDATE ON public.inventory_moves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_inventory_moves_status ON public.inventory_moves(status);
CREATE INDEX idx_inventory_moves_source_ops_area ON public.inventory_moves(source_ops_area);
CREATE INDEX idx_inventory_moves_target_ops_area ON public.inventory_moves(target_ops_area);
CREATE INDEX idx_inventory_move_lines_move_id ON public.inventory_move_lines(move_id);