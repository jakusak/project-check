import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { SupplyRequest } from "@/hooks/useSupplyRequests";
import { toast } from "sonner";

interface Props {
  request: SupplyRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HORIZONS = [
  { value: "unassigned", label: "Inbox (Unassigned)" },
  { value: "weekly", label: "This Week" },
  { value: "long_term", label: "Long-Term" },
];

export function SupplyRequestEditDialog({ request, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [status, setStatus] = useState<string>("open");
  const [horizon, setHorizon] = useState<string>("unassigned");
  const [requestedBy, setRequestedBy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setItems(request.items);
      setQuantity(request.quantity);
      setNotes(request.notes ?? "");
      setPriority(request.priority);
      setStatus(request.status);
      setHorizon(request.planning_horizon ?? "unassigned");
      setRequestedBy(request.requested_by);
    }
  }, [request]);

  if (!request) return null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("supply_requests")
      .update({
        title,
        items,
        quantity,
        notes: notes || null,
        priority: priority as any,
        status: status as any,
        planning_horizon: horizon === "unassigned" ? null : horizon,
        requested_by: requestedBy,
      } as any)
      .eq("id", request.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update: " + error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["supply-requests"] });
    toast.success("Supply request updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Supply Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Items</Label>
            <Textarea rows={2} value={items} onChange={(e) => setItems(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Requested By</Label>
              <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horizon</Label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HORIZONS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context, decisions…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
