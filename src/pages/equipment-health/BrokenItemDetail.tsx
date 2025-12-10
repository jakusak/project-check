import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrokenItemReport, useUpdateBrokenItemReport } from "@/hooks/useEquipmentHealth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Loader2, Wrench, ExternalLink } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-destructive text-destructive-foreground",
  in_maintenance: "bg-yellow-500 text-white",
  resolved: "bg-green-600 text-white",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-destructive text-destructive-foreground",
};

export default function BrokenItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: report, isLoading } = useBrokenItemReport(id);
  const updateReport = useUpdateBrokenItemReport();

  const [newStatus, setNewStatus] = useState<string>("");

  async function handleStatusUpdate() {
    if (!id || !newStatus) return;

    try {
      await updateReport.mutateAsync({
        id,
        updates: { status: newStatus as "open" | "in_maintenance" | "resolved" },
      });
      toast({ title: "Status updated successfully" });
      setNewStatus("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => navigate("/broken-items")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Broken Item Report
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={SEVERITY_COLORS[report.severity]}>
                {report.severity} severity
              </Badge>
              <Badge className={STATUS_COLORS[report.status]}>
                {report.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-mono">{report.sku}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipment</p>
              <p>{report.equipment_item?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operations Area</p>
              <p>{report.ops_area}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p>{report.location_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reported By</p>
              <p>{report.creator_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reported On</p>
              <p>{format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="bg-muted p-3 rounded-md">{report.description}</p>
          </div>

          {/* Photo */}
          {report.photo_path && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Photo</p>
              <a href={report.photo_path} target="_blank" rel="noopener noreferrer">
                <img
                  src={report.photo_path}
                  alt="Broken item"
                  className="max-w-full max-h-64 rounded-md border border-border object-cover"
                />
              </a>
            </div>
          )}

          {/* Admin Actions */}
          <div className="border-t border-border pt-4 space-y-4">
            <h3 className="font-medium">Update Status</h3>
            <div className="flex flex-wrap gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_maintenance">In Maintenance</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateReport.isPending}
              >
                {updateReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </div>

            {/* Create Maintenance Record */}
            {report.status !== "resolved" && (
              <Button
                variant="outline"
                onClick={() => navigate(`/maintenance/new?broken_item_id=${report.id}`)}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Create Maintenance Record
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
