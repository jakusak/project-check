import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOpsTask, CATEGORY_LABELS, OpsTaskCategory, OpsTaskPriority } from "@/hooks/useOpsTasks";
import { ArrowLeft } from "lucide-react";

export default function OpsQuickRequest() {
  const navigate = useNavigate();
  const createTask = useCreateOpsTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<OpsTaskCategory>("other");
  const [priority, setPriority] = useState<OpsTaskPriority>("medium");
  const [requestedBy, setRequestedBy] = useState("");
  const [location, setLocation] = useState("");
  const [requestedDueDate, setRequestedDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !requestedBy) return;

    createTask.mutate({
      title,
      description: description || null,
      category,
      priority,
      status: "new_request",
      requested_by: requestedBy,
      location: location || null,
      requested_due_date: requestedDueDate || null,
      notes: notes || null,
      task_mode: "facility_request",
    } as any, {
      onSuccess: () => navigate("/ops-tasks/facilities"),
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" />Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Facilities & Building Request</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this form to report building issues or request renovations — including plumbing, electrical, safety hazards, structural defects, or any other facility-related work. The ops team will triage, schedule, and assign.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Replace broken racking in Trailer 14" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work needed..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={v => setCategory(v as OpsTaskCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_LABELS) as [OpsTaskCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={priority} onValueChange={v => setPriority(v as OpsTaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested By *</Label>
              <Input id="requestedBy" value={requestedBy} onChange={e => setRequestedBy(e.target.value)} placeholder="Your name" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Pernes Hub" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Requested Due Date</Label>
                <Input id="dueDate" type="date" value={requestedDueDate} onChange={e => setRequestedDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context..." rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createTask.isPending || !title || !requestedBy}>
                {createTask.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
