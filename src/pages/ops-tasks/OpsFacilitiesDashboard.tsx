import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOpsTasks, useOpsTeamMembers, useUpdateOpsTask, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, CATEGORY_LABELS, UI_STATUSES, UI_STATUS_LABELS, OpsTask, OpsTaskStatus } from "@/hooks/useOpsTasks";
import { ArrowLeft, Plus, Search, Building2, Clock, CheckCircle2, Package } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsFacilitiesDashboard() {
  const { data: allTasks = [], isLoading } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();
  const updateTask = useUpdateOpsTask();

  // Only facility requests
  const tasks = useMemo(() => allTasks.filter(t => t.task_mode === "facility_request"), [allTasks]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "all") list = list.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requested_by?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, statusFilter, search]);

  const counts = useMemo(() => ({
    new_request: tasks.filter(r => r.status === "new_request").length,
    in_progress: tasks.filter(r => r.status === "in_progress").length,
    done: tasks.filter(r => r.status === "done").length,
    total: tasks.length,
  }), [tasks]);

  const handleStatusChange = (task: OpsTask, newStatus: OpsTaskStatus) => {
    updateTask.mutate({
      id: task.id,
      updates: { status: newStatus } as any,
      historyEntry: { field_changed: "status", old_value: task.status, new_value: newStatus, changed_by: "Manager" },
    });
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Facilities & Building Requests</h1>
          <p className="text-sm text-muted-foreground">Renovations, defects, plumbing, electrical, safety issues</p>
        </div>
        <Button asChild>
          <Link to="/ops-tasks/request"><Plus className="h-4 w-4 mr-1.5" />New Request</Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("new_request")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2"><Building2 className="h-4 w-4 text-blue-700" /></div>
            <div><p className="text-2xl font-bold">{counts.new_request}</p><p className="text-xs text-muted-foreground">New</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("in_progress")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2"><Clock className="h-4 w-4 text-yellow-700" /></div>
            <div><p className="text-2xl font-bold">{counts.in_progress}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("done")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /></div>
            <div><p className="text-2xl font-bold">{counts.done}</p><p className="text-xs text-muted-foreground">Done</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2"><Package className="h-4 w-4 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, location, requester..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            {UI_STATUSES.map(s => <SelectItem key={s} value={s}>{UI_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No facility requests found</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/ops-tasks/request">Submit a request</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const next = r.status === "new_request" ? "in_progress" as OpsTaskStatus : r.status === "in_progress" ? "done" as OpsTaskStatus : null;
                  const isOverdue = r.target_end_date && isPast(parseISO(r.target_end_date)) && !TERMINAL.includes(r.status);
                  return (
                    <TableRow key={r.id} className={isOverdue ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {r.title}
                        {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{CATEGORY_LABELS[r.category]}</Badge></TableCell>
                      <TableCell><Badge className={`${PRIORITY_COLORS[r.priority]} text-xs capitalize`}>{r.priority}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.location || "—"}</TableCell>
                      <TableCell className="text-sm">{r.requested_by || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell><Badge className={`${STATUS_COLORS[r.status]} text-xs`}>{STATUS_LABELS[r.status]}</Badge></TableCell>
                      <TableCell className="text-right">
                        {next ? (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(r, next)} disabled={updateTask.isPending}>
                            → {UI_STATUS_LABELS[next]}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}