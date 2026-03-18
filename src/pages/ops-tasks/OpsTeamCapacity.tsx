import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOpsTasks, useOpsTeamMembers } from "@/hooks/useOpsTasks";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { isPast, parseISO } from "date-fns";

const TERMINAL = ["done", "cancelled", "cannot_complete"];

export default function OpsTeamCapacity() {
  const { data: tasks = [] } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();

  const capacityData = useMemo(() => {
    return members.map(m => {
      const memberTasks = tasks.filter(t => t.current_owner_id === m.id);
      const active = memberTasks.filter(t => !TERMINAL.includes(t.status));
      const overdue = active.filter(t => t.target_end_date && isPast(parseISO(t.target_end_date)));
      const blocked = active.filter(t => t.status === "blocked");
      const completed = memberTasks.filter(t => t.status === "done");
      const totalTasks = memberTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;
      const estimatedHours = active.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      const adminTasks = active.filter(t => t.work_type === "admin").length;
      const manualTasks = active.filter(t => t.work_type === "manual").length;

      // Ownership drift: tasks where this person is current owner but NOT rightful owner
      const driftTasks = active.filter(t => t.rightful_owner_id && t.rightful_owner_id !== m.id);
      // Tasks this person SHOULD own but someone else has
      const shouldOwn = tasks.filter(t => t.rightful_owner_id === m.id && t.current_owner_id !== m.id && !TERMINAL.includes(t.status));

      return {
        member: m,
        active: active.length,
        overdue: overdue.length,
        blocked: blocked.length,
        completed: completed.length,
        completionRate,
        estimatedHours,
        adminTasks,
        manualTasks,
        driftTasks,
        shouldOwn,
      };
    });
  }, [tasks, members]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild><Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link></Button>
        <h1 className="text-2xl font-bold mt-2">Team Capacity</h1>
        <p className="text-sm text-muted-foreground">Workload, completion rates, and ownership analysis</p>
      </div>

      {capacityData.map(({ member, active, overdue, blocked, completed, completionRate, estimatedHours, adminTasks, manualTasks, driftTasks, shouldOwn }) => (
        <Card key={member.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>{member.name} <span className="text-sm font-normal text-muted-foreground capitalize">({member.role})</span></span>
              {overdue > 0 && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{overdue} overdue</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics Row */}
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-xl font-bold">{active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-xl font-bold">{estimatedHours}h</div>
                <div className="text-xs text-muted-foreground">Est. Hours</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-xl font-bold text-red-600">{blocked}</div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-xl font-bold text-green-600">{completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <div className="text-xl font-bold">{completionRate}%</div>
                <Progress value={completionRate} className="mt-1 h-1.5" />
                <div className="text-xs text-muted-foreground mt-1">Rate</div>
              </div>
            </div>

            {/* Work Type Mix */}
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Task Mix:</span>
              <Badge variant="outline">{manualTasks} Manual</Badge>
              <Badge variant="secondary">{adminTasks} Admin</Badge>
            </div>

            {/* Ownership Drift */}
            {(driftTasks.length > 0 || shouldOwn.length > 0) && (
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Ownership Drift</h4>
                {driftTasks.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="text-orange-600 font-medium">{driftTasks.length} tasks</span> assigned to {member.name} where someone else is the rightful owner
                  </div>
                )}
                {shouldOwn.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      <span className="text-orange-600 font-medium">{shouldOwn.length} tasks</span> {member.name} should own but someone else is carrying:
                    </div>
                    {shouldOwn.map(t => (
                      <div key={t.id} className="text-xs p-2 rounded bg-orange-50 flex justify-between">
                        <span>{t.title}</span>
                        <span className="text-muted-foreground">Currently: {t.current_owner?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
