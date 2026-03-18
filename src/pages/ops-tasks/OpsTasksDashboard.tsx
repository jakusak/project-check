import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpsTasks, useOpsTeamMembers, CATEGORY_LABELS } from "@/hooks/useOpsTasks";
import { Plus, AlertTriangle, CheckCircle, Clock, Ban, TrendingUp, Users } from "lucide-react";
import { format, isThisWeek, isThisMonth, isPast, parseISO } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsTasksDashboard() {
  const { data: tasks = [], isLoading } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();

  const metrics = useMemo(() => {
    const now = new Date();
    const dueThisWeek = tasks.filter(t => t.target_end_date && isThisWeek(parseISO(t.target_end_date)) && !TERMINAL.includes(t.status));
    const completedThisWeek = tasks.filter(t => t.actual_completion_date && isThisWeek(parseISO(t.actual_completion_date)));
    const overdue = tasks.filter(t => t.target_end_date && isPast(parseISO(t.target_end_date)) && !TERMINAL.includes(t.status));
    const blocked = tasks.filter(t => t.status === "blocked");
    const plannedThisMonth = tasks.filter(t => t.planned_month && t.planned_month.toLowerCase() === format(now, "MMMM").toLowerCase());
    const completedThisMonth = tasks.filter(t => t.actual_completion_date && isThisMonth(parseISO(t.actual_completion_date)));
    const completionRate = plannedThisMonth.length > 0 ? Math.round((completedThisMonth.length / plannedThisMonth.length) * 100) : 0;
    const recentlyCompleted = tasks.filter(t => t.status === "done").slice(0, 5);
    
    const byOwner = members.map(m => ({
      member: m,
      active: tasks.filter(t => t.current_owner_id === m.id && !TERMINAL.includes(t.status)).length,
      overdue: tasks.filter(t => t.current_owner_id === m.id && t.target_end_date && isPast(parseISO(t.target_end_date)) && !TERMINAL.includes(t.status)).length,
    }));

    const byCategory: Record<string, number> = {};
    tasks.filter(t => !TERMINAL.includes(t.status)).forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    return { dueThisWeek, completedThisWeek, overdue, blocked, completionRate, recentlyCompleted, byOwner, byCategory, plannedThisMonth, completedThisMonth };
  }, [tasks, members]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Control</h1>
          <p className="text-muted-foreground text-sm">Facilities, Trailers & Ops Projects</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/ops-tasks/request">Quick Request</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/ops-tasks/new"><Plus className="h-4 w-4 mr-1" />New Task</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Clock className="h-4 w-4" />Due This Week</div>
            <div className="text-2xl font-bold">{metrics.dueThisWeek.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CheckCircle className="h-4 w-4" />Completed This Week</div>
            <div className="text-2xl font-bold text-green-600">{metrics.completedThisWeek.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" />Overdue</div>
            <div className="text-2xl font-bold text-red-600">{metrics.overdue.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Ban className="h-4 w-4" />Blocked</div>
            <div className="text-2xl font-bold text-orange-600">{metrics.blocked.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate + Planned vs Completed */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />Monthly Completion Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">{metrics.completedThisMonth.length} completed / {metrics.plannedThisMonth.length} planned this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" />Tasks by Owner</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.byOwner.map(({ member, active, overdue }) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{member.name}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{active} active</Badge>
                  {overdue > 0 && <Badge variant="destructive">{overdue} overdue</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Overdue + Blocked Lists */}
      <div className="grid md:grid-cols-2 gap-4">
        {metrics.overdue.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-700">⚠️ Overdue Tasks</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {metrics.overdue.map(t => (
                <Link key={t.id} to={`/ops-tasks?highlight=${t.id}`} className="block p-2 rounded-md hover:bg-muted text-sm">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>Due: {t.target_end_date && format(parseISO(t.target_end_date), "MMM d")}</span>
                    <span>•</span>
                    <span>{t.current_owner?.name || "Unassigned"}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
        {metrics.blocked.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-700">🚫 Blocked Tasks</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {metrics.blocked.map(t => (
                <Link key={t.id} to={`/ops-tasks?highlight=${t.id}`} className="block p-2 rounded-md hover:bg-muted text-sm">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.blocker_reason || "No reason specified"}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tasks by Category + Recently Completed */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active by Category</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recently Completed</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.recentlyCompleted.map(t => (
              <div key={t.id} className="text-sm p-2 rounded-md bg-green-50">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">
                  {t.actual_completion_date && format(parseISO(t.actual_completion_date), "MMM d")} • {t.current_owner?.name}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2 flex-wrap">
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks">All Tasks</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/weekly">Weekly View</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/monthly">Monthly View</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/annual">Annual Plan</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/ops-tasks/capacity">Team Capacity</Link></Button>
      </div>
    </div>
  );
}
