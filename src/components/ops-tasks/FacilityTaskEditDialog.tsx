import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OpsTask, useOpsTeamMembers, useUpdateOpsTask } from "@/hooks/useOpsTasks";

interface Props {
  task: OpsTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HORIZONS = [
  { value: "unassigned", label: "Inbox (Unassigned)" },
  { value: "weekly", label: "This Week" },
  { value: "long_term", label: "Long-Term Project" },
];

export function FacilityTaskEditDialog({ task, open, onOpenChange }: Props) {
  const { data: members = [] } = useOpsTeamMembers();
  const updateTask = useUpdateOpsTask();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [horizon, setHorizon] = useState<string>("unassigned");
  const [ownerId, setOwnerId] = useState<string>("none");
  const [priority, setPriority] = useState<string>("medium");
  const [targetDate, setTargetDate] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setHorizon(task.planning_horizon ?? "unassigned");
      setOwnerId(task.main_owner_id ?? "none");
      setPriority(task.priority);
      setTargetDate(task.target_end_date ?? "");
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    updateTask.mutate(
      {
        id: task.id,
        updates: {
          title,
          notes: notes || null,
          planning_horizon: horizon === "unassigned" ? null : horizon,
          main_owner_id: ownerId === "none" ? null : ownerId,
          priority: priority as any,
          target_end_date: targetDate || null,
        } as any,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Restrict owner choices to Steve / Fabian / Sasha when present
  const preferredNames = ["steve", "fabian", "sasha"];
  const ownerOptions = members
    .filter((m) => preferredNames.some((n) => m.name.toLowerCase().includes(n)))
    .concat(members.filter((m) => !preferredNames.some((n) => m.name.toLowerCase().includes(n))));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Facility Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ft-title">Title</Label>
            <Input id="ft-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {ownerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Planning Horizon</Label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HORIZONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ft-date">Target End Date</Label>
              <Input id="ft-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="ft-notes">Notes</Label>
            <Textarea
              id="ft-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes, context, decisions..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>
            {updateTask.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
