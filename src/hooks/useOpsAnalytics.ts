import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, differenceInHours } from "date-fns";

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  opsArea?: string;
  status?: string;
}

export interface RequestMetrics {
  totalSubmitted: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  rejectionRate: number;
  medianApprovalTimeHours: number | null;
}

export interface IncidentMetrics {
  totalSubmitted: number;
  submitted: number;
  inReview: number;
  closed: number;
}

export interface RequestsByOpsArea {
  ops_area: string;
  pending_opx: number;
  opx_approved: number;
  opx_rejected: number;
  total: number;
}

export interface IncidentsByOpsArea {
  ops_area: string;
  submitted: number;
  in_review: number;
  closed: number;
  total: number;
}

export function useOpsAreas() {
  return useQuery({
    queryKey: ["ops-areas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .order("ops_area");
      
      if (error) throw error;
      return [...new Set(data.map(d => d.ops_area))];
    },
  });
}

export function useRequestMetrics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["request-metrics", filters],
    queryFn: async () => {
      // Fetch requests within date range
      let query = supabase
        .from("equipment_requests")
        .select("id, created_at, opx_status, ops_area")
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString());
      
      if (filters.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      
      const { data: requests, error } = await query;
      if (error) throw error;

      const totalSubmitted = requests?.length || 0;
      const approved = requests?.filter(r => r.opx_status === "opx_approved").length || 0;
      const rejected = requests?.filter(r => r.opx_status === "opx_rejected").length || 0;
      
      // Calculate median approval time from events
      let medianApprovalTimeHours: number | null = null;
      
      if (requests && requests.length > 0) {
        const requestIds = requests.map(r => r.id);
        
        const { data: events } = await supabase
          .from("equipment_request_events")
          .select("request_id, event_type, created_at")
          .in("request_id", requestIds)
          .in("event_type", ["created", "approved"]);
        
        if (events && events.length > 0) {
          const approvalTimes: number[] = [];
          
          const eventsByRequest = events.reduce((acc, evt) => {
            if (!acc[evt.request_id]) acc[evt.request_id] = [];
            acc[evt.request_id].push(evt);
            return acc;
          }, {} as Record<string, typeof events>);
          
          Object.values(eventsByRequest).forEach(reqEvents => {
            const created = reqEvents.find(e => e.event_type === "created");
            const approved = reqEvents.find(e => e.event_type === "approved");
            
            if (created && approved) {
              const hours = differenceInHours(
                new Date(approved.created_at),
                new Date(created.created_at)
              );
              approvalTimes.push(hours);
            }
          });
          
          if (approvalTimes.length > 0) {
            approvalTimes.sort((a, b) => a - b);
            const mid = Math.floor(approvalTimes.length / 2);
            medianApprovalTimeHours = approvalTimes.length % 2 !== 0
              ? approvalTimes[mid]
              : (approvalTimes[mid - 1] + approvalTimes[mid]) / 2;
          }
        }
      }

      return {
        totalSubmitted,
        approved,
        rejected,
        approvalRate: totalSubmitted > 0 ? (approved / totalSubmitted) * 100 : 0,
        rejectionRate: totalSubmitted > 0 ? (rejected / totalSubmitted) * 100 : 0,
        medianApprovalTimeHours,
      } as RequestMetrics;
    },
  });
}

export function useIncidentMetrics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["incident-metrics", filters],
    queryFn: async () => {
      let query = supabase
        .from("van_incidents")
        .select("id, status, ops_area")
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString());
      
      if (filters.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      return {
        totalSubmitted: data?.length || 0,
        submitted: data?.filter(i => i.status === "submitted").length || 0,
        inReview: data?.filter(i => i.status === "in_review").length || 0,
        closed: data?.filter(i => i.status === "closed").length || 0,
      } as IncidentMetrics;
    },
  });
}

export function useRequestsByOpsArea(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["requests-by-ops-area", filters],
    queryFn: async () => {
      let query = supabase
        .from("equipment_requests")
        .select("ops_area, opx_status")
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString());
      
      if (filters.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      // Group by ops_area
      const grouped = (data || []).reduce((acc, req) => {
        const area = req.ops_area || "Unknown";
        if (!acc[area]) {
          acc[area] = { pending_opx: 0, opx_approved: 0, opx_rejected: 0 };
        }
        if (req.opx_status === "pending_opx") acc[area].pending_opx++;
        else if (req.opx_status === "opx_approved") acc[area].opx_approved++;
        else if (req.opx_status === "opx_rejected") acc[area].opx_rejected++;
        return acc;
      }, {} as Record<string, { pending_opx: number; opx_approved: number; opx_rejected: number }>);

      return Object.entries(grouped).map(([ops_area, counts]) => ({
        ops_area,
        ...counts,
        total: counts.pending_opx + counts.opx_approved + counts.opx_rejected,
      })) as RequestsByOpsArea[];
    },
  });
}

export function useIncidentsByOpsArea(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ["incidents-by-ops-area", filters],
    queryFn: async () => {
      let query = supabase
        .from("van_incidents")
        .select("ops_area, status")
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString());
      
      if (filters.opsArea) {
        query = query.eq("ops_area", filters.opsArea);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      // Group by ops_area
      const grouped = (data || []).reduce((acc, incident) => {
        const area = incident.ops_area || "Unknown";
        if (!acc[area]) {
          acc[area] = { submitted: 0, in_review: 0, closed: 0 };
        }
        if (incident.status === "submitted") acc[area].submitted++;
        else if (incident.status === "in_review") acc[area].in_review++;
        else if (incident.status === "closed") acc[area].closed++;
        return acc;
      }, {} as Record<string, { submitted: number; in_review: number; closed: number }>);

      return Object.entries(grouped).map(([ops_area, counts]) => ({
        ops_area,
        ...counts,
        total: counts.submitted + counts.in_review + counts.closed,
      })) as IncidentsByOpsArea[];
    },
  });
}
