import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCycleCountDetail,
  useCycleCountEvents,
  useValidateCycleCount,
  useRejectCycleCount,
  getCycleCountPhotoUrl,
} from "@/hooks/useCycleCounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Image } from "lucide-react";

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  submitted: "secondary",
  validated: "default",
  rejected: "destructive",
};

export default function CycleCountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cycleCount, isLoading } = useCycleCountDetail(id);
  const { data: events } = useCycleCountEvents(id);
  const validateMutation = useValidateCycleCount();
  const rejectMutation = useRejectCycleCount();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading...</div>
    );
  }
  
  if (!cycleCount) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cycle count not found
      </div>
    );
  }
  
  const handleValidate = async () => {
    try {
      await validateMutation.mutateAsync({ id: cycleCount.id });
      toast.success("Cycle count validated");
    } catch (error) {
      toast.error("Failed to validate cycle count");
    }
  };
  
  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast.error("Please provide a rejection note");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: cycleCount.id, note: rejectNote });
      toast.success("Cycle count rejected");
      setRejectDialogOpen(false);
    } catch (error) {
      toast.error("Failed to reject cycle count");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Cycle Count Details</h1>
          <p className="text-muted-foreground">
            {cycleCount.location_name} • {cycleCount.ops_area}
          </p>
        </div>
        <Badge variant={statusVariants[cycleCount.status]} className="text-base px-3 py-1">
          {cycleCount.status.charAt(0).toUpperCase() + cycleCount.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submitted By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{cycleCount.creator_email}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(cycleCount.created_at), "MMM d, yyyy HH:mm")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ops Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{cycleCount.ops_area}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{cycleCount.location_name}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({cycleCount.lines?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Photo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleCount.lines?.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.sku}</TableCell>
                  <TableCell>{line.equipment_name || "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {line.recorded_qty}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {line.notes || "—"}
                  </TableCell>
                  <TableCell>
                    {line.photo_path ? (
                      <button
                        onClick={() =>
                          setPhotoPreview(getCycleCountPhotoUrl(line.photo_path!))
                        }
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Image className="h-4 w-4" />
                        View
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {events && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 text-sm border-l-2 border-muted pl-4 py-1"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {event.event_type.charAt(0).toUpperCase() +
                        event.event_type.slice(1)}
                    </p>
                    {event.event_notes && (
                      <p className="text-muted-foreground">{event.event_notes}</p>
                    )}
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>{event.actor_email}</p>
                    <p>{format(new Date(event.created_at), "MMM d, HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {cycleCount.status === "submitted" && (
        <div className="flex justify-end gap-4">
          <Button
            variant="destructive"
            onClick={() => setRejectDialogOpen(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleValidate} disabled={validateMutation.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {validateMutation.isPending ? "Validating..." : "Validate"}
          </Button>
        </div>
      )}
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Cycle Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please provide a reason for rejection:
            </p>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Photo Preview Dialog */}
      <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Cycle count photo"
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
