import { useState } from 'react';
import { Link } from 'react-router-dom';
import { startOfWeek, format, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useOpsTasks } from '@/hooks/useOpsTasks';
import { FacilityShell } from '@/components/facilities/FacilityShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFacilityData, useFacilityEdit, useFacilityMutation, Project, Milestone, dateLabel, daysFromNow, todayParis, hubName } from '@/lib/facilityProjects';

function ReviewRow({ p, milestone }: { p: Project; milestone?: Milestone }) {
  const mutation = useFacilityMutation();
  const { canEdit } = useFacilityEdit(p.hub);
  const { user } = useAuth();
  const [nextStep, setNextStep] = useState(p.next_step || '');
  const [update, setUpdate] = useState('');
  const [healthNote, setHealthNote] = useState(p.health_note || '');
  const [health, setHealth] = useState(p.health);
  const save = (values: Record<string, unknown>) => mutation.mutate({ table: 'facility_projects', id: p.id, values });
  return <div className="border-b py-3 space-y-2"><div className="flex flex-wrap gap-2 items-center"><Link className="font-medium text-accent hover:underline" to={`/facilities/projects/${p.id}`}>{p.title}</Link><span className="text-sm text-muted-foreground">{hubName(p.hub)} · {p.health}</span></div>
    {milestone && <p className="text-sm">{milestone.type}: {milestone.title} · {dateLabel(milestone.due_date)} {canEdit && !milestone.done && <Button size="sm" variant="outline" onClick={() => mutation.mutate({ table: 'facility_milestones', id: milestone.id, values: { done: true, done_date: todayParis() } })}>Mark done</Button>}</p>}
    {p.health_note && <p className="text-sm text-muted-foreground">{p.health_note}</p>}
    {canEdit && <div className="flex flex-wrap gap-2 items-center">
      <Select value={health} onValueChange={setHealth}><SelectTrigger aria-label="Health" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{['On track','At risk','Off track'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      {health !== 'On track' && <Input aria-label="Health note" placeholder="Why is it at risk?" className="w-48" value={healthNote} onChange={e => setHealthNote(e.target.value)} />}
      <Button size="sm" variant="outline" disabled={health !== 'On track' && !healthNote.trim()} onClick={() => save({ health, health_note: health === 'On track' ? null : healthNote })}>Save health</Button>
      <Input aria-label="Next step" placeholder="Next step" className="w-48" value={nextStep} onChange={e => setNextStep(e.target.value)} /><Button size="sm" variant="outline" onClick={() => save({ next_step: nextStep })}>Save step</Button>
      <Input aria-label="Add update" placeholder="Add update" className="w-48" value={update} onChange={e => setUpdate(e.target.value)} /><Button size="sm" variant="outline" disabled={!update.trim()} onClick={() => { mutation.mutate({ table: 'facility_project_updates', values: { project_id: p.id, author_id: user?.id, text: update, kind: 'Update' } }); setUpdate(''); }}>Post update</Button>
      <Button size="sm" variant="outline" onClick={() => save({ last_reviewed_at: new Date().toISOString() })}>Mark reviewed</Button>
    </div>}
  </div>;
}
export default function FacilityReview() {
  const { projects, milestones, contractors, loading } = useFacilityData();
  const { data: tasks = [] } = useOpsTasks();
  const { user } = useAuth();
  const { canEdit } = useFacilityEdit('all');
  const mutation = useFacilityMutation();
  const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: note } = useQuery({ queryKey: ['facility-weekly-notes', week], queryFn: async () => { const { data, error } = await supabase.from('facility_weekly_notes').select('*').eq('week_start', week).maybeSingle(); if (error) throw error; return data; } });
  const [draft, setDraft] = useState<string | null>(null);
  const lastReview = projects.map(p => p.last_reviewed_at).filter(Boolean).sort().slice(-1)[0];
  const active = projects.filter(p => !['Done', 'Cancelled'].includes(p.status));
  const old = format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const sections: [string, { p: Project; m?: Milestone }[]][] = [
    ['Overdue milestones', milestones.filter(m => !m.done && m.due_date && daysFromNow(m.due_date) < 0).map(m => ({ p: projects.find(p => p.id === m.project_id), m })).filter((x): x is { p: Project; m: Milestone } => !!x.p)],
    ['Due in the next 14 days', [...milestones.filter(m => !m.done && m.due_date && daysFromNow(m.due_date) >= 0 && daysFromNow(m.due_date) <= 14).map(m => ({ p: projects.find(p => p.id === m.project_id), m })), ...tasks.filter(t => t.project_id && t.target_end_date && !['done','cancelled'].includes(t.status) && daysFromNow(t.target_end_date) >= 0 && daysFromNow(t.target_end_date) <= 14).map(t => ({ p: projects.find(p => p.id === t.project_id) }))].filter((x): x is { p: Project; m?: Milestone } => !!x.p)],
    ['Blocked / On hold', active.filter(p => p.status === 'On hold' || p.health === 'Off track').map(p => ({ p }))],
    ['Waiting on a contractor', active.filter(p => p.contractor_id && p.updated_at.slice(0, 10) <= old).map(p => ({ p }))],
    ['Decisions needed', active.filter(p => p.decision_needed).map(p => ({ p }))],
    ['Not reviewed in 14+ days', active.filter(p => !p.last_reviewed_at || p.last_reviewed_at.slice(0, 10) <= old).map(p => ({ p }))],
    ['Completed since last review', projects.filter(p => p.status === 'Done' && p.completed_date && (!lastReview || p.completed_date >= lastReview.slice(0, 10))).map(p => ({ p }))],
  ];
  return <FacilityShell title="Weekly review"><div className="border-y py-4 space-y-3"><p className="text-sm text-muted-foreground">Week of {dateLabel(week)} · Last review: {dateLabel(lastReview)}</p><label htmlFor="weekly-notes" className="font-medium">This week's notes</label><Textarea id="weekly-notes" rows={3} value={draft ?? note?.text ?? ''} onChange={e => setDraft(e.target.value)} disabled={!canEdit} placeholder="Add notes for this week's meeting" />{canEdit && <Button onClick={() => mutation.mutate({ table: 'facility_weekly_notes', values: { week_start: week, text: draft ?? note?.text ?? '', author: user?.id, updated_at: new Date().toISOString() } })}>Save notes</Button>}</div>
    {loading ? <p>Loading review…</p> : sections.map(([label, rows]) => <section key={label} className="space-y-2"><h2 className="text-xl font-semibold">{label} ({rows.length})</h2>{rows.length ? rows.map((row, i) => <ReviewRow key={`${row.p.id}-${row.m?.id || i}`} p={row.p} milestone={row.m} />) : <p className="text-sm text-muted-foreground">Nothing to review here.</p>}</section>)}
  </FacilityShell>;
}
