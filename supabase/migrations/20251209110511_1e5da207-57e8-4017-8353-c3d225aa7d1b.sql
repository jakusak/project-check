-- Drop the existing foreign key constraint and recreate with ON DELETE SET NULL
ALTER TABLE public.equipment_request_line_items 
DROP CONSTRAINT IF EXISTS equipment_request_line_items_modified_by_opx_fkey;

ALTER TABLE public.equipment_request_line_items 
ADD CONSTRAINT equipment_request_line_items_modified_by_opx_fkey 
FOREIGN KEY (modified_by_opx) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also fix approved_by column if it has the same issue
ALTER TABLE public.equipment_request_line_items 
DROP CONSTRAINT IF EXISTS equipment_request_line_items_approved_by_fkey;

ALTER TABLE public.equipment_request_line_items 
ADD CONSTRAINT equipment_request_line_items_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;