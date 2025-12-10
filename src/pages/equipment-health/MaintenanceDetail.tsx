import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMaintenanceRecord, useUpdateMaintenanceRecord } from "@/hooks/useEquipmentHealth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Wrench, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500 text-white",
  completed: "bg-green-600 text-white",
};

export default function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: record, isLoading } = useMaintenanceRecord(id);
  const updateRecord = useUpdateMaintenanceRecord();

  const [notes, setNotes] = useState<string>("");

  async function handleComplete() {
    if (!id) return;

    try {
      await updateRecord.mutateAsync({
        id,
        updates: {
          status: "completed",
          completed_at: new Date().toISOString(),
          notes: notes || record?.notes || undefined,
        },
      });
      toast({ title: "Maintenance marked as completed" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateNotes() {
    if (!id || !notes.trim()) return;

    try {
      await updateRecord.mutateAsync({
        id,
        updates: { notes },
      });
      toast({ title: "Notes updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
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

  if (!record) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Record not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => navigate("/maintenance")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Record
            </CardTitle>
            <Badge className={STATUS_COLORS[record.status]}>
              {record.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-mono">{record.sku}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipment</p>
              <p>{record.equipment_item?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maintenance Type</p>
              <p>{record.maintenance_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p>{record.creator_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created On</p>
              <p>{format(new Date(record.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
            {record.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Completed On</p>
                <p>{format(new Date(record.completed_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            {record.status === "completed" ? (
              <p className="bg-muted p-3 rounded-md">{record.notes || "No notes"}</p>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={notes || record.notes || ""}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add maintenance notes..."
                  rows={4}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateNotes}
                  disabled={!notes.trim() || updateRecord.isPending}
                >
                  Save Notes
                </Button>
              </div>
            )}
          </div>

          {/* Photo */}
          {record.photo_path && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Photo</p>
              <a href={record.photo_path} target="_blank" rel="noopener noreferrer">
                <img
                  src={record.photo_path}
                  alt="Maintenance"
                  className="max-w-full max-h-64 rounded-md border border-border object-cover"
                />
              </a>
            </div>
          )}

          {/* Complete Action */}
          {record.status === "open" && (
            <div className="border-t border-border pt-4">
              <Button
                onClick={handleComplete}
                disabled={updateRecord.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateRecord.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Mark as Completed
              </Button>
            </div>
          )}

          {record.broken_item_report_id && (
            <div className="border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/broken-items/${record.broken_item_report_id}`)}
              >
                View Related Broken Item Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
