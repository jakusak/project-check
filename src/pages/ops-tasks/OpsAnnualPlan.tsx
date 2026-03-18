import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpsTasks, useOpsTeamMembers } from "@/hooks/useOpsTasks";
import { ArrowLeft } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function OpsAnnualPlan() {
  const { data: tasks = [] } = useOpsTasks();
  const { data: members = [] } = useOpsTeamMembers();

  const grid = useMemo(() => {
    return members.map(m => {
      const monthData = FULL_MONTHS.map((month, i) => {
        const memberTasks = tasks.filter(t => 
          t.current_owner_id === m.id && 
          t.planned_month?.toLowerCase() === month.toLowerCase()
        );
        return {
          month: MONTHS[i],
          count: memberTasks.length,
          hours: memberTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0),
          categories: [...new Set(memberTasks.map(t => t.category))],
        };
      });
      return { member: m, months: monthData };
    });
  }, [tasks, members]);

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    if (count <= 2) return "bg-green-100";
    if (count <= 4) return "bg-yellow-100";
    return "bg-orange-100";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild><Link to="/ops-tasks/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link></Button>
        <h1 className="text-2xl font-bold mt-2">Annual Planning — 2026</h1>
        <p className="text-sm text-muted-foreground">High-level ownership and workload distribution</p>
      </div>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground w-32">Team Member</th>
                {MONTHS.map(m => (
                  <th key={m} className="text-center p-2 font-medium text-muted-foreground w-20">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map(({ member, months }) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="p-2 font-medium">{member.name}</td>
                  {months.map((data, i) => (
                    <td key={i} className="p-1">
                      <div className={`rounded-md p-2 text-center ${getCellColor(data.count)} min-h-[60px] flex flex-col items-center justify-center`}>
                        {data.count > 0 ? (
                          <>
                            <div className="font-bold text-lg">{data.count}</div>
                            <div className="text-xs text-muted-foreground">{data.hours}h</div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-border font-medium">
                <td className="p-2">Total</td>
                {FULL_MONTHS.map((month, i) => {
                  const total = tasks.filter(t => t.planned_month?.toLowerCase() === month.toLowerCase()).length;
                  const hours = tasks.filter(t => t.planned_month?.toLowerCase() === month.toLowerCase()).reduce((s, t) => s + (t.estimated_hours || 0), 0);
                  return (
                    <td key={i} className="p-1 text-center">
                      <div className="text-lg font-bold">{total}</div>
                      <div className="text-xs text-muted-foreground">{hours}h</div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground items-center">
        <span>Load:</span>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-muted/30 border" /> None</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-100 border" /> Light (1-2)</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-100 border" /> Moderate (3-4)</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-100 border" /> Heavy (5+)</div>
      </div>
    </div>
  );
}
