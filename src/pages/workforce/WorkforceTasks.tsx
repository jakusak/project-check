import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2, Edit2, Library } from "lucide-react";
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
  useCreateWorkforceRole,
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

const ALL_HUBS = ["pernes", "tuscany", "czech"];
const HUB_LABELS: Record<string, string> = { pernes: "Pernes", tuscany: "Tuscany", czech: "Czech" };

export default function WorkforceTasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hub = searchParams.get("hub") || "pernes";
  const hubLabel = HUB_LABELS[hub] || hub;
  const { data: roles = [] } = useWorkforceRoles(hub);
  const { data: tasks = [] } = useWorkforceTasks(hub);
  const { data: allTasks = [] } = useWorkforceTasks();
  const createTask = useCreateWorkforceTask();
  const updateTask = useUpdateWorkforceTask();
  const deleteTask = useDeleteWorkforceTask();
  const createRole = useCreateWorkforceRole();

  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", assigned_person_name: "", monthly_capacity_hours: 160, vacation_weeks_per_year: 0, notes: "" });

  const handleSaveRole = () => {
    createRole.mutate(
      { ...roleForm, department: hub, notes: roleForm.notes || null, assigned_person_name: roleForm.assigned_person_name || null },
      { onSuccess: () => { setRoleFormOpen(false); setRoleForm({ name: "", assigned_person_name: "", monthly_capacity_hours: 160, vacation_weeks_per_year: 0, notes: "" }); } }
    );
  };

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState(searchParams.get("role") || "all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterReassignable, setFilterReassignable] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkforceTask | null>(null);
  const [form, setForm] = useState(EMPTY_TASK);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryHubFilter, setLibraryHubFilter] = useState("all");

  const filtered = tasks.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole !== "all" && t.assigned_role_id !== filterRole) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterReassignable === "yes" && !t.is_reassignable) return false;
    if (filterReassignable === "no" && t.is_reassignable) return false;
    return true;
  });

  const otherHubs = ALL_HUBS.filter(h => h !== hub);
  const libraryTasks = allTasks.filter(t => {
    if (!otherHubs.includes(t.department)) return false;
    if (libraryHubFilter !== "all" && t.department !== libraryHubFilter) return false;
    if (librarySearch && !t.name.toLowerCase().includes(librarySearch.toLowerCase()) && !t.description?.toLowerCase().includes(librarySearch.toLowerCase())) return false;
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

  const importFromLibrary = (t: WorkforceTask) => {
    setLibraryOpen(false);
    setEditingTask(null);
    setForm({
      name: t.name,
      description: t.description || "",
      category: t.category || "general",
      department: hub,
      assigned_role_id: "",
      estimated_hours_per_month: t.estimated_hours_per_month,
      recurrence_type: t.recurrence_type,
      active_months: [...t.active_months],
      priority: t.priority,
      skill_tags: t.skill_tags || [],
      is_reassignable: t.is_reassignable,
      deadline_sensitivity: t.deadline_sensitivity || "low",
      notes: t.notes || "",
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
      createTask.mutate({ ...payload, department: hub }, { onSuccess: () => setFormOpen(false) });
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
          <Button variant="ghost" size="icon" onClick={() => navigate(`/workforce/capacity?hub=${hub}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Task Allocation — {hubLabel}</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} of {tasks.length} tasks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setLibrarySearch(""); setLibraryHubFilter("all"); setLibraryOpen(true); }}>
            <Library className="h-4 w-4 mr-1" /> Add from Library
          </Button>
          <Button variant="outline" onClick={() => { setRoleForm({ name: "", assigned_person_name: "", monthly_capacity_hours: 160, vacation_weeks_per_year: 0, notes: "" }); setRoleFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Role
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
        </div>
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

      {/* Library Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Library — Import to {hubLabel}</DialogTitle>
            <p className="text-sm text-muted-foreground">Browse tasks from other hubs and add them to {hubLabel} with custom hours and role assignments.</p>
          </DialogHeader>
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search library..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={libraryHubFilter} onValueChange={setLibraryHubFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hubs</SelectItem>
                {otherHubs.map(h => <SelectItem key={h} value={h}>{HUB_LABELS[h] || h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {libraryTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks found in other hubs. Tasks created in other hubs will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {libraryTasks.map(t => (
                <Card key={t.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => importFromLibrary(t)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        <Badge variant="secondary" className="text-xs">{HUB_LABELS[t.department] || t.department}</Badge>
                        <Badge className={`text-xs ${priorityColor[t.priority] || ""}`}>{t.priority}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{t.estimated_hours_per_month}h/mo</span>
                        <span className="capitalize">{t.recurrence_type.replace(/_/g, " ")}</span>
                        <span className="capitalize">{t.category?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); importFromLibrary(t); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Use
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
      {/* Add Role Dialog */}
      <Dialog open={roleFormOpen} onOpenChange={setRoleFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Role / Job Title *</Label><Input value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ops Coordinator" /></div>
            <div><Label>Assigned Person (optional)</Label><Input value={roleForm.assigned_person_name} onChange={e => setRoleForm(p => ({ ...p, assigned_person_name: e.target.value }))} placeholder="e.g. Steve" /></div>
            <div><Label>Monthly Capacity (hours)</Label><Input type="number" value={roleForm.monthly_capacity_hours} onChange={e => setRoleForm(p => ({ ...p, monthly_capacity_hours: Number(e.target.value) }))} /></div>
            <div><Label>Vacation Weeks / Year</Label><Input type="number" min={0} max={52} value={roleForm.vacation_weeks_per_year} onChange={e => setRoleForm(p => ({ ...p, vacation_weeks_per_year: Number(e.target.value) }))} placeholder="e.g. 6" /></div>
            <div><Label>Notes</Label><Textarea value={roleForm.notes} onChange={e => setRoleForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <Button onClick={handleSaveRole} disabled={!roleForm.name || createRole.isPending} className="w-full">Create Role</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
