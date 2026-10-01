import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useOpsTeamMembers, useOpsTasks } from '@/hooks/useOpsTasks';
import { FacilityShell } from '@/components/facilities/FacilityShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HUBS, Project, Milestone, dateLabel, todayParis, useFacilityData, useFacilityEdit, useFacilityMutation, hubName } from '@/lib/facilityProjects';
import { toast } from 'sonner';

const sites: Record<string, string[]> = { fr: ['Le Velo','Europe Bay','Silo','Training Centre','Annex','Velo II','801 France office','La Centrale'], cz: ['Main building','Claude','Annex'], it: ['801 Italy','Country Club','Annex'], hr: ['Dicmo'] };
const empty: Partial<Project> = { title: '', hub: 'fr', site: null, summary: null, owner_id: null, co_owner_id: null, contractor_id: null, status: 'Idea', health: 'On track', health_note: null, priority: 'Medium', start_date: null, target_date: null, completed_date: null, decision_needed: false, decision_note: null, next_step: null };
function ProjectForm({ project, onSaved }: { project?: Project; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Project>>({ ...empty, ...project });
  useEffect(() => { setForm({ ...empty, ...project }); }, [project]);
  const { data: members = [] } = useOpsTeamMembers();
  const { contractors } = useFacilityData();
  const { canEdit } = useFacilityEdit(form.hub || 'fr');
  const mutation = useFacilityMutation();
  const set = (values: Partial<Project>) => setForm(prev => ({ ...prev, ...values }));
  const save = () => {
    if (!form.title?.trim()) return toast.error('Add a project title');
    if (form.health !== 'On track' && !form.health_note?.trim()) return toast.error('Add a health note');
    const { id, created_at, updated_at, last_reviewed_at, ...values } = form;
    mutation.mutate({ table: 'facility_projects', id: project?.id, values }, { onSuccess: onSaved });
  };
  const field = (label: string, key: keyof Project, type = 'text') => <div className="space-y-1"><Label htmlFor={`project-${key}`}>{label}</Label><Input id={`project-${key}`} type={type} value={String(form[key] ?? '')} onChange={e => set({ [key]: e.target.value || null })} disabled={!canEdit} /></div>;
  const dropdown = (label: string, key: keyof Project, options: { value: string; label: string }[], optional = false) => <div className="space-y-1"><Label>{label}</Label><Select value={String(form[key] ?? 'none')} onValueChange={v => set({ [key]: v === 'none' ? null : v })} disabled={!canEdit}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{optional && <SelectItem value="none">None</SelectItem>}{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
  return <div className="space-y-5"><div className="grid md:grid-cols-2 gap-4">
    {field('Project title', 'title')}
    {dropdown('Hub', 'hub', HUBS.map(h => ({ value: h.key, label: h.label })))}
    {dropdown('Site', 'site', (sites[form.hub || 'fr'] || []).map(s => ({ value: s, label: s })), true)}
    {dropdown('Status', 'status', ['Idea','Planned','In progress','On hold','Done','Cancelled'].map(s => ({ value: s, label: s })))}
    {dropdown('Health', 'health', ['On track','At risk','Off track'].map(s => ({ value: s, label: s })))}
    {form.health !== 'On track' && field('Health note (required)', 'health_note')}
    {dropdown('Priority', 'priority', ['High','Medium','Low'].map(s => ({ value: s, label: s })))}
    {dropdown('Owner', 'owner_id', members.filter(m => m.hub === HUBS.find(h => h.key === form.hub)?.legacy).map(m => ({ value: m.id, label: m.name })), true)}
    {dropdown('Co-owner', 'co_owner_id', members.map(m => ({ value: m.id, label: m.name })), true)}
    {dropdown('Contractor', 'contractor_id', contractors.filter(c => c.hub === form.hub).map(c => ({ value: c.id, label: c.company_name })), true)}
    {field('Start date', 'start_date', 'date')}{field('Target date', 'target_date', 'date')}
    {form.status === 'Done' && field('Completed date', 'completed_date', 'date')}
    {field('Next step', 'next_step')}
  </div><div className="space-y-1"><Label htmlFor="summary">Summary</Label><Textarea id="summary" value={form.summary || ''} onChange={e => set({ summary: e.target.value })} disabled={!canEdit} rows={3} /></div>
    <label className="flex gap-2 items-center"><Checkbox checked={form.decision_needed} onCheckedChange={v => set({ decision_needed: !!v })} disabled={!canEdit} />Decision needed</label>
    {form.decision_needed && field('Decision needed', 'decision_note')}
    {canEdit && <Button onClick={save} disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save project'}</Button>}
  </div>;
}
export default function FacilityProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, milestones, dependencies, contractors, loading } = useFacilityData();
  const p = projects.find(p => p.id === id);
  const { canEdit } = useFacilityEdit(p?.hub || 'fr');
  const { data: members = [] } = useOpsTeamMembers();
  const { data: tasks = [] } = useOpsTasks();
  const { user } = useAuth();
  const mutation = useFacilityMutation();
  const qc = useQueryClient();
  const { data: updates = [] } = useQuery({ queryKey: ['facility-updates', id], enabled: !!id && id !== 'new', queryFn: async () => { const { data, error } = await supabase.from('facility_project_updates').select('*').eq('project_id', id || '').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const [newMilestone, setNewMilestone] = useState('');
  const [due, setDue] = useState('');
  const [kind, setKind] = useState('Milestone');
  const [linkId, setLinkId] = useState('');
  const [depId, setDepId] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [updateKind, setUpdateKind] = useState('Update');
  const [filter, setFilter] = useState('all');
  const myMilestones = milestones.filter(m => m.project_id === p?.id).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.sort_order - b.sort_order);
  const copy = async () => { if (!p) return; await navigator.clipboard.writeText([`${p.title} · ${hubName(p.hub)}`, `Status: ${p.status} · ${p.health}${p.health_note ? ` — ${p.health_note}` : ''}`, `Target: ${dateLabel(p.target_date)}`, `Next step: ${p.next_step || 'Not set'}`, `Open decisions: ${p.decision_needed ? p.decision_note || 'Decision needed' : 'None'}`, 'Upcoming milestones:', ...myMilestones.filter(m => !m.done).slice(0, 5).map(m => `- ${m.title} (${dateLabel(m.due_date)})`)].join('\n')); toast.success('Summary copied'); };
  if (id === 'new') return <FacilityShell title="New project"><ProjectForm onSaved={() => navigate('/facilities/projects')} /></FacilityShell>;
  if (loading) return <FacilityShell title="Project"><p>Loading…</p></FacilityShell>;
  if (!p) return <FacilityShell title="Project not found"><p>This project is not available.</p></FacilityShell>;
  const linkTask = async () => { if (!linkId) return; const { error } = await supabase.from('ops_tasks').update({ project_id: p.id }).eq('id', linkId).eq('hub', HUBS.find(h => h.key === p.hub)?.legacy || ''); if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ['ops-tasks'] }); setLinkId(''); toast.success('Request linked'); } };
  return <FacilityShell title={p.title} actions={<Button variant="outline" onClick={copy}>Copy summary</Button>}>
    <ProjectForm project={p} onSaved={() => {}} />
    <Tabs defaultValue="milestones" className="mt-8"><TabsList className="flex flex-wrap h-auto justify-start">{['Milestones','Tasks','Dependencies','Updates','Files'].map(t => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>
      <TabsContent value="milestones" className="space-y-4"><h2 className="text-xl font-semibold">Milestones ({myMilestones.filter(m => m.done).length}/{myMilestones.length})</h2>{myMilestones.map((m, index) => <div key={m.id} className="flex flex-wrap items-center gap-3 border-b py-3"><Checkbox aria-label={`Complete ${m.title}`} checked={m.done} disabled={!canEdit} onCheckedChange={v => mutation.mutate({ table: 'facility_milestones', id: m.id, values: { done: !!v, done_date: v ? todayParis() : null } })} /><span className={m.done ? 'line-through text-muted-foreground' : ''}>{m.title}</span><span className="text-sm text-muted-foreground">{m.type} · {dateLabel(m.due_date)}</span>{canEdit && <div className="ml-auto flex gap-1"><Button size="sm" variant="ghost" disabled={index === 0} onClick={() => { mutation.mutate({ table: 'facility_milestones', id: m.id, values: { due_date: myMilestones[index - 1]?.due_date, sort_order: m.sort_order - 1 } }); }}>↑</Button><Button size="sm" variant="ghost" disabled={index === myMilestones.length - 1} onClick={() => mutation.mutate({ table: 'facility_milestones', id: m.id, values: { due_date: myMilestones[index + 1]?.due_date, sort_order: m.sort_order + 1 } })}>↓</Button></div>}</div>)}
        {!myMilestones.length && <p className="text-muted-foreground">No milestones yet. Add the first checkpoint below.</p>}{canEdit && <div className="flex flex-wrap gap-2"><Input aria-label="Milestone title" placeholder="Milestone title" className="w-64" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} /><Input aria-label="Milestone due date" type="date" className="w-44" value={due} onChange={e => setDue(e.target.value)} /><Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Milestone type" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{['Milestone','Deadline','Decision point'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Button disabled={!newMilestone.trim()} onClick={() => { mutation.mutate({ table: 'facility_milestones', values: { project_id: p.id, title: newMilestone, due_date: due || null, type: kind, sort_order: myMilestones.length } }); setNewMilestone(''); setDue(''); }}>Add milestone</Button></div>}
      </TabsContent>
      <TabsContent value="tasks" className="space-y-4"><h2 className="text-xl font-semibold">Linked requests</h2>{tasks.filter(t => t.project_id === p.id).map(t => <div key={t.id} className="border-b py-2">{t.title} · {t.status} · {dateLabel(t.target_end_date)}</div>)}{!tasks.some(t => t.project_id === p.id) && <p className="text-muted-foreground">No linked requests. Link a request below.</p>}{canEdit && <div className="flex gap-2 flex-wrap"><Select value={linkId} onValueChange={setLinkId}><SelectTrigger aria-label="Choose request" className="w-72"><SelectValue placeholder="Choose existing request" /></SelectTrigger><SelectContent>{tasks.filter(t => t.hub === HUBS.find(h => h.key === p.hub)?.legacy && !t.project_id).map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select><Button disabled={!linkId} onClick={linkTask}>Link request</Button><Button variant="outline" asChild><Link to={`/ops-tasks/request?hub=${HUBS.find(h => h.key === p.hub)?.legacy}`}>New request</Link></Button></div>}</TabsContent>
      <TabsContent value="dependencies" className="space-y-4"><h2 className="text-xl font-semibold">Depends on</h2>{dependencies.filter(d => d.project_id === p.id).map(d => { const other = projects.find(x => x.id === d.depends_on_project_id); const m = milestones.find(x => x.id === d.depends_on_milestone_id); return <p key={d.id} className="border-b py-2">↖ {other ? <Link className="text-accent hover:underline" to={`/facilities/projects/${other.id}`}>{other.title}</Link> : m?.title} {d.note && `· ${d.note}`}</p>; })}{canEdit && <div className="flex gap-2"><Select value={depId} onValueChange={setDepId}><SelectTrigger aria-label="Depends on project" className="w-72"><SelectValue placeholder="Choose project" /></SelectTrigger><SelectContent>{projects.filter(x => x.id !== p.id).map(x => <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>)}</SelectContent></Select><Button disabled={!depId} onClick={() => { mutation.mutate({ table: 'facility_dependencies', values: { project_id: p.id, depends_on_project_id: depId } }); setDepId(''); }}>Add dependency</Button></div>}<h2 className="text-xl font-semibold">Blocks</h2>{dependencies.filter(d => d.depends_on_project_id === p.id).map(d => <p key={d.id}>→ <Link className="text-accent hover:underline" to={`/facilities/projects/${d.project_id}`}>{projects.find(x => x.id === d.project_id)?.title}</Link></p>)}</TabsContent>
      <TabsContent value="updates" className="space-y-4"><div className="flex justify-between"><h2 className="text-xl font-semibold">Updates</h2><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Update kind" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All updates</SelectItem>{['Update','Decision','Risk','Meeting note'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>{updates.filter(u => filter === 'all' || u.kind === filter).map(u => <div className="border-b py-2" key={u.id}><span className="text-sm text-muted-foreground">{u.kind} · {dateLabel(u.created_at)}</span><p>{u.text}</p></div>)}{!updates.length && <p className="text-muted-foreground">No updates yet. Record the latest progress below.</p>}{canEdit && <div className="space-y-2"><Select value={updateKind} onValueChange={setUpdateKind}><SelectTrigger aria-label="New update type" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{['Update','Decision','Risk','Meeting note'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Textarea aria-label="Update text" value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="What changed?" /><Button disabled={!updateText.trim()} onClick={() => { mutation.mutate({ table: 'facility_project_updates', values: { project_id: p.id, text: updateText, kind: updateKind, author_id: user?.id } }); setUpdateText(''); }}>Post update</Button></div>}</TabsContent>
      <TabsContent value="files"><h2 className="text-xl font-semibold">Files</h2><p className="text-muted-foreground">File uploads are not available yet.</p></TabsContent>
    </Tabs>
  </FacilityShell>;
}
