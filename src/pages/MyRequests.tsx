import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRequestEvents } from "@/hooks/useRequestEvents";
import { RequestEventTimeline } from "@/components/RequestEventTimeline";

interface LineItem {
  id: string;
  equipment_id: string;
  quantity: number;
  reason: string;
  approval_status: string;
  decline_reason: string | null;
  equipment_items: {
    name: string;
    sku: string;
    category: string;
  };
}

interface Request {
  id: string;
  status: string;
  opx_status: string;
  ops_area: string;
  hub: string;
  required_by_date: string;
  created_at: string;
  rationale: string | null;
  notes: string | null;
  line_items: LineItem[];
}

// Component for history panel with its own event fetching
function RequestHistoryPanel({ requestId }: { requestId: string }) {
  const { data: events, isLoading } = useRequestEvents(requestId);
  return <RequestEventTimeline events={events || []} isLoading={isLoading} />;
}

export default function MyRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("equipment_requests")
      .select(`
        *,
        equipment_request_line_items (
          id,
          equipment_id,
          quantity,
          reason,
          approval_status,
          decline_reason,
          equipment_items (
            name,
            sku,
            category
          )
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const formatted = data?.map((req: any) => ({
        id: req.id,
        status: req.status,
        opx_status: req.opx_status,
        ops_area: req.ops_area || req.delivery_region || "N/A",
        hub: req.hub || "N/A",
        required_by_date: req.required_by_date,
        created_at: req.created_at,
        rationale: req.rationale,
        notes: req.notes,
        line_items: req.equipment_request_line_items || [],
      }));
      setRequests(formatted || []);
    }
  };

  const toggleExpand = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const toggleHistory = (requestId: string) => {
    const newHistoryOpen = new Set(historyOpen);
    if (newHistoryOpen.has(requestId)) {
      newHistoryOpen.delete(requestId);
    } else {
      newHistoryOpen.add(requestId);
    }
    setHistoryOpen(newHistoryOpen);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
      case "pending_opx":
        return "secondary";
      case "approved":
      case "opx_approved":
        return "default";
      case "rejected":
      case "opx_rejected":
        return "destructive";
      case "fulfilled":
        return "outline";
      case "in_transit":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDisplayStatus = (request: Request) => {
    if (request.opx_status === "pending_opx") return "Pending OPX Review";
    if (request.opx_status === "opx_approved") return "Approved by OPX";
    if (request.opx_status === "opx_rejected") return "Rejected by OPX";
    return request.status;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Requests</h1>
        <p className="text-muted-foreground">View your equipment request history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No requests found
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(request.id)}
                          >
                            {expandedRequests.has(request.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <h3 className="font-semibold font-mono">
                            #{request.id.slice(0, 8)}
                          </h3>
                          <Badge variant={getStatusVariant(request.opx_status || request.status)}>
                            {getDisplayStatus(request)}
                          </Badge>
                        </div>
                        <div className="ml-10 text-sm text-muted-foreground space-y-1">
                          <p>Ops Area: {request.ops_area} → {request.hub}</p>
                          <p>
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <p>
                            Required By: {request.required_by_date}
                          </p>
                          <p>Items: {request.line_items.length}</p>
                          {request.rationale && (
                            <p className="mt-2">
                              <span className="font-medium">Rationale:</span> {request.rationale}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedRequests.has(request.id) && (
                      <div className="mt-4 ml-10 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {request.line_items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.equipment_items.name}
                                </TableCell>
                                <TableCell>{item.equipment_items.sku}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {item.equipment_items.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="max-w-xs">
                                  <p className="text-sm">{item.reason}</p>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusVariant(item.approval_status)}>
                                    {item.approval_status}
                                  </Badge>
                                  {item.decline_reason && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Reason: {item.decline_reason}
                                    </p>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* History Timeline Collapsible */}
                        <Collapsible
                          open={historyOpen.has(request.id)}
                          onOpenChange={() => toggleHistory(request.id)}
                          className="mt-4"
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <History className="h-4 w-4" />
                              {historyOpen.has(request.id) ? "Hide History" : "Show History"}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <RequestHistoryPanel requestId={request.id} />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
