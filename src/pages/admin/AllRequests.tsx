import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Request {
  id: string;
  status: string;
  ops_area: string;
  hub: string;
  required_by_date: string;
  created_at: string;
  line_items_count: number;
}

export default function AllRequests() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("equipment_requests")
      .select(`
        *,
        equipment_request_line_items(count)
      `)
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
        ops_area: req.ops_area || req.delivery_region || "N/A",
        hub: req.hub || "N/A",
        required_by_date: req.required_by_date,
        created_at: req.created_at,
        line_items_count: req.equipment_request_line_items[0]?.count || 0,
      }));
      setRequests(formatted || []);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Requests</h1>
        <p className="text-muted-foreground">Review and approve equipment requisitions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Ops Area</TableHead>
                <TableHead>HUB</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Required By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/request/${request.id}`)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {request.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{request.ops_area}</TableCell>
                    <TableCell>{request.hub}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.line_items_count}</TableCell>
                    <TableCell>
                      {new Date(request.required_by_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
