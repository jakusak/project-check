import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOpsTasks, useOpsTeamMembers, STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, PRIORITY_COLORS } from "@/hooks/useOpsTasks";
import { ArrowLeft } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function OpsMonthlyView() {
  const { data: tasks = [] } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM"));

  const { monthTasks, completed, slipping, byCategory, byOwner } = useMemo(() => {
    const monthTasks = tasks.filter(t => t.planned_month?.toLowerCase() === selectedMonth.toLowerCase());
    const completed = monthTasks.filter(t => t.status === "done");
    const slipping = monthTasks.filter(t => t.target_end_date && isPast(parseISO(t.target_end_date)) && !TERMINAL.includes(t.status));

    const byCategory: Record<string, { total: number; done: number }> = {};
    monthTasks.forEach(t => {
      const cat = CATEGORY_LABELS[t.category] || t.category;
      if (!byCategory[cat]) byCategory[cat] = { total: 0, done: 0 };
      byCategory[cat].total++;
      if (t.status === "done") byCategory[cat].done++;
    });

    const byOwner = members.map(m => ({
      member: m,
      total: monthTasks.filter(t => t.main_owner_id === m.id).length,
      hours: monthTasks.filter(t => t.main_owner_id === m.id).reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
    }));

    return { monthTasks, completed, slipping, byCategory, byOwner };
  }, [tasks, members, selectedMonth]);

  const progressPct = monthTasks.length > 0 ? Math.round((completed.length / monthTasks.length) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link></Button>
          <h1 className="text-2xl font-bold mt-2">Monthly View</h1>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex gap-1 flex-wrap">
        {MONTHS.map(m => (
          <Button key={m} variant={selectedMonth === m ? "default" : "outline"} size="sm" onClick={() => setSelectedMonth(m)} className="text-xs">{m.slice(0, 3)}</Button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{monthTasks.length}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{completed.length}</div><div className="text-xs text-muted-foreground">Completed</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{slipping.length}</div><div className="text-xs text-muted-foreground">Slipping</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{progressPct}%</div><Progress value={progressPct} className="mt-1" /><div className="text-xs text-muted-foreground mt-1">Progress</div></CardContent></Card>
      </div>

      {/* Workload by Category */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Workload by Category</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(byCategory).map(([cat, { total, done }]) => (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1"><span>{cat}</span><span className="text-muted-foreground">{done}/{total}</span></div>
              <Progress value={total > 0 ? (done / total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Workload by Owner */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Workload by Owner</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {byOwner.map(({ member, total, hours }) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{member.name}</span>
              <div className="flex gap-2">
                <Badge variant="outline">{total} tasks</Badge>
                <Badge variant="secondary">{hours}h est.</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Slipping Tasks */}
      {slipping.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-700">⚠️ Slipping Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {slipping.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-red-50">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Due: {t.target_end_date && format(parseISO(t.target_end_date), "MMM d")} • {t.main_owner?.name}</div>
                </div>
                <Badge className={`${STATUS_COLORS[t.status]} text-xs`}>{STATUS_LABELS[t.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Tasks This Month */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Tasks — {selectedMonth}</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {monthTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks planned for {selectedMonth}</p>
          ) : (
            monthTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted text-sm">
                <div className="flex-1">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{t.current_owner?.name || "Unassigned"}</span>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${PRIORITY_COLORS[t.priority]} text-xs capitalize`}>{t.priority}</Badge>
                  <Badge className={`${STATUS_COLORS[t.status]} text-xs`}>{STATUS_LABELS[t.status]}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
