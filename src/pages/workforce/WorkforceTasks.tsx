import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  useWorkforceRoles,
  useWorkforceTasks,
  useCreateWorkforceTask,
  useUpdateWorkforceTask,
  useDeleteWorkforceTask,
  WorkforceTask,
  MONTH_NAMES,
  RECURRENCE_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/hooks/useWorkforcePlanning";

const EMPTY_TASK = {
  name: "", description: "", category: "general", department: "operations",
  assigned_role_id: "", estimated_hours_per_month: 0, recurrence_type: "monthly",
  active_months: [1,2,3,4,5,6,7,8,9,10,11,12] as number[],
  priority: "medium", skill_tags: [] as string[], is_reassignable: true,
  deadline_sensitivity: "low", notes: "",
};

export default function WorkforceTasks() {
  const navigate = useNavigate();
  const { data: roles = [] } = useWorkforceRoles();
  const { data: tasks = [], isLoading } = useWorkforceTasks();
  const createTask = useCreateWorkforceTask();
  const updateTask = useUpdateWorkforceTask();
  const deleteTask = useDeleteWorkforceTask();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterReassignable, setFilterReassignable] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkforceTask | null>(null);
  const [form, setForm] = useState(EMPTY_TASK);

  const filtered = tasks.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole !== "all" && t.assigned_role_id !== filterRole) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterReassignable === "yes" && !t.is_reassignable) return false;
    if (filterReassignable === "no" && t.is_reassignable) return false;
    return true;
  });

  const openCreate = () => { setEditingTask(null); setForm(EMPTY_TASK); setFormOpen(true); };
  const openEdit = (t: WorkforceTask) => {
    setEditingTask(t);
    setForm({
      name: t.name, description: t.description || "", category: t.category || "general",
      department: t.department, assigned_role_id: t.assigned_role_id || "",
      estimated_hours_per_month: t.estimated_hours_per_month, recurrence_type: t.recurrence_type,
      active_months: t.active_months, priority: t.priority,
      skill_tags: t.skill_tags || [], is_reassignable: t.is_reassignable,
      deadline_sensitivity: t.deadline_sensitivity || "low", notes: t.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      assigned_role_id: form.assigned_role_id || null,
      description: form.description || null,
      notes: form.notes || null,
      skill_tags: form.skill_tags.length ? form.skill_tags : null,
    };
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, updates: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createTask.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const toggleMonth = (month: number) => {
    setForm(f => ({
      ...f,
      active_months: f.active_months.includes(month)
        ? f.active_months.filter(m => m !== month)
        : [...f.active_months, month].sort((a, b) => a - b),
    }));
  };

  const priorityColor: Record<string, string> = {
    low: "bg-slate-100 text-slate-700", medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/workforce/capacity")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Task Allocation Table</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} of {tasks.length} tasks</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterReassignable} onValueChange={setFilterReassignable}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Reassignable" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Reassignable</SelectItem>
            <SelectItem value="no">Not Reassignable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Task</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Hours/mo</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Active Months</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reassignable</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No tasks found</TableCell></TableRow>
                ) : filtered.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.name}</div>
                      {task.description && <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>}
                    </TableCell>
                    <TableCell>
                      {task.assigned_role ? (
                        <Badge variant="outline">{task.assigned_role.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell><span className="text-sm capitalize">{task.category?.replace(/_/g, " ")}</span></TableCell>
                    <TableCell className="font-mono text-sm">{task.estimated_hours_per_month}h</TableCell>
                    <TableCell><span className="text-sm capitalize">{task.recurrence_type.replace(/_/g, " ")}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {MONTH_NAMES.map((m, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded-sm text-[9px] flex items-center justify-center ${
                              task.active_months.includes(i + 1)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                            title={m}
                          >
                            {m[0]}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={priorityColor[task.priority] || ""}>{task.priority}</Badge></TableCell>
                    <TableCell>{task.is_reassignable ? <Badge variant="outline" className="text-green-700">Yes</Badge> : <Badge variant="outline" className="text-red-700">No</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Task Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div>
                <Label>Assigned Role</Label>
                <Select value={form.assigned_role_id || "unassigned"} onValueChange={v => setForm(f => ({ ...f, assigned_role_id: v === "unassigned" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}{r.assigned_person_name ? ` (${r.assigned_person_name})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Estimated Hours / Month *</Label><Input type="number" value={form.estimated_hours_per_month} onChange={e => setForm(f => ({ ...f, estimated_hours_per_month: Number(e.target.value) }))} /></div>
              <div>
                <Label>Recurrence</Label>
                <Select value={form.recurrence_type} onValueChange={v => setForm(f => ({ ...f, recurrence_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline Sensitivity</Label>
                <Select value={form.deadline_sensitivity} onValueChange={v => setForm(f => ({ ...f, deadline_sensitivity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Months */}
            <div>
              <Label>Active Months</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {MONTH_NAMES.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleMonth(i + 1)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      form.active_months.includes(i + 1)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setForm(f => ({ ...f, active_months: [1,2,3,4,5,6,7,8,9,10,11,12] }))}>All</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => setForm(f => ({ ...f, active_months: [5,6,7,8,9] }))}>Summer</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => setForm(f => ({ ...f, active_months: [1,4,7,10] }))}>Quarterly</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => setForm(f => ({ ...f, active_months: [] }))}>None</Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_reassignable} onCheckedChange={v => setForm(f => ({ ...f, is_reassignable: v }))} />
              <Label>Can be reassigned to another role</Label>
            </div>

            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>

            <Button onClick={handleSave} disabled={!form.name || createTask.isPending || updateTask.isPending} className="w-full">
              {editingTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
