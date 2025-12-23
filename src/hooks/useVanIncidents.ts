import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface LDDraftContent {
  incident_overview: {
    report_id: string;
    driver_email: string;
    ops_area: string;
    van_id: string;
    date_time: string;
    location: string;
  };
  incident_summary: string;
  reported_damage: string;
  ai_damage_review: {
    damaged_components: string[];
    severity: string;
    repair_complexity: string;
    cost_bucket: string;
    cost_range: string;
    notes: string;
  };
  consequence_guidance: {
    cost_tier: string;
    incident_number: string;
    suggested_consequences: string;
    performance_points_impact: string;
    additional_measures: string;
  };
  incident_history_flag: string;
  attachments: string[];
  open_items: string[];
}

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
  email_sent_at: string | null;
  ld_communication_status: "not_sent" | "in_progress" | "completed";
  fs_communication_status: "sent" | "not_sent";
  // AI and LD fields
  ai_cost_bucket: string | null;
  ai_severity: string | null;
  ai_confidence: string | null;
  ai_damaged_components: string[] | null;
  ai_analysis_notes: string | null;
  ld_draft_status: string;
  ld_draft_content: LDDraftContent | Record<string, unknown> | null;
  ld_draft_generated_at: string | null;
  ld_email_sent_at: string | null;
  driver_incident_count_this_season: number;
  vehicle_drivable: boolean | null;
  was_towed: boolean | null;
  // LD Review fields
  ld_review_status: "pending" | "approved" | "needs_revision" | null;
  ld_review_comment: string | null;
  ld_reviewed_by: string | null;
  ld_reviewed_at: string | null;
  ld_preventability_decision: "preventable" | "non_preventable" | null;
  // OPS Email fields
  ops_email_sent_at: string | null;
  ops_email_sent_by: string | null;
  final_email_content: Record<string, unknown> | null;
  // Relations
  creator?: { full_name: string | null; email: string | null };
  ld_reviewer?: { full_name: string | null; email: string | null };
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

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .maybeSingle();

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
      
      // Send confirmation email via edge function
      if (profile?.email) {
        try {
          await supabase.functions.invoke("send-incident-confirmation", {
            body: {
              incidentId: incident.id,
              userEmail: profile.email,
              userName: profile.full_name || "",
              vanId: data.van_id,
              incidentDate: data.incident_date,
              opsArea: data.ops_area,
            },
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the mutation if email fails
        }
      }
      
      // Call placeholder notification function
      notifyOpsAdminForIncident(incident.id);
      
      // Trigger AI damage analysis
      try {
        await supabase.functions.invoke("analyze-incident-damage", {
          body: { incident_id: incident.id },
        });
        console.log("AI damage analysis triggered for incident:", incident.id);
      } catch (analysisError) {
        console.error("Failed to trigger AI analysis:", analysisError);
        // Don't fail the mutation if analysis fails
      }
      
      return incident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["ld-incidents"] });
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
      ld_communication_status,
      fs_communication_status,
    }: {
      id: string;
      status?: "submitted" | "in_review" | "closed";
      internal_notes?: string;
      ops_admin_user_id?: string;
      ld_communication_status?: "not_sent" | "in_progress" | "completed";
      fs_communication_status?: "sent" | "not_sent";
    }) => {
      const updateData: Record<string, any> = {};
      if (status !== undefined) updateData.status = status;
      if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
      if (ops_admin_user_id !== undefined) updateData.ops_admin_user_id = ops_admin_user_id;
      if (ld_communication_status !== undefined) updateData.ld_communication_status = ld_communication_status;
      if (fs_communication_status !== undefined) updateData.fs_communication_status = fs_communication_status;

      const { data, error } = await supabase
        .from("van_incidents")
        .update(updateData)
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
      queryClient.invalidateQueries({ queryKey: ["ld-incidents"] });
      toast({
        title: "Failed to update incident",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLDReviewIncident() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      ld_review_status,
      ld_review_comment,
      ld_preventability_decision,
    }: {
      id: string;
      ld_review_status: "approved" | "needs_revision";
      ld_review_comment?: string;
      ld_preventability_decision?: "preventable" | "non_preventable";
    }) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = {
        ld_review_status,
        ld_reviewed_by: user.id,
        ld_reviewed_at: new Date().toISOString(),
      };
      
      if (ld_review_comment !== undefined) updateData.ld_review_comment = ld_review_comment;
      if (ld_preventability_decision !== undefined) updateData.ld_preventability_decision = ld_preventability_decision;
      
      // If approved, update ld_draft_status to reflect LD has approved
      if (ld_review_status === "approved") {
        updateData.ld_draft_status = "reviewed";
      }

      const { data, error } = await supabase
        .from("van_incidents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["van-incident", data.id] });
      toast({ title: "LD review submitted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendOPSEmail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      final_email_content,
    }: {
      id: string;
      final_email_content: Json;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get incident details for recipient info
      const { data: incident, error: fetchError } = await supabase
        .from("van_incidents")
        .select(`
          *,
          creator:profiles!van_incidents_created_by_user_id_fkey(full_name, email)
        `)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const emailContent = final_email_content as { subject?: string; body?: string };
      const recipientEmail = incident.creator?.email;
      const recipientName = incident.creator?.full_name || "Team Member";

      if (!recipientEmail) {
        throw new Error("Could not find recipient email address");
      }

      // Call edge function to actually send the email via Resend
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        "send-ops-final-email",
        {
          body: {
            incidentId: id,
            recipientEmail,
            recipientName,
            emailSubject: emailContent.subject || `Van Incident Update - ${incident.van_id}`,
            emailBody: emailContent.body || "",
          },
        }
      );

      if (emailError) {
        console.error("Email function error:", emailError);
        throw new Error(emailError.message || "Failed to send email");
      }

      if (emailResult?.error) {
        console.error("Email send error:", emailResult.error);
        throw new Error(emailResult.error);
      }

      // Update local record with email content
      const { data, error } = await supabase
        .from("van_incidents")
        .update({
          ops_email_sent_at: new Date().toISOString(),
          ops_email_sent_by: user.id,
          final_email_content,
          fs_communication_status: "sent",
          ld_draft_status: "sent",
          status: "closed",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["van-incident", data.id] });
      toast({ title: "Email sent to field staff" });
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRegenerateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const { data, error } = await supabase.functions.invoke("analyze-incident-damage", {
        body: { incident_id: incidentId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["van-incidents"] });
      toast({ title: "Analysis regenerated" });
    },
    onError: (error) => {
      toast({ title: "Failed to regenerate", description: error.message, variant: "destructive" });
    },
  });
}
