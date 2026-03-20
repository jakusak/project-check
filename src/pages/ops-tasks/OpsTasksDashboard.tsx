import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpsTasks, useOpsTeamMembers, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/hooks/useOpsTasks";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { Plus, Building2, ShoppingCart, Wrench, ArrowRight } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsTasksDashboard() {
  const { data: allTasks = [], isLoading: tasksLoading } = useOpsTasks();
  const { data: _members = [] } = useOpsTeamMembers();
  const { data: supplyRequests = [], isLoading: supplyLoading } = useSupplyRequests();

  const isLoading = tasksLoading || supplyLoading;

  // Split ops_tasks by task_mode
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

  // Recent new items across all 3 streams
  const recentFacility = useMemo(() =>
    facilityRequests.filter(t => t.status === "new_request").slice(0, 3),
  [facilityRequests]);

  const recentOps = useMemo(() =>
    opsTasks.filter(t => t.status === "new_request").slice(0, 3),
  [opsTasks]);

  const recentSupply = useMemo(() =>
    supplyRequests.filter(r => r.status === "open").slice(0, 3),
  [supplyRequests]);

  // Global stats
  const overdue = useMemo(() =>
    allTasks.filter(t => t.target_end_date && isPast(parseISO(t.target_end_date)) && !TERMINAL.includes(t.status)),
  [allTasks]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Control</h1>
          <p className="text-muted-foreground text-sm">Facilities, Ops Tasks & Supply Requests</p>
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

      {/* 3 Category Overview Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Facilities */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2"><Building2 className="h-4 w-4 text-blue-700" /></div>
              Facilities & Building
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">{categories.facilityNew}</span>
                <span className="text-muted-foreground">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="font-semibold">{categories.facilityActive}</span>
                <span className="text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">{categories.facilityDone}</span>
                <span className="text-muted-foreground">Done</span>
              </div>
            </div>
            {recentFacility.length > 0 && (
              <div className="space-y-1.5">
                {recentFacility.map(t => (
                  <div key={t.id} className="text-sm p-2 rounded-md bg-blue-50 flex justify-between items-center">
                    <span className="truncate font-medium">{t.title}</span>
                    <Badge className={`${PRIORITY_COLORS[t.priority]} text-[10px] capitalize`}>{t.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
            {recentFacility.length === 0 && <p className="text-xs text-muted-foreground">No new requests</p>}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/ops-tasks/facilities">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Ops Tasks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="rounded-lg bg-yellow-100 p-2"><Wrench className="h-4 w-4 text-yellow-700" /></div>
              Ops Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">{categories.opsNew}</span>
                <span className="text-muted-foreground">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="font-semibold">{categories.opsActive}</span>
                <span className="text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">{categories.opsDone}</span>
                <span className="text-muted-foreground">Done</span>
              </div>
            </div>
            {recentOps.length > 0 && (
              <div className="space-y-1.5">
                {recentOps.map(t => (
                  <div key={t.id} className="text-sm p-2 rounded-md bg-yellow-50 flex justify-between items-center">
                    <span className="truncate font-medium">{t.title}</span>
                    <Badge className={`${PRIORITY_COLORS[t.priority]} text-[10px] capitalize`}>{t.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
            {recentOps.length === 0 && <p className="text-xs text-muted-foreground">No new tasks</p>}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/ops-tasks">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Supply / Shopping */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2"><ShoppingCart className="h-4 w-4 text-emerald-700" /></div>
              Supply / Shopping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-semibold">{categories.supplyNew}</span>
                <span className="text-muted-foreground">Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="font-semibold">{categories.supplyActive}</span>
                <span className="text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">{categories.supplyDone}</span>
                <span className="text-muted-foreground">Closed</span>
              </div>
            </div>
            {recentSupply.length > 0 && (
              <div className="space-y-1.5">
                {recentSupply.map(r => (
                  <div key={r.id} className="text-sm p-2 rounded-md bg-emerald-50 flex justify-between items-center">
                    <span className="truncate font-medium">{r.title}</span>
                    <Badge variant="outline" className="text-[10px]">{r.category === "kitchen_supplies" ? "Kitchen" : r.category === "office_supplies" ? "Office" : "Other"}</Badge>
                  </div>
                ))}
              </div>
            )}
            {recentSupply.length === 0 && <p className="text-xs text-muted-foreground">No open requests</p>}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/supply/dashboard">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">⚠️ Overdue ({overdue.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-red-50">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Due: {t.target_end_date && format(parseISO(t.target_end_date), "MMM d")} • {t.main_owner?.name || "Unassigned"}
                  </div>
                </div>
                <Badge className={`${STATUS_COLORS[t.status]} text-xs`}>{STATUS_LABELS[t.status]}</Badge>
              </div>
            ))}
          </CardContent>
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
    </div>
  );
}