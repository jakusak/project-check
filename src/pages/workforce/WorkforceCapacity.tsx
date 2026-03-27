import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Users, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useWorkforceRoles,
  useWorkforceTasks,
  useCreateWorkforceRole,
  useUpdateWorkforceRole,
  MONTH_NAMES,
  getRoleMonthlyWorkload,
  getUtilization,
  getUtilizationColor,
  getUtilizationBadge,
  getEffectiveMonthlyCapacity,
} from "@/hooks/useWorkforcePlanning";

const ROLE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function WorkforceCapacity() {
  const navigate = useNavigate();
  const { data: roles = [], isLoading: rolesLoading } = useWorkforceRoles();
  const { data: tasks = [], isLoading: tasksLoading } = useWorkforceTasks();
  const createRole = useCreateWorkforceRole();
  const updateRole = useUpdateWorkforceRole();

  const [selectedYear] = useState(new Date().getFullYear());
  const [threshold, setThreshold] = useState(85);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", assigned_person_name: "", monthly_capacity_hours: 160, vacation_weeks_per_year: 0, notes: "" });

  const isLoading = rolesLoading || tasksLoading;

  // Summary stats
  const overloadedMonths = roles.flatMap(role => {
    const effCap = getEffectiveMonthlyCapacity(role.monthly_capacity_hours, role.vacation_weeks_per_year);
    return Array.from({ length: 12 }, (_, i) => {
      const workload = getRoleMonthlyWorkload(role.id, tasks, i + 1);
      const pct = getUtilization(workload, effCap);
      return pct > threshold ? { role: role.name, month: i + 1, pct } : null;
    }).filter(Boolean);
  });

  const totalTasks = tasks.length;
  const unassignedTasks = tasks.filter(t => !t.assigned_role_id).length;

  const handleCreateRole = () => {
    createRole.mutate({
      name: newRole.name,
      assigned_person_name: newRole.assigned_person_name || null,
      monthly_capacity_hours: newRole.monthly_capacity_hours,
      vacation_weeks_per_year: newRole.vacation_weeks_per_year,
      notes: newRole.notes || null,
      color: ROLE_COLORS[roles.length % ROLE_COLORS.length],
    }, {
      onSuccess: () => {
        setNewRoleOpen(false);
        setNewRole({ name: "", assigned_person_name: "", monthly_capacity_hours: 160, vacation_weeks_per_year: 0, notes: "" });
      }
    });
  };

  const handleUpdateVacation = (roleId: string, weeks: number) => {
    updateRole.mutate({ id: roleId, updates: { vacation_weeks_per_year: weeks } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ops-tasks/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Workforce Capacity Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monthly workload vs. capacity by role — {selectedYear}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/workforce/tasks">
            <Button variant="outline">Task Allocation Table</Button>
          </Link>
          <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Add Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Role</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Role / Job Title</Label><Input value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ops Coordinator" /></div>
                <div><Label>Assigned Person (optional)</Label><Input value={newRole.assigned_person_name} onChange={e => setNewRole(p => ({ ...p, assigned_person_name: e.target.value }))} placeholder="e.g. Steve" /></div>
                <div><Label>Monthly Capacity (hours)</Label><Input type="number" value={newRole.monthly_capacity_hours} onChange={e => setNewRole(p => ({ ...p, monthly_capacity_hours: Number(e.target.value) }))} /></div>
                <div><Label>Vacation Weeks / Year</Label><Input type="number" min={0} max={52} value={newRole.vacation_weeks_per_year} onChange={e => setNewRole(p => ({ ...p, vacation_weeks_per_year: Number(e.target.value) }))} placeholder="e.g. 6" /></div>
                <div><Label>Notes</Label><Textarea value={newRole.notes} onChange={e => setNewRole(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleCreateRole} disabled={!newRole.name || createRole.isPending} className="w-full">Create Role</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Users className="h-4 w-4" />Roles</div>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><BarChart3 className="h-4 w-4" />Total Tasks</div>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" />Unassigned</div>
            <div className="text-2xl font-bold">{unassignedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" />Overload Alerts</div>
            <div className="text-2xl font-bold text-red-600">{overloadedMonths.length}</div>
            <p className="text-xs text-muted-foreground">months &gt;{threshold}% across all roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold control */}
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Overload Threshold:</Label>
        <Select value={String(threshold)} onValueChange={v => setThreshold(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[70, 75, 80, 85, 90, 95, 100].map(v => (
              <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No roles defined yet</p>
            <p className="text-sm mb-4">Add roles to start planning workforce capacity</p>
            <Button onClick={() => setNewRoleOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add First Role</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Heatmap */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Utilization Heatmap</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium min-w-[160px]">Role / Person</th>
                      {MONTH_NAMES.map(m => (
                        <th key={m} className="text-center p-2 font-medium w-16">{m}</th>
                      ))}
                      <th className="text-center p-2 font-medium w-20">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => {
                      const effCap = getEffectiveMonthlyCapacity(role.monthly_capacity_hours, role.vacation_weeks_per_year);
                      const monthPcts = Array.from({ length: 12 }, (_, i) => {
                        const wl = getRoleMonthlyWorkload(role.id, tasks, i + 1);
                        return getUtilization(wl, effCap);
                      });
                      const avgPct = Math.round(monthPcts.reduce((a, b) => a + b, 0) / 12);

                      return (
                        <tr key={role.id} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{role.name}</div>
                            {role.assigned_person_name && (
                              <div className="text-xs text-muted-foreground">{role.assigned_person_name}</div>
                            )}
                            <div className="text-xs text-muted-foreground">{effCap}h/mo (base {role.monthly_capacity_hours}h)</div>
                            {role.vacation_weeks_per_year > 0 && (
                              <div className="text-xs text-muted-foreground">{role.vacation_weeks_per_year}wk vacation</div>
                            )}
                          </td>
                          {monthPcts.map((pct, i) => (
                            <td key={i} className="p-1 text-center">
                              <div
                                className={`rounded px-1 py-2 text-xs font-semibold text-white ${getUtilizationColor(pct)}`}
                                title={`${getRoleMonthlyWorkload(role.id, tasks, i + 1)}h / ${effCap}h`}
                              >
                                {pct}%
                              </div>
                            </td>
                          ))}
                          <td className="p-1 text-center">
                            <Badge className={getUtilizationBadge(avgPct).className}>{avgPct}%</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-300" /> 0–30%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> 31–60%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500" /> 61–85%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-500" /> 86–100%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> &gt;100%</div>
              </div>
            </CardContent>
          </Card>

          {/* Per-Role Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {roles.map(role => {
              const monthData = Array.from({ length: 12 }, (_, i) => {
                const wl = getRoleMonthlyWorkload(role.id, tasks, i + 1);
                const pct = getUtilization(wl, role.monthly_capacity_hours);
                return { month: MONTH_NAMES[i], workload: wl, pct };
              });
              const assignedTasks = tasks.filter(t => t.assigned_role_id === role.id);
              const avgPct = Math.round(monthData.reduce((a, d) => a + d.pct, 0) / 12);
              const badge = getUtilizationBadge(avgPct);
              const consecutiveOver = monthData.reduce((max, d) => {
                if (d.pct > threshold) return { count: max.count + 1, max: Math.max(max.max, max.count + 1) };
                return { count: 0, max: max.max };
              }, { count: 0, max: 0 }).max;

              return (
                <Card key={role.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        {role.assigned_person_name && <p className="text-sm text-muted-foreground">{role.assigned_person_name}</p>}
                      </div>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tasks: </span><span className="font-medium">{assignedTasks.length}</span>
                      <span className="text-muted-foreground ml-4">Avg Util: </span><span className="font-medium">{avgPct}%</span>
                      <span className="text-muted-foreground ml-4">Capacity: </span><span className="font-medium">{role.monthly_capacity_hours}h</span>
                    </div>
                    
                    {/* Mini monthly bars */}
                    <div className="grid grid-cols-12 gap-1">
                      {monthData.map((d, i) => (
                        <div key={i} className="text-center">
                          <div className="h-12 relative bg-muted rounded-sm overflow-hidden">
                            <div
                              className={`absolute bottom-0 w-full rounded-sm ${getUtilizationColor(d.pct)}`}
                              style={{ height: `${Math.min(d.pct, 120)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">{MONTH_NAMES[i]}</div>
                        </div>
                      ))}
                    </div>

                    {consecutiveOver >= 3 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Overloaded for {consecutiveOver} consecutive months — consider hiring or task reassignment</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Hiring Signal */}
          {overloadedMonths.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Hiring & Rebalancing Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roles.map(role => {
                    const monthPcts = Array.from({ length: 12 }, (_, i) => getUtilization(getRoleMonthlyWorkload(role.id, tasks, i + 1), role.monthly_capacity_hours));
                    const overMonths = monthPcts.filter(p => p > threshold).length;
                    if (overMonths === 0) return null;
                    
                    const reassignable = tasks.filter(t => t.assigned_role_id === role.id && t.is_reassignable).length;
                    
                    let recommendation = "Task reassignment";
                    if (overMonths >= 6) recommendation = "New hire recommended";
                    else if (overMonths >= 3 && reassignable === 0) recommendation = "Role redesign or new hire";
                    else if (overMonths >= 3) recommendation = "Task reassignment or temporary support";
                    
                    return (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <span className="font-medium">{role.name}</span>
                          {role.assigned_person_name && <span className="text-muted-foreground ml-1">({role.assigned_person_name})</span>}
                          <span className="text-sm text-muted-foreground ml-3">{overMonths} months over {threshold}%</span>
                        </div>
                        <div className="text-sm">
                          <Badge variant="outline">{recommendation}</Badge>
                          {reassignable > 0 && <span className="text-xs text-muted-foreground ml-2">{reassignable} reassignable tasks</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
