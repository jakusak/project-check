import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOpsTasks, useUpdateOpsTask, PRIORITY_COLORS, OpsTask } from "@/hooks/useOpsTasks";
import { Building2, Plus, CalendarDays, Landmark, X, CheckCircle2, Search, Pencil, ArrowLeft } from "lucide-react";
import { FacilityTaskEditDialog } from "@/components/ops-tasks/FacilityTaskEditDialog";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsFacilitiesPlanning() {
  const { data: allTasks = [], isLoading } = useOpsTasks();
  const updateTask = useUpdateOpsTask();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<OpsTask | null>(null);

  const facilities = useMemo(
    () => allTasks.filter((t) => t.task_mode === "facility_request"),
    [allTasks]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return facilities;
    const q = search.toLowerCase();
    return facilities.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.requested_by?.toLowerCase().includes(q) ||
        t.main_owner?.name?.toLowerCase().includes(q)
    );
  }, [facilities, search]);

  const active = filtered.filter((t) => !TERMINAL.includes(t.status));
  const inbox = active.filter((t) => !t.planning_horizon);
  const weekly = active.filter((t) => t.planning_horizon === "weekly");
  const longTerm = active.filter((t) => t.planning_horizon === "long_term");
  const completed = filtered.filter((t) => TERMINAL.includes(t.status));

  const assignHorizon = (task: OpsTask, horizon: string | null) => {
    updateTask.mutate({ id: task.id, updates: { planning_horizon: horizon } as any });
  };

  const markDone = (task: OpsTask) => {
    updateTask.mutate({
      id: task.id,
      updates: { status: "done", actual_completion_date: new Date().toISOString().split("T")[0] } as any,
      historyEntry: { field_changed: "status", old_value: task.status, new_value: "done" },
    });
  };

  const Row = ({ task, showAssign, showDone }: { task: OpsTask; showAssign?: boolean; showDone?: boolean }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border border-border/50 bg-background hover:bg-muted/40 text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Building2 className="h-3 w-3 text-blue-600 shrink-0" />
        <span className="font-medium truncate">{task.title}</span>
        {task.location && (
          <span className="text-xs text-muted-foreground hidden md:inline truncate">· {task.location}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {task.main_owner?.name && (
          <Badge variant="secondary" className="text-[10px]">{task.main_owner.name}</Badge>
        )}
        {!task.main_owner_id && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Unassigned</Badge>
        )}
        <Badge className={`${PRIORITY_COLORS[task.priority]} text-[10px] capitalize`}>{task.priority}</Badge>
        <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setEditing(task)} title="Edit">
          <Pencil className="h-3 w-3" />
        </Button>
        {task.planning_horizon && (
          <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => assignHorizon(task, null)} title="Move back to Inbox">
            <X className="h-3 w-3" />
          </Button>
        )}
        {showAssign && (
          <>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(task, "weekly")}>
              <CalendarDays className="h-3 w-3 mr-1" />Week
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(task, "long_term")}>
              <Landmark className="h-3 w-3 mr-1" />Long
            </Button>
          </>
        )}
        {showDone && (
          <button onClick={() => markDone(task)} className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-50" title="Mark as done">
            <CheckCircle2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
          </Button>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Facilities Planning
          </h1>
          <p className="text-muted-foreground text-sm">
            Triage facility requests · assign owner (Steve, Fabian, Sasha) · plan as Weekly or Long-Term
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/ops-tasks/facilities">Full List</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/ops-tasks/request"><Plus className="h-4 w-4 mr-1" />New Facility Request</Link>
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Inbox", value: inbox.length, color: "bg-blue-100 text-blue-700" },
          { label: "This Week", value: weekly.length, color: "bg-amber-100 text-amber-700" },
          { label: "Long-Term", value: longTerm.length, color: "bg-purple-100 text-purple-700" },
          { label: "Completed", value: completed.length, color: "bg-emerald-100 text-emerald-700" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className={`text-2xl font-bold mt-1 inline-block px-2 rounded ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search title, location, owner…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Inbox */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            📥 Inbox – New Facility Requests
            <Badge variant="outline" className="ml-auto">{inbox.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No new facility requests waiting for triage.</p>
          ) : (
            inbox.map((t) => <Row key={t.id} task={t} showAssign />)
          )}
        </CardContent>
      </Card>

      {/* Weekly + Long-term */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              This Week
              <Badge variant="outline" className="ml-auto">{weekly.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {weekly.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No facility tasks scheduled this week.</p>
            ) : (
              weekly.map((t) => <Row key={t.id} task={t} showDone />)
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-purple-600" />
              Long-Term Projects
              <Badge variant="outline" className="ml-auto">{longTerm.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {longTerm.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No long-term facility projects.</p>
            ) : (
              longTerm.map((t) => <Row key={t.id} task={t} showDone />)
            )}
          </CardContent>
        </Card>
      </div>

      <FacilityTaskEditDialog
        task={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
