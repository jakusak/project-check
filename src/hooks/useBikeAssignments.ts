import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Stub function for future NetSuite integration
export const syncBikeAssignmentToExternalSystem = async (assignmentId: string) => {
  // TODO: Implement NetSuite sync when API access is available
  console.log(`[TPS] Bike assignment ${assignmentId} would sync to external system here`);
};

export interface Trip {
  id: string;
  trip_code: string;
  trip_name: string;
  start_date: string;
  end_date: string;
  ops_area: string | null;
  created_at: string;
}

export interface GuestReservation {
  id: string;
  trip_id: string;
  guest_name: string;
  reservation_code: string | null;
  bike_size: string | null;
  notes: string | null;
  trip?: Trip;
}

export interface BikeAssignment {
  id: string;
  created_at: string;
  bike_sku: string;
  bike_unique_id: string;
  equipment_item_id: string | null;
  guest_reservation_id: string;
  trip_id: string;
  assigned_by_user_id: string;
  status: string;
  notes: string | null;
  returned_at: string | null;
  guest_reservation?: GuestReservation;
  trip?: Trip;
}

export const useTrips = (searchTerm?: string) => {
  return useQuery({
    queryKey: ["trips", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });

      if (searchTerm) {
        query = query.or(`trip_code.ilike.%${searchTerm}%,trip_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Trip[];
    },
  });
};

export const useGuestReservations = (tripId?: string) => {
  return useQuery({
    queryKey: ["guest-reservations", tripId],
    queryFn: async () => {
      let query = supabase
        .from("guest_reservations")
        .select(`
          *,
          trip:trips(*)
        `)
        .order("guest_name", { ascending: true });

      if (tripId) {
        query = query.eq("trip_id", tripId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuestReservation[];
    },
    enabled: !!tripId,
  });
};

export const useBikeAssignments = (filters?: { tripId?: string; bikeUniqueId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["bike-assignments", filters],
    queryFn: async () => {
      let query = supabase
        .from("bike_assignments")
        .select(`
          *,
          guest_reservation:guest_reservations(*),
          trip:trips(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.tripId) {
        query = query.eq("trip_id", filters.tripId);
      }
      if (filters?.bikeUniqueId) {
        query = query.eq("bike_unique_id", filters.bikeUniqueId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BikeAssignment[];
    },
  });
};

export const useBikeHistory = (bikeUniqueId: string) => {
  return useQuery({
    queryKey: ["bike-history", bikeUniqueId],
    queryFn: async () => {
      // Get bike assignments
      const { data: assignments, error: assignError } = await supabase
        .from("bike_assignments")
        .select(`
          *,
          guest_reservation:guest_reservations(*),
          trip:trips(*)
        `)
        .eq("bike_unique_id", bikeUniqueId)
        .order("created_at", { ascending: false });

      if (assignError) throw assignError;

      // Get maintenance records by SKU (first assignment's SKU)
      let maintenance: any[] = [];
      if (assignments && assignments.length > 0) {
        const sku = assignments[0].bike_sku;
        const { data: maintenanceData, error: maintError } = await supabase
          .from("maintenance_records")
          .select("*")
          .eq("sku", sku)
          .order("created_at", { ascending: false });

        if (!maintError) {
          maintenance = maintenanceData || [];
        }
      }

      return { assignments: assignments as BikeAssignment[], maintenance };
    },
    enabled: !!bikeUniqueId,
  });
};

export const useCreateBikeAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      bike_sku: string;
      bike_unique_id: string;
      equipment_item_id?: string;
      guest_reservation_id: string;
      trip_id: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("bike_assignments")
        .insert({
          ...data,
          assigned_by_user_id: user.id,
          status: "assigned",
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("idx_bike_unique_active_assignment")) {
          throw new Error("This bike is already assigned to another guest");
        }
        throw error;
      }

      // Trigger external sync stub
      await syncBikeAssignmentToExternalSystem(result.id);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bike-assignments"] });
      toast({ title: "Bike assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateBikeAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string; returned_at?: string }) => {
      const { data: result, error } = await supabase
        .from("bike_assignments")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bike-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["bike-history"] });
      toast({ title: "Assignment updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useEquipmentItems = (category?: string) => {
  return useQuery({
    queryKey: ["equipment-items-bikes", category],
    queryFn: async () => {
      let query = supabase
        .from("equipment_items")
        .select("*")
        .eq("availability", true)
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
