import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOpsTasks, useUpdateOpsTask, PRIORITY_COLORS } from "@/hooks/useOpsTasks";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { ShoppingCart, Wrench, Plus, CalendarDays, Landmark, X, CheckCircle2, Search } from "lucide-react";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

type UnifiedItem = {
  id: string;
  title: string;
  source: "ops_task" | "supply";
  priority: string;
  status: string;
  owner?: string;
  planning_horizon: string | null;
  category?: string;
  notes?: string | null;
};

export default function ShoppingListDashboard() {
  const { data: allTasks = [], isLoading: tasksLoading } = useOpsTasks();
  const { data: supplyRequests = [], isLoading: supplyLoading, updatePlanningHorizon: updateSupplyHorizon, updateStatus: updateSupplyStatus } = useSupplyRequests();
  const updateTask = useUpdateOpsTask();
  const [search, setSearch] = useState("");

  const isLoading = tasksLoading || supplyLoading;

  // All non-facility ops items: ops tasks (task_mode != facility_request) + every supply request
  const items: UnifiedItem[] = useMemo(() => {
    const fromTasks = allTasks
      .filter((t) => t.task_mode !== "facility_request")
      .map((t): UnifiedItem => ({
        id: t.id,
        title: t.title,
        source: "ops_task",
        priority: t.priority,
        status: t.status,
        owner: t.main_owner?.name,
        planning_horizon: t.planning_horizon,
        category: t.category,
        notes: t.notes,
      }));
    const fromSupply = supplyRequests.map((r): UnifiedItem => ({
      id: r.id,
      title: r.title,
      source: "supply",
      priority: r.priority,
      status: r.status,
      owner: r.requested_by,
      planning_horizon: r.planning_horizon,
      category: r.category,
      notes: r.notes,
    }));
    return [...fromTasks, ...fromSupply];
  }, [allTasks, supplyRequests]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.owner?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const active = filtered.filter((i) => !TERMINAL.includes(i.status) && i.status !== "closed");
  const inbox = active.filter((i) => !i.planning_horizon);
  const weekly = active.filter((i) => i.planning_horizon === "weekly");
  const longTerm = active.filter((i) => i.planning_horizon === "long_term");
  const completed = filtered.filter((i) => TERMINAL.includes(i.status) || i.status === "closed");

  const counts = {
    total: items.length,
    inbox: inbox.length,
    weekly: weekly.length,
    longTerm: longTerm.length,
    done: completed.length,
  };

  const assignHorizon = (item: UnifiedItem, horizon: string | null) => {
    if (item.source === "supply") {
      updateSupplyHorizon.mutate({ id: item.id, planning_horizon: horizon });
    } else {
      updateTask.mutate({ id: item.id, updates: { planning_horizon: horizon } as any });
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

  const sourceIcon = (s: string) =>
    s === "supply" ? <ShoppingCart className="h-3 w-3 text-emerald-600" /> : <Wrench className="h-3 w-3 text-yellow-600" />;
  const sourceLabel = (s: string) => (s === "supply" ? "Supply" : "Ops");

  const Row = ({ item, showAssign, showDone }: { item: UnifiedItem; showAssign?: boolean; showDone?: boolean }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border border-border/50 bg-background hover:bg-muted/40 text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {sourceIcon(item.source)}
        <span className="font-medium truncate">{item.title}</span>
        <Badge variant="outline" className="text-[10px] shrink-0">{sourceLabel(item.source)}</Badge>
        {item.category && <span className="text-xs text-muted-foreground hidden md:inline truncate">· {item.category.replace(/_/g, " ")}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {item.owner && <span className="text-xs text-muted-foreground hidden md:inline">{item.owner}</span>}
        <Badge className={`${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || "bg-muted text-muted-foreground"} text-[10px] capitalize`}>
          {item.priority}
        </Badge>
        {item.planning_horizon && (
          <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => assignHorizon(item, null)} title="Move back to Inbox">
            <X className="h-3 w-3" />
          </Button>
        )}
        {showAssign && (
          <>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(item, "weekly")}>
              <CalendarDays className="h-3 w-3 mr-1" />Week
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => assignHorizon(item, "long_term")}>
              <Landmark className="h-3 w-3 mr-1" />Long
            </Button>
          </>
        )}
        {showDone && (
          <button onClick={() => markDone(item)} className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-50" title="Mark as done">
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            Shopping List
          </h1>
          <p className="text-muted-foreground text-sm">Supplies, spare parts, and all non-facility ops requests</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/supply/new"><Plus className="h-4 w-4 mr-1" />New Supply Request</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/ops-tasks/new"><Plus className="h-4 w-4 mr-1" />New Ops Task</Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total, color: "bg-muted text-foreground" },
          { label: "Inbox", value: counts.inbox, color: "bg-blue-100 text-blue-700" },
          { label: "This Week", value: counts.weekly, color: "bg-amber-100 text-amber-700" },
          { label: "Long-Term", value: counts.longTerm, color: "bg-purple-100 text-purple-700" },
          { label: "Completed", value: counts.done, color: "bg-emerald-100 text-emerald-700" },
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
        <Input className="pl-9" placeholder="Search title, owner, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Inbox */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            📥 Inbox – Assign to Weekly or Long-Term
            <Badge variant="outline" className="ml-auto">{inbox.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">All shopping items have been assigned 🎉</p>
          ) : (
            inbox.map((i) => <Row key={i.id} item={i} showAssign />)
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
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing assigned to this week.</p>
            ) : (
              weekly.map((i) => <Row key={i.id} item={i} showDone />)
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-purple-600" />
              Long-Term
              <Badge variant="outline" className="ml-auto">{longTerm.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {longTerm.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No long-term shopping items.</p>
            ) : (
              longTerm.map((i) => <Row key={i.id} item={i} showDone />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
