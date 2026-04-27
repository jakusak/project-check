import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOpsTasks, useOpsTeamMembers, useUpdateOpsTask, PRIORITY_COLORS } from "@/hooks/useOpsTasks";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { Plus, Building2, ShoppingCart, Wrench, ArrowRight, CalendarDays, Landmark, X, CheckCircle2, ChevronDown, Pencil } from "lucide-react";
import { FacilityTaskEditDialog } from "@/components/ops-tasks/FacilityTaskEditDialog";
import { SupplyRequestEditDialog } from "@/components/ops-tasks/SupplyRequestEditDialog";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

type UnifiedItem = {
  id: string;
  title: string;
  source: "facility" | "ops_task" | "supply";
  priority: string;
  status: string;
  owner?: string;
  ownerId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  completedAt?: string | null;
  planning_horizon: string | null;
};

export default function OpsTasksDashboard() {
  const { data: allTasks = [], isLoading: tasksLoading } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();
  const { data: supplyRequests = [], isLoading: supplyLoading, updatePlanningHorizon: updateSupplyHorizon, updateStatus: updateSupplyStatus } = useSupplyRequests();
  const updateTask = useUpdateOpsTask();

  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);

  const isLoading = tasksLoading || supplyLoading;

  const facilityRequests = useMemo(() => allTasks.filter(t => t.task_mode === "facility_request"), [allTasks]);
  const opsTasks = useMemo(() => allTasks.filter(t => t.task_mode !== "facility_request"), [allTasks]);

  // Category summaries
  const categories = useMemo(() => {
    const facilityNew = facilityRequests.filter(t => t.status === "new_request").length;
    const facilityActive = facilityRequests.filter(t => !TERMINAL.includes(t.status)).length;
    const facilityDone = facilityRequests.filter(t => t.status === "done").length;
    const opsNew = opsTasks.filter(t => t.status === "new_request").length;
    const opsActive = opsTasks.filter(t => !TERMINAL.includes(t.status)).length;
    const opsDone = opsTasks.filter(t => t.status === "done").length;
    const supplyNew = supplyRequests.filter(r => r.status === "open").length;
    const supplyActive = supplyRequests.filter(r => r.status !== "closed").length;
    const supplyDone = supplyRequests.filter(r => r.status === "closed").length;
    return { facilityNew, facilityActive, facilityDone, opsNew, opsActive, opsDone, supplyNew, supplyActive, supplyDone };
  }, [facilityRequests, opsTasks, supplyRequests]);

  // Unify all items for planning boards
  const allUnified: UnifiedItem[] = useMemo(() => {
    const fromTasks = allTasks.filter(t => !TERMINAL.includes(t.status)).map((t): UnifiedItem => ({
      id: t.id,
      title: t.title,
      source: t.task_mode === "facility_request" ? "facility" : "ops_task",
      priority: t.priority,
      status: t.status,
      owner: t.main_owner?.name || undefined,
      ownerId: t.main_owner_id,
      dueDate: t.target_end_date,
      createdAt: t.created_at,
      planning_horizon: t.planning_horizon,
    }));
    const fromSupply = supplyRequests.filter(r => r.status !== "closed").map((r): UnifiedItem => ({
      id: r.id,
      title: r.title,
      source: "supply",
      priority: r.priority,
      status: r.status,
      owner: r.requested_by,
      ownerId: null,
      dueDate: null,
      createdAt: r.created_at,
      planning_horizon: r.planning_horizon,
    }));
    return [...fromTasks, ...fromSupply];
  }, [allTasks, supplyRequests]);

  const weeklyItems = useMemo(() => {
    let items = allUnified.filter(i => i.planning_horizon === "weekly");
    if (ownerFilter !== "all") items = items.filter(i => i.ownerId === ownerFilter || (ownerFilter === "unassigned" && !i.ownerId));
    return items;
  }, [allUnified, ownerFilter]);

  const longTermItems = useMemo(() => {
    let items = allUnified.filter(i => i.planning_horizon === "long_term");
    if (ownerFilter !== "all") items = items.filter(i => i.ownerId === ownerFilter || (ownerFilter === "unassigned" && !i.ownerId));
    return items;
  }, [allUnified, ownerFilter]);

  const unassignedItems = useMemo(() => {
    let items = allUnified.filter(i => !i.planning_horizon);
    if (ownerFilter !== "all") items = items.filter(i => i.ownerId === ownerFilter || (ownerFilter === "unassigned" && !i.ownerId));
    return items;
  }, [allUnified, ownerFilter]);


  const assignHorizon = (item: UnifiedItem, horizon: string | null) => {
    if (item.source === "supply") {
      updateSupplyHorizon.mutate({ id: item.id, planning_horizon: horizon });
    } else {
      updateTask.mutate({
        id: item.id,
        updates: { planning_horizon: horizon } as any,
      });
    }
  };

  const cancelItem = (item: UnifiedItem) => {
    const ok = window.confirm(`Permanently remove "${item.title}" from the dashboard?\n\nThis will cancel the task and hide it from all active boards.`);
    if (!ok) return;
    if (item.source === "supply") {
      updateSupplyStatus.mutate({ id: item.id, status: "closed" });
    } else {
      updateTask.mutate({
        id: item.id,
        updates: { status: "cancelled", planning_horizon: null } as any,
        historyEntry: { field_changed: "status", old_value: item.status, new_value: "cancelled" },
      });
    }
  };

  const markDone = (item: UnifiedItem) => {
    if (item.source === "supply") {
      updateSupplyStatus.mutate({ id: item.id, status: "closed" });
    } else {
      updateTask.mutate({
        id: item.id,
        updates: { status: "done", actual_completion_date: new Date().toISOString().split("T")[0] } as any,
        historyEntry: { field_changed: "status", old_value: item.status, new_value: "done" },
      });
    }
  };

  // Recently completed items (last 14 days)
  const recentlyCompleted = useMemo(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const completedTasks = allTasks
      .filter(t => TERMINAL.includes(t.status) && t.planning_horizon && new Date(t.updated_at) >= twoWeeksAgo)
      .map((t): UnifiedItem => ({
        id: t.id, title: t.title,
        source: t.task_mode === "facility_request" ? "facility" : "ops_task",
        priority: t.priority, status: t.status,
        owner: t.main_owner?.name, ownerId: t.main_owner_id,
        dueDate: t.target_end_date, createdAt: t.created_at,
        completedAt: t.actual_completion_date || t.updated_at,
        planning_horizon: t.planning_horizon,
      }));
    const completedSupply = supplyRequests
      .filter(r => r.status === "closed" && r.planning_horizon && new Date(r.updated_at) >= twoWeeksAgo)
      .map((r): UnifiedItem => ({
        id: r.id, title: r.title, source: "supply",
        priority: r.priority, status: r.status,
        owner: r.requested_by, ownerId: null,
        dueDate: null, createdAt: r.created_at,
        completedAt: r.updated_at,
        planning_horizon: r.planning_horizon,
      }));
    return [...completedTasks, ...completedSupply];
  }, [allTasks, supplyRequests]);

  const [historyOpen, setHistoryOpen] = useState(false);

  const sourceIcon = (source: string) => {
    if (source === "facility") return <Building2 className="h-3 w-3 text-blue-600" />;
    if (source === "supply") return <ShoppingCart className="h-3 w-3 text-emerald-600" />;
    return <Wrench className="h-3 w-3 text-yellow-600" />;
  };

  const sourceLabel = (source: string) => {
    if (source === "facility") return "Facility";
    if (source === "supply") return "Supply";
    return "Ops";
  };

  const resurface = (item: UnifiedItem) => {
    if (item.source === "supply") {
      updateSupplyStatus.mutate({ id: item.id, status: "open" });
    } else {
      updateTask.mutate({
        id: item.id,
        updates: { status: "in_progress", actual_completion_date: null } as any,
        historyEntry: { field_changed: "status", old_value: item.status, new_value: "in_progress" },
      });
    }
  };

  const reassignOwner = (item: UnifiedItem, newOwnerId: string) => {
    if (item.source === "supply") return;
    const value = newOwnerId === "unassigned" ? null : newOwnerId;
    const oldName = item.owner || "Unassigned";
    const newName = members.find(m => m.id === value)?.name || "Unassigned";
    updateTask.mutate({
      id: item.id,
      updates: { main_owner_id: value } as any,
      historyEntry: { field_changed: "main_owner", old_value: oldName, new_value: newName },
    });
  };

  const changeStatus = (item: UnifiedItem, newStatus: string) => {
    if (item.source === "supply") {
      // map supply: in_progress => open, done => closed, new_request => open
      const supplyStatus = newStatus === "done" ? "closed" : "open";
      updateSupplyStatus.mutate({ id: item.id, status: supplyStatus });
    } else {
      const updates: any = { status: newStatus };
      if (newStatus === "done") updates.actual_completion_date = new Date().toISOString().split("T")[0];
      else updates.actual_completion_date = null;
      updateTask.mutate({
        id: item.id,
        updates,
        historyEntry: { field_changed: "status", old_value: item.status, new_value: newStatus },
      });
    }
  };

  const displayStatus = (item: UnifiedItem): string => {
    if (item.source === "supply") {
      if (item.status === "closed") return "done";
      if (item.status === "in_progress") return "in_progress";
      return "new_request";
    }
    if (item.status === "done" || item.status === "cannot_complete" || item.status === "cancelled") return "done";
    if (item.status === "new_request" || item.status === "triaged") return "new_request";
    return "in_progress";
  };

  const PlanningRow = ({ item, showAssignButtons, showDoneButton, showStatusSelect, statusMode = "full" }: { item: UnifiedItem; showAssignButtons?: boolean; showDoneButton?: boolean; showStatusSelect?: boolean; statusMode?: "full" | "active" }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 text-sm border border-border/50 bg-background">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {sourceIcon(item.source)}
        <span className="font-medium truncate">{item.title}</span>
        <Badge variant="outline" className="text-[10px] shrink-0">{sourceLabel(item.source)}</Badge>
        <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline" title={`Submitted ${new Date(item.createdAt).toLocaleString()}`}>
          {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5"
          title="View / edit details"
          onClick={() => {
            if (item.source === "supply") setEditingSupplyId(item.id);
            else setEditingTaskId(item.id);
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        {item.source === "supply" ? (
          item.owner && <span className="text-xs text-muted-foreground hidden md:inline">{item.owner}</span>
        ) : (
          <Select value={item.ownerId || "unassigned"} onValueChange={(v) => reassignOwner(item, v)}>
            <SelectTrigger className="h-6 w-[110px] text-[11px] px-2">
              <SelectValue placeholder="Assign…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showStatusSelect && (
          <Select value={displayStatus(item)} onValueChange={(v) => changeStatus(item, v)}>
            <SelectTrigger className="h-6 w-[120px] text-[11px] px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new_request">New Request</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              {statusMode === "full" && <SelectItem value="done">Completed</SelectItem>}
            </SelectContent>
          </Select>
        )}
        <Badge className={`${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || "bg-muted text-muted-foreground"} text-[10px] capitalize`}>{item.priority}</Badge>
        {item.planning_horizon === "weekly" && (
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive" onClick={() => cancelItem(item)} title="Permanently remove from dashboard">
            <X className="h-3 w-3" />
          </Button>
        )}
        {item.planning_horizon === "long_term" && (
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive" onClick={() => cancelItem(item)} title="Permanently remove from dashboard">
            <X className="h-3 w-3" />
          </Button>
        )}
        {showAssignButtons && (
          <>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(item, "weekly")}>
              <CalendarDays className="h-3 w-3 mr-1" />Week
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(item, "long_term")}>
              <Landmark className="h-3 w-3 mr-1" />Long
            </Button>
          </>
        )}
        {showDoneButton && (
          <button onClick={() => markDone(item)} className="text-green-500 hover:text-green-700 transition-colors shrink-0 p-0.5 rounded hover:bg-green-50" title="Mark as done">
            <CheckCircle2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">801 FR Building & OPS Dashboard</h1>
          <p className="text-muted-foreground text-sm">Steve • Fabian • Sasha</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/supply/new"><ShoppingCart className="h-4 w-4 mr-1" />Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/ops-tasks/request"><Building2 className="h-4 w-4 mr-1" />Facilities</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/ops-tasks/new"><Plus className="h-4 w-4 mr-1" />Ops Task</Link>
          </Button>
        </div>
      </div>

      {/* 3 Category Overview Cards (compact) */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-blue-100 p-1.5"><Building2 className="h-3.5 w-3.5 text-blue-700" /></div>
              <span className="font-medium text-sm">Facilities</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span><span className="font-bold text-blue-600">{categories.facilityNew}</span> <span className="text-xs text-muted-foreground">new</span></span>
              <span><span className="font-bold">{categories.facilityActive}</span> <span className="text-xs text-muted-foreground">active</span></span>
              <span><span className="font-bold text-emerald-600">{categories.facilityDone}</span> <span className="text-xs text-muted-foreground">done</span></span>
            </div>
            <Button asChild variant="link" size="sm" className="px-0 mt-1 h-6 text-xs">
              <Link to="/ops-tasks/facilities">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-yellow-100 p-1.5"><Wrench className="h-3.5 w-3.5 text-yellow-700" /></div>
              <span className="font-medium text-sm">Ops Tasks</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span><span className="font-bold text-blue-600">{categories.opsNew}</span> <span className="text-xs text-muted-foreground">new</span></span>
              <span><span className="font-bold">{categories.opsActive}</span> <span className="text-xs text-muted-foreground">active</span></span>
              <span><span className="font-bold text-emerald-600">{categories.opsDone}</span> <span className="text-xs text-muted-foreground">done</span></span>
            </div>
            <Button asChild variant="link" size="sm" className="px-0 mt-1 h-6 text-xs">
              <Link to="/ops-tasks">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-emerald-100 p-1.5"><ShoppingCart className="h-3.5 w-3.5 text-emerald-700" /></div>
              <span className="font-medium text-sm">Supply / Shopping</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span><span className="font-bold text-blue-600">{categories.supplyNew}</span> <span className="text-xs text-muted-foreground">open</span></span>
              <span><span className="font-bold">{categories.supplyActive}</span> <span className="text-xs text-muted-foreground">active</span></span>
              <span><span className="font-bold text-emerald-600">{categories.supplyDone}</span> <span className="text-xs text-muted-foreground">closed</span></span>
            </div>
            <Button asChild variant="link" size="sm" className="px-0 mt-1 h-6 text-xs">
              <Link to="/supply/dashboard">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Owner Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by owner:</span>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Weekly & Long-Term Planning Boards — stacked full-width for better readability */}
      <div className="space-y-6">
        {/* This Week */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              This Week
              <Badge variant="outline" className="ml-auto">{weeklyItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {weeklyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned to this week yet.<br />Use the Inbox below to assign tasks.</p>
            ) : (
              weeklyItems.map(item => <PlanningRow key={item.id} item={item} showStatusSelect statusMode="active" showDoneButton />)
            )}
          </CardContent>
        </Card>

        {/* Long-Term Projects */}
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-amber-600" />
              Long-Term Projects
              <Badge variant="outline" className="ml-auto">{longTermItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {longTermItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No long-term projects assigned yet.<br />Use the Inbox below to assign projects.</p>
            ) : (
              longTermItems.map(item => <PlanningRow key={item.id} item={item} showStatusSelect />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inbox: Unassigned items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            📥 Inbox – Assign to Weekly or Long-Term
            <Badge variant="outline" className="ml-auto">{unassignedItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {unassignedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">All tasks have been assigned! 🎉</p>
          ) : (
            unassignedItems.map(item => <PlanningRow key={item.id} item={item} showAssignButtons />)
          )}
        </CardContent>
      </Card>


      {/* Recently Completed */}
      {recentlyCompleted.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <button onClick={() => setHistoryOpen(!historyOpen)} className="flex items-center gap-2 w-full text-left">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Recently Completed ({recentlyCompleted.length})
                <ChevronDown className={`h-3 w-3 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
              </CardTitle>
            </button>
          </CardHeader>
          {historyOpen && (
            <CardContent className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {recentlyCompleted.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md text-sm border border-border/50 bg-muted/30 opacity-70">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    {sourceIcon(item.source)}
                    <span className="font-medium truncate line-through">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{sourceLabel(item.source)}</Badge>
                    <Badge variant="outline" className="text-[10px] shrink-0">{item.planning_horizon === "weekly" ? "Weekly" : "Long-Term"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.completedAt && (
                      <span
                        className="text-[10px] text-emerald-700 font-medium whitespace-nowrap"
                        title={`Completed ${new Date(item.completedAt).toLocaleString()}`}
                      >
                        ✓ {new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {item.owner && <span className="text-xs text-muted-foreground hidden md:inline">{item.owner}</span>}
                    <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => resurface(item)} title="Re-open and move back to board">
                      <ArrowRight className="h-3 w-3 mr-1 rotate-[-90deg]" />Re-open
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Nav */}
      <div className="flex gap-2 flex-wrap">
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks">All Ops Tasks</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/facilities">Facilities</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/supply/dashboard">Supply Requests</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/weekly">Weekly View</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/monthly">Monthly View</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/annual">Annual Plan</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/capacity">Team Capacity</Link></Button>
      </div>

      <FacilityTaskEditDialog
        task={allTasks.find(t => t.id === editingTaskId) ?? null}
        open={!!editingTaskId}
        onOpenChange={(o) => !o && setEditingTaskId(null)}
      />
      <SupplyRequestEditDialog
        request={supplyRequests.find(r => r.id === editingSupplyId) ?? null}
        open={!!editingSupplyId}
        onOpenChange={(o) => !o && setEditingSupplyId(null)}
      />
    </div>
  );
}
