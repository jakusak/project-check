import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOpsTask, useOpsTeamMembers, CATEGORY_LABELS, UI_STATUSES, UI_STATUS_LABELS, OpsTaskCategory, OpsTaskPriority, OpsTaskStatus, OpsRecurringFrequency } from "@/hooks/useOpsTasks";
import { ArrowLeft } from "lucide-react";

export default function OpsNewTask() {
  const navigate = useNavigate();
  const createTask = useCreateOpsTask();
  const { data: members = [] } = useOpsTeamMembers();

  const [form, setForm] = useState({
    title: "", description: "", category: "other" as OpsTaskCategory, priority: "medium" as OpsTaskPriority,
    status: "planned" as OpsTaskStatus, requested_by: "", main_owner_id: "",
    other_owner_id: "", location: "", requested_due_date: "", start_date: "",
    target_end_date: "", planned_week: "", planned_month: "", estimated_hours: "",
    recurring_frequency: "none" as OpsRecurringFrequency, definition_of_done: "", work_type: "manual",
    task_mode: "operational", notes: "",
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const payload: any = {
      ...form,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      main_owner_id: form.main_owner_id || null,
      other_owner_id: form.other_owner_id || null,
      requested_due_date: form.requested_due_date || null,
      start_date: form.start_date || null,
      target_end_date: form.target_end_date || null,
      planned_week: form.planned_week || null,
      planned_month: form.planned_month || null,
      definition_of_done: form.definition_of_done || null,
      description: form.description || null,
      location: form.location || null,
      notes: form.notes || null,
      requested_by: form.requested_by || null,
    };

    createTask.mutate(payload, { onSuccess: () => navigate("/ops-tasks") });
  };

  const OwnerSelect = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={(form as any)[field] || "none"} onValueChange={v => set(field, v === "none" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— None —</SelectItem>
          {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Internal Task</CardTitle>
          <p className="text-sm text-muted-foreground">Full task form for the ops team to plan and track work.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => set("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UI_STATUSES.map(s => <SelectItem key={s} value={s}>{UI_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ownership */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Ownership</h3>
              <div className="grid grid-cols-2 gap-4">
                <OwnerSelect label="Main Owner (Oversees)" field="main_owner_id" />
                <OwnerSelect label="Secondary Owner (Executes)" field="other_owner_id" />
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Scheduling</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
                <div className="space-y-2"><Label>Target End Date</Label><Input type="date" value={form.target_end_date} onChange={e => set("target_end_date", e.target.value)} /></div>
                <div className="space-y-2"><Label>Requested Due Date</Label><Input type="date" value={form.requested_due_date} onChange={e => set("requested_due_date", e.target.value)} /></div>
                <div className="space-y-2"><Label>Planned Week</Label><Input value={form.planned_week} onChange={e => set("planned_week", e.target.value)} placeholder="e.g. 2026-W12" /></div>
                <div className="space-y-2"><Label>Planned Month</Label><Input value={form.planned_month} onChange={e => set("planned_month", e.target.value)} placeholder="e.g. March" /></div>
                <div className="space-y-2"><Label>Estimated Hours</Label><Input type="number" value={form.estimated_hours} onChange={e => set("estimated_hours", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Recurring</Label>
                  <Select value={form.recurring_frequency} onValueChange={v => set("recurring_frequency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem><SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => set("location", e.target.value)} /></div>
              </div>
            </div>

            {/* Classification */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Classification</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Requested By</Label><Input value={form.requested_by} onChange={e => set("requested_by", e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Work Type</Label>
                  <Select value={form.work_type} onValueChange={v => set("work_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Task Mode</Label>
                  <Select value={form.task_mode} onValueChange={v => set("task_mode", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="strategic">Strategic</SelectItem><SelectItem value="operational">Operational</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Completion */}
            <div className="space-y-4">
              <div className="space-y-2"><Label>Definition of Done</Label><Textarea value={form.definition_of_done} onChange={e => set("definition_of_done", e.target.value)} rows={2} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createTask.isPending || !form.title}>{createTask.isPending ? "Creating..." : "Create Task"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
