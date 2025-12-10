import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";

export interface BrokenItemReport {
  id: string;
  created_at: string;
  created_by_user_id: string;
  equipment_item_id: string | null;
  sku: string;
  ops_area: string;
  location_name: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_maintenance" | "resolved";
  photo_path: string | null;
  updated_at: string;
  equipment_item?: { name: string; sku: string } | null;
  creator_email?: string;
}

export interface MaintenanceRecord {
  id: string;
  created_at: string;
  created_by_user_id: string;
  equipment_item_id: string | null;
  sku: string;
  maintenance_type: string;
  notes: string | null;
  status: "open" | "completed";
  photo_path: string | null;
  completed_at: string | null;
  broken_item_report_id: string | null;
  updated_at: string;
  equipment_item?: { name: string; sku: string } | null;
  creator_email?: string;
}

// Stub notification function
export async function notifyOpsAdminForBrokenItem(reportId: string): Promise<void> {
  // TODO: Implement notification to OPS Admin when broken item is reported
  console.log(`[STUB] notifyOpsAdminForBrokenItem called for report: ${reportId}`);
}

// Stub sync function
export async function syncMaintenanceRecordToExternalSystem(recordId: string): Promise<void> {
  // TODO: Implement sync to external maintenance/inventory system
  console.log(`[STUB] syncMaintenanceRecordToExternalSystem called for record: ${recordId}`);
}

// Broken Item Reports Hooks
export function useBrokenItemReports(filters?: {
  opsArea?: string;
  status?: string;
  severity?: string;
}) {
  return useQuery({
    queryKey: ["broken-item-reports", filters],
    queryFn: async () => {
      let query = supabase
        .from("broken_item_reports")
        .select(`
          *,
          equipment_item:equipment_items(name, sku)
        `)
        .order("created_at", { ascending: false });

      if (filters?.opsArea && filters.opsArea !== "__all__") {
        query = query.eq("ops_area", filters.opsArea);
      }
      if (filters?.status && filters.status !== "__all__") {
        query = query.eq("status", filters.status as "open" | "in_maintenance" | "resolved");
      }
      if (filters?.severity && filters.severity !== "__all__") {
        query = query.eq("severity", filters.severity as "low" | "medium" | "high");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch creator emails
      const userIds = [...new Set(data?.map((r) => r.created_by_user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

      return (data || []).map((report) => ({
        ...report,
        creator_email: profileMap.get(report.created_by_user_id) || "Unknown",
      })) as BrokenItemReport[];
    },
  });
}

export function useBrokenItemReport(id: string | undefined) {
  return useQuery({
    queryKey: ["broken-item-report", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("broken_item_reports")
        .select(`
          *,
          equipment_item:equipment_items(name, sku)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;

      // Fetch creator email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", data.created_by_user_id)
        .single();

      return {
        ...data,
        creator_email: profile?.email || "Unknown",
      } as BrokenItemReport;
    },
    enabled: !!id,
  });
}

export function useCreateBrokenItemReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: {
      equipment_item_id?: string;
      sku: string;
      ops_area: string;
      location_name: string;
      description: string;
      severity: "low" | "medium" | "high";
      photo_path?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("broken_item_reports")
        .insert({
          ...report,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Call stub notification
      await notifyOpsAdminForBrokenItem(data.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broken-item-reports"] });
    },
  });
}

export function useUpdateBrokenItemReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        status: "open" | "in_maintenance" | "resolved";
        description: string;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("broken_item_reports")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["broken-item-reports"] });
      queryClient.invalidateQueries({ queryKey: ["broken-item-report", variables.id] });
    },
  });
}

// Maintenance Records Hooks
export function useMaintenanceRecords(filters?: {
  status?: string;
  opsArea?: string;
}) {
  return useQuery({
    queryKey: ["maintenance-records", filters],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment_item:equipment_items(name, sku)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "__all__") {
        query = query.eq("status", filters.status as "open" | "completed");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch creator emails
      const userIds = [...new Set(data?.map((r) => r.created_by_user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

      return (data || []).map((record) => ({
        ...record,
        creator_email: profileMap.get(record.created_by_user_id) || "Unknown",
      })) as MaintenanceRecord[];
    },
  });
}

export function useMaintenanceRecord(id: string | undefined) {
  return useQuery({
    queryKey: ["maintenance-record", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment_item:equipment_items(name, sku)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", data.created_by_user_id)
        .single();

      return {
        ...data,
        creator_email: profile?.email || "Unknown",
      } as MaintenanceRecord;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      equipment_item_id?: string;
      sku: string;
      maintenance_type: string;
      notes?: string;
      photo_path?: string;
      broken_item_report_id?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("maintenance_records")
        .insert({
          ...record,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Call stub sync
      await syncMaintenanceRecordToExternalSystem(data.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        status: "open" | "completed";
        notes: string;
        completed_at: string;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (updates.status === "completed") {
        await syncMaintenanceRecordToExternalSystem(id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-record", variables.id] });
    },
  });
}

// Photo upload helper
export async function uploadEquipmentHealthPhoto(file: File, folder: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("equipment-health-photos")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("equipment-health-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
