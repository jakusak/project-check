import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Truck, 
  MessageSquare, 
  Package,
  Ban
} from "lucide-react";
import type { RequestEvent, EventType } from "@/hooks/useRequestEvents";

interface RequestEventTimelineProps {
  events: RequestEvent[];
  isLoading?: boolean;
}

const EVENT_CONFIG: Record<EventType, { icon: React.ReactNode; color: string; label: string }> = {
  created: { icon: <Clock className="h-4 w-4" />, color: "bg-blue-500", label: "Created" },
  approved: { icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-500", label: "Approved" },
  rejected: { icon: <XCircle className="h-4 w-4" />, color: "bg-red-500", label: "Rejected" },
  modified: { icon: <Edit className="h-4 w-4" />, color: "bg-yellow-500", label: "Modified" },
  fulfilled: { icon: <Package className="h-4 w-4" />, color: "bg-emerald-500", label: "Fulfilled" },
  shipped: { icon: <Truck className="h-4 w-4" />, color: "bg-indigo-500", label: "Shipped" },
  comment: { icon: <MessageSquare className="h-4 w-4" />, color: "bg-gray-500", label: "Comment" },
  cancelled: { icon: <Ban className="h-4 w-4" />, color: "bg-gray-700", label: "Cancelled" },
};

export function RequestEventTimeline({ events, isLoading }: RequestEventTimelineProps) {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4">Loading history...</div>;
  }

  if (!events || events.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No history available</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type as EventType] || EVENT_CONFIG.comment;
        
        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white`}>
                {config.icon}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2" />
              )}
            </div>
            
            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{config.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">by </span>
                <span className="font-medium">{event.actor_email}</span>
              </p>
              
              {event.event_notes && (
                <p className="text-sm mt-2 p-2 bg-muted rounded-md">{event.event_notes}</p>
              )}
              
              {/* Show quantity changes for modified events */}
              {event.event_type === 'modified' && event.old_values && event.new_values && (
                <div className="text-xs mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium mb-1">Quantity changes:</p>
                  {Object.keys(event.new_values.quantities || {}).map(itemId => {
                    const oldQty = event.old_values?.quantities?.[itemId];
                    const newQty = event.new_values?.quantities?.[itemId];
                    if (oldQty !== newQty) {
                      return (
                        <p key={itemId} className="text-muted-foreground">
                          Item: {oldQty} → {newQty}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
