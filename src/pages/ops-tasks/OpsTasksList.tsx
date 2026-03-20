import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOpsTasks, useOpsTeamMembers, useUpdateOpsTask, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, CATEGORY_LABELS, UI_STATUSES, UI_STATUS_LABELS, OpsTask, OpsTaskStatus, OpsTaskPriority, OpsTaskCategory } from "@/hooks/useOpsTasks";
import { Plus, Search, X, ArrowLeft } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];
const ALL_STATUSES = UI_STATUSES;
const ALL_PRIORITIES: OpsTaskPriority[] = ["low", "medium", "high", "urgent"];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as OpsTaskCategory[];

export default function OpsTasksList() {
  const { data: allTasks = [], isLoading } = useOpsTasks();
  const tasks = useMemo(() => allTasks.filter(t => t.task_mode !== "facility_request"), [allTasks]);
  const { data: members = [] } = useOpsTeamMembers();
  const updateTask = useUpdateOpsTask();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");

  const filtered = useMemo(() => {
    let result = tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (ownerFilter !== "all" && t.main_owner_id !== ownerFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "due_date": return (a.target_end_date || "9999").localeCompare(b.target_end_date || "9999");
        case "priority": {
          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority] || 3) - (order[b.priority] || 3);
        }
        case "status": return a.status.localeCompare(b.status);
        case "owner": return (a.main_owner?.name || "zzz").localeCompare(b.main_owner?.name || "zzz");
        default: return 0;
      }
    });
    return result;
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter, ownerFilter, sortBy]);

  const hasFilters = search || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || ownerFilter !== "all";

  const handleInlineStatusChange = (task: OpsTask, newStatus: OpsTaskStatus) => {
    updateTask.mutate({
      id: task.id,
      updates: { status: newStatus } as any,
      historyEntry: { field_changed: "status", old_value: task.status, new_value: newStatus, changed_by: "Manager" },
    });
  };

  const handleInlineOwnerChange = (task: OpsTask, newOwnerId: string) => {
    const oldOwner = task.main_owner?.name || "Unassigned";
    const newOwner = members.find(m => m.id === newOwnerId)?.name || "Unknown";
    updateTask.mutate({
      id: task.id,
      updates: { main_owner_id: newOwnerId } as any,
      historyEntry: { field_changed: "main_owner", old_value: oldOwner, new_value: newOwner, changed_by: "Manager" },
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link></Button>
          <h1 className="text-2xl font-bold text-foreground mt-1">All Tasks</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/request">Quick Request</Link></Button>
          <Button asChild size="sm"><Link to="/ops-tasks/new"><Plus className="h-4 w-4 mr-1" />New Task</Link></Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{UI_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {ALL_PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setPriorityFilter("all"); setCategoryFilter("all"); setOwnerFilter("all"); }}>
                <X className="h-4 w-4 mr-1" />Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} tasks</p>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Main Owner</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(task => {
                  const isOverdue = task.target_end_date && isPast(parseISO(task.target_end_date)) && !TERMINAL.includes(task.status);
                  return (
                    <TableRow key={task.id} className={isOverdue ? "bg-red-50/50" : ""}>
                      <TableCell>
                        <div className="font-medium text-sm">{task.title}</div>
                        {task.description && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{task.description}</div>}
                        {task.location && <div className="text-xs text-muted-foreground">📍 {task.location}</div>}
                      </TableCell>
                      <TableCell>
                        <Select value={task.status} onValueChange={(v) => handleInlineStatusChange(task, v as OpsTaskStatus)}>
                          <SelectTrigger className="h-7 text-xs w-[130px] border-0 p-0">
                            <Badge className={`${STATUS_COLORS[task.status]} text-xs`}>{STATUS_LABELS[task.status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {UI_STATUSES.map(s => <SelectItem key={s} value={s}>{UI_STATUS_LABELS[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PRIORITY_COLORS[task.priority]} text-xs capitalize`}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{CATEGORY_LABELS[task.category]}</TableCell>
                      <TableCell>
                        <Select value={task.main_owner_id || "unassigned"} onValueChange={(v) => handleInlineOwnerChange(task, v)}>
                          <SelectTrigger className="h-7 text-xs w-[110px] border-0 p-0">
                            <span className="text-xs">{task.main_owner?.name || "Unassigned"}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={`text-xs ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                        {task.target_end_date ? format(parseISO(task.target_end_date), "MMM d") : "—"}
                        {isOverdue && " ⚠️"}
                      </TableCell>
                      <TableCell className="text-xs">{task.estimated_hours || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
