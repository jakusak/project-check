import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "@/hooks/use-toast";

export interface VanIncident {
  id: string;
  created_at: string;
  created_by_user_id: string;
  ops_area: string;
  trip_id: string | null;
  van_id: string;
  license_plate: string;
  vin: string;
  incident_date: string;
  incident_time: string;
  location_text: string;
  weather: string;
  description: string;
  status: "submitted" | "in_review" | "closed";
  ops_admin_user_id: string | null;
  internal_notes: string | null;
  updated_at: string;
  creator?: { full_name: string | null; email: string | null };
}

export interface VanIncidentFile {
  id: string;
  created_at: string;
  incident_id: string;
  file_path: string;
  file_type: string;
  file_name: string;
}

export interface CreateIncidentData {
  ops_area: string;
  trip_id?: string;
  van_id: string;
  license_plate: string;
  vin: string;
  incident_date: string;
  incident_time: string;
  location_text: string;
  weather: string;
  description: string;
}

// Placeholder function for future notification integration
export function notifyOpsAdminForIncident(incidentId: string): void {
  // TODO: Implement notification to OPS Admin when incident is submitted
  // This will be wired to email/push notification system later
  console.log(`[Placeholder] Would notify OPS Admin for incident: ${incidentId}`);
}

export function useVanIncidents(filters?: {
  dateFrom?: string;
  dateTo?: string;
  opsArea?: string;
  status?: string;
}) {
  const { user, isAdmin, isOPX } = useAuth();

  return useQuery({
    queryKey: ["van-incidents", filters],
    queryFn: async () => {
      let query = supabase
        .from("van_incidents")
        .select(`
          *,
          creator:profiles!van_incidents_created_by_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte("incident_date", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("incident_date", filters.dateTo);
      }
      if (filters?.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      if (filters?.status && (filters.status === "submitted" || filters.status === "in_review" || filters.status === "closed")) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VanIncident[];
    },
    enabled: !!user,
  });
}

export function useVanIncident(id: string) {
  return useQuery({
    queryKey: ["van-incident", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("van_incidents")
        .select(`
          *,
          creator:profiles!van_incidents_created_by_user_id_fkey(full_name, email)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as VanIncident | null;
    },
    enabled: !!id,
  });
}

export function useIncidentFiles(incidentId: string) {
  return useQuery({
    queryKey: ["incident-files", incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("van_incident_files")
        .select("*")
        .eq("incident_id", incidentId);
      if (error) throw error;
      return data as VanIncidentFile[];
    },
    enabled: !!incidentId,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: incident, error } = await supabase
        .from("van_incidents")
        .insert({
          ...data,
          created_by_user_id: user.id,
          status: "submitted",
        })
        .select()
        .single();

      if (error) throw error;
      
      // Call placeholder notification function
      notifyOpsAdminForIncident(incident.id);
      
      return incident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      toast({ title: "Incident report submitted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit incident report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadIncidentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      file,
    }: {
      incidentId: string;
      file: File;
    }) => {
      const fileExt = file.name.split(".").pop();
      const filePath = `${incidentId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("incident-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file metadata
      const { data, error } = await supabase
        .from("van_incident_files")
        .insert({
          incident_id: incidentId,
          file_path: filePath,
          file_type: file.type,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incident-files", variables.incidentId],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload file",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      internal_notes,
      ops_admin_user_id,
    }: {
      id: string;
      status?: "submitted" | "in_review" | "closed";
      internal_notes?: string;
      ops_admin_user_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("van_incidents")
        .update({ status, internal_notes, ops_admin_user_id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["van-incident", data.id] });
      toast({ title: "Incident updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update incident",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
