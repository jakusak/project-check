import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpsTasks, useOpsTeamMembers, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/hooks/useOpsTasks";
import { ArrowLeft } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, isBefore } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsWeeklyView() {
  const { data: tasks = [] } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const { planned, carryOver, completed, blocked, byOwner } = useMemo(() => {
    const planned = tasks.filter(t => t.target_end_date && isWithinInterval(parseISO(t.target_end_date), { start: weekStart, end: weekEnd }) && !TERMINAL.includes(t.status));
    const carryOver = tasks.filter(t => t.target_end_date && isBefore(parseISO(t.target_end_date), weekStart) && !TERMINAL.includes(t.status));
    const completed = tasks.filter(t => t.actual_completion_date && isWithinInterval(parseISO(t.actual_completion_date), { start: weekStart, end: weekEnd }));
    const blocked = tasks.filter(t => t.status === "blocked");

    const byOwner = members.map(m => ({
      member: m,
      tasks: [...planned, ...carryOver].filter(t => t.main_owner_id === m.id),
    }));

    return { planned, carryOver, completed, blocked, byOwner };
  }, [tasks, members, weekStart, weekEnd]);

  const TaskRow = ({ task }: { task: any }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted text-sm">
      <div className="flex-1">
        <span className="font-medium">{task.title}</span>
        <span className="text-muted-foreground ml-2 text-xs">{task.main_owner?.name || "Unassigned"}</span>
      </div>
      <div className="flex gap-2">
        <Badge className={`${PRIORITY_COLORS[task.priority]} text-xs capitalize`}>{task.priority}</Badge>
        <Badge className={`${STATUS_COLORS[task.status]} text-xs`}>{STATUS_LABELS[task.status]}</Badge>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link></Button>
          <h1 className="text-2xl font-bold mt-2">Weekly View</h1>
          <p className="text-sm text-muted-foreground">{format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{planned.length}</div><div className="text-xs text-muted-foreground">Planned</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{carryOver.length}</div><div className="text-xs text-muted-foreground">Carry-Over</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{completed.length}</div><div className="text-xs text-muted-foreground">Completed</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{blocked.length}</div><div className="text-xs text-muted-foreground">Blocked</div></CardContent></Card>
      </div>

      {/* By Owner */}
      <div className="space-y-4">
        {byOwner.map(({ member, tasks: memberTasks }) => (
          <Card key={member.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {member.name}
                <Badge variant="outline">{memberTasks.length} tasks</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {memberTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No tasks this week</p>
              ) : (
                memberTasks.map(t => <TaskRow key={t.id} task={t} />)
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-700">✅ Completed This Week</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {completed.map(t => <TaskRow key={t.id} task={t} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
