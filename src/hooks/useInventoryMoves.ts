import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryMove {
  id: string;
  created_at: string;
  created_by_user_id: string;
  source_ops_area: string;
  source_location_name: string;
  target_ops_area: string;
  target_location_name: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

export interface InventoryMoveLine {
  id: string;
  move_id: string;
  equipment_item_id: string | null;
  sku: string;
  qty: number;
  notes: string | null;
  created_at: string;
}

export interface CreateMoveData {
  source_ops_area: string;
  source_location_name: string;
  target_ops_area: string;
  target_location_name: string;
  notes?: string;
  lines: { equipment_item_id?: string; sku: string; qty: number; notes?: string }[];
}

/**
 * Stub function for future NetSuite integration.
 * Called when a move is marked as completed.
 * TODO: Implement actual NetSuite sync logic when API is available.
 */
function syncInventoryMoveToExternalSystem(moveId: string): void {
  console.log(`[TODO] syncInventoryMoveToExternalSystem called for move: ${moveId}`);
  // No-op placeholder for future NetSuite integration
}

export function useInventoryMoves(filters?: { status?: string; opsArea?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['inventory-moves', filters],
    queryFn: async () => {
      let query = supabase
        .from('inventory_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.opsArea) {
        query = query.or(`source_ops_area.eq.${filters.opsArea},target_ops_area.eq.${filters.opsArea}`);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryMove[];
    },
  });
}

export function useInventoryMove(moveId: string | undefined) {
  return useQuery({
    queryKey: ['inventory-move', moveId],
    queryFn: async () => {
      if (!moveId) return null;
      const { data, error } = await supabase
        .from('inventory_moves')
        .select('*')
        .eq('id', moveId)
        .maybeSingle();
      if (error) throw error;
      return data as InventoryMove | null;
    },
    enabled: !!moveId,
  });
}

export function useInventoryMoveLines(moveId: string | undefined) {
  return useQuery({
    queryKey: ['inventory-move-lines', moveId],
    queryFn: async () => {
      if (!moveId) return [];
      const { data, error } = await supabase
        .from('inventory_move_lines')
        .select(`
          *,
          equipment_items(name, category)
        `)
        .eq('move_id', moveId);
      if (error) throw error;
      return data;
    },
    enabled: !!moveId,
  });
}

export function useCreateInventoryMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMoveData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Create the move
      const { data: move, error: moveError } = await supabase
        .from('inventory_moves')
        .insert({
          created_by_user_id: userData.user.id,
          source_ops_area: data.source_ops_area,
          source_location_name: data.source_location_name,
          target_ops_area: data.target_ops_area,
          target_location_name: data.target_location_name,
          notes: data.notes || null,
          status: 'submitted',
        })
        .select()
        .single();

      if (moveError) throw moveError;

      // Create move lines
      const lines = data.lines.map((line) => ({
        move_id: move.id,
        equipment_item_id: line.equipment_item_id || null,
        sku: line.sku,
        qty: line.qty,
        notes: line.notes || null,
      }));

      const { error: linesError } = await supabase
        .from('inventory_move_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return move;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-moves'] });
      toast.success('Inventory move created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create move: ${error.message}`);
    },
  });
}

export function useUpdateMoveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moveId, status }: { moveId: string; status: 'completed' | 'cancelled' }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('inventory_moves')
        .update(updateData)
        .eq('id', moveId)
        .select()
        .single();

      if (error) throw error;

      // Call sync stub when completed
      if (status === 'completed') {
        syncInventoryMoveToExternalSystem(moveId);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-moves'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-move', variables.moveId] });
      toast.success(`Move marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error(`Failed to update move: ${error.message}`);
    },
  });
}
