import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export type FleetNoticeType = 'speeding' | 'parking' | 'restricted_zone' | 'toll_fine' | 'unknown';
export type FleetNoticeStatus = 'new' | 'needs_review' | 'ready_to_assign' | 'assigned' | 'in_payment' | 'paid' | 'in_dispute' | 'closed' | 'exception';

export interface FleetNotice {
  id: string;
  notice_type: FleetNoticeType;
  status: FleetNoticeStatus;
  country: string | null;
  language_detected: string | null;
  issuing_authority: string | null;
  violation_datetime: string | null;
  violation_location: string | null;
  fine_amount: number | null;
  currency: string | null;
  deadline_date: string | null;
  reference_number: string | null;
  license_plate: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  unit_or_trip_id: string | null;
  received_date: string;
  document_source: string | null;
  confidence_overall: number | null;
  field_confidence_map: Record<string, number> | null;
  raw_extracted_text: string | null;
  notes_internal: string | null;
  tags: string[] | null;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  dispute_date: string | null;
  dispute_reason: string | null;
  dispute_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  vehicle?: FleetVehicle | null;
  driver?: FleetDriver | null;
}

export interface FleetVehicle {
  id: string;
  license_plate: string;
  fleet_type: string;
  vendor: string | null;
  country_base: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FleetDriver {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  country: string | null;
  employment_type: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FleetNoticeFile {
  id: string;
  notice_id: string;
  file_path: string;
  file_type: string;
  file_name: string;
  is_primary: boolean;
  created_at: string;
}

export interface CreateNoticeData {
  notice_type?: FleetNoticeType;
  country?: string;
  issuing_authority?: string;
  violation_datetime?: string;
  violation_location?: string;
  fine_amount?: number;
  currency?: string;
  deadline_date?: string;
  reference_number?: string;
  license_plate?: string;
  vehicle_id?: string;
  driver_id?: string;
  notes_internal?: string;
}

// Fetch all notices with optional filters
export function useFleetNotices(filters?: {
  status?: FleetNoticeStatus[];
  notice_type?: FleetNoticeType[];
  country?: string;
  driver_id?: string;
  vehicle_id?: string;
}) {
  return useQuery({
    queryKey: ["fleet-notices", filters],
    queryFn: async () => {
      let query = supabase
        .from("fleet_notices")
        .select(`
          *,
          vehicle:fleet_vehicles(*),
          driver:fleet_drivers(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }
      if (filters?.notice_type && filters.notice_type.length > 0) {
        query = query.in("notice_type", filters.notice_type);
      }
      if (filters?.country) {
        query = query.eq("country", filters.country);
      }
      if (filters?.driver_id) {
        query = query.eq("driver_id", filters.driver_id);
      }
      if (filters?.vehicle_id) {
        query = query.eq("vehicle_id", filters.vehicle_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FleetNotice[];
    },
  });
}

// Fetch single notice
export function useFleetNotice(id: string) {
  return useQuery({
    queryKey: ["fleet-notice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fleet_notices")
        .select(`
          *,
          vehicle:fleet_vehicles(*),
          driver:fleet_drivers(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as FleetNotice | null;
    },
    enabled: !!id,
  });
}

// Fetch notice files
export function useFleetNoticeFiles(noticeId: string) {
  return useQuery({
    queryKey: ["fleet-notice-files", noticeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fleet_notice_files")
        .select("*")
        .eq("notice_id", noticeId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FleetNoticeFile[];
    },
    enabled: !!noticeId,
  });
}

// Create notice
export function useCreateFleetNotice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateNoticeData) => {
      const { data: notice, error } = await supabase
        .from("fleet_notices")
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log creation
      await supabase.from("fleet_audit_log").insert({
        entity_type: "notice",
        entity_id: notice.id,
        action: "created",
        new_values: data as any,
        actor_user_id: user?.id,
      } as any);

      return notice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-notices"] });
      toast({ title: "Notice created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create notice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update notice
export function useUpdateFleetNotice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateNoticeData> & { status?: FleetNoticeStatus }) => {
      // Get old values for audit
      const { data: oldNotice } = await supabase
        .from("fleet_notices")
        .select("*")
        .eq("id", id)
        .single();

      const { data: notice, error } = await supabase
        .from("fleet_notices")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log update
      await supabase.from("fleet_audit_log").insert({
        entity_type: "notice",
        entity_id: id,
        action: data.status ? "status_changed" : "updated",
        old_values: oldNotice,
        new_values: data,
        actor_user_id: user?.id,
      });

      return notice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fleet-notices"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-notice", variables.id] });
      toast({ title: "Notice updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update notice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Upload notice file
export function useUploadFleetNoticeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noticeId, file, isPrimary = false }: { noticeId: string; file: File; isPrimary?: boolean }) => {
      const fileExt = file.name.split(".").pop();
      const filePath = `${noticeId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("fleet-notices")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("fleet_notice_files")
        .insert({
          notice_id: noticeId,
          file_path: filePath,
          file_type: file.type,
          file_name: file.name,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fleet-notice-files", variables.noticeId] });
      toast({ title: "File uploaded" });
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

// Fetch all vehicles
export function useFleetVehicles() {
  return useQuery({
    queryKey: ["fleet-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fleet_vehicles")
        .select("*")
        .eq("is_active", true)
        .order("license_plate");

      if (error) throw error;
      return data as FleetVehicle[];
    },
  });
}

// Fetch all drivers
export function useFleetDrivers() {
  return useQuery({
    queryKey: ["fleet-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fleet_drivers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as FleetDriver[];
    },
  });
}

// Create driver
export function useCreateFleetDriver() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; email?: string; phone?: string; region?: string; country?: string; employment_type?: string }) => {
      const { data: driver, error } = await supabase
        .from("fleet_drivers")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("fleet_audit_log").insert({
        entity_type: "driver",
        entity_id: driver.id,
        action: "created",
        new_values: data,
        actor_user_id: user?.id,
      });

      return driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-drivers"] });
      toast({ title: "Driver added" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Create vehicle
export function useCreateFleetVehicle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { license_plate: string; fleet_type?: string; vendor?: string; country_base?: string; make?: string; model?: string; year?: number; vin?: string }) => {
      const { data: vehicle, error } = await supabase
        .from("fleet_vehicles")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("fleet_audit_log").insert({
        entity_type: "vehicle",
        entity_id: vehicle.id,
        action: "created",
        new_values: data,
        actor_user_id: user?.id,
      });

      return vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      toast({ title: "Vehicle added" });
    },
    onError: (error) => {
      toast({
        title: "Failed to add vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Dashboard stats
export function useFleetDashboardStats() {
  return useQuery({
    queryKey: ["fleet-dashboard-stats"],
    queryFn: async () => {
      const { data: notices, error } = await supabase
        .from("fleet_notices")
        .select("status, fine_amount, currency, deadline_date, notice_type, country, created_at");

      if (error) throw error;

      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const openStatuses: FleetNoticeStatus[] = ['new', 'needs_review', 'ready_to_assign', 'assigned', 'in_payment', 'in_dispute'];
      
      const openNotices = notices.filter(n => openStatuses.includes(n.status as FleetNoticeStatus));
      const dueSoon = openNotices.filter(n => n.deadline_date && new Date(n.deadline_date) <= in7Days);
      const totalOpenAmount = openNotices.reduce((sum, n) => sum + (n.fine_amount || 0), 0);

      // Group by type
      const byType = notices.reduce((acc, n) => {
        acc[n.notice_type] = (acc[n.notice_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by country
      const byCountry = notices.reduce((acc, n) => {
        if (n.country) {
          acc[n.country] = (acc[n.country] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Monthly trend (last 6 months)
      const monthlyTrend: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = notices.filter(n => n.created_at.startsWith(monthKey)).length;
        monthlyTrend.push({ month: monthKey, count });
      }

      return {
        openNotices: openNotices.length,
        dueSoon: dueSoon.length,
        totalOpenAmount,
        byType,
        byCountry,
        monthlyTrend,
      };
    },
  });
}
