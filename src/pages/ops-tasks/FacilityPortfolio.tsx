import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, addMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import { ChevronDown, Download, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FacilityShell } from '@/components/facilities/FacilityShell';
import { HUBS, Project, useFacilityData, hubName, dateLabel, daysFromNow, todayParis, healthClass } from '@/lib/facilityProjects';
import { useOpsTeamMembers } from '@/hooks/useOpsTasks';
import { useAuth } from '@/lib/auth';

function usePortfolioFilters(projects: Project[]) {
  const { user } = useAuth();
  const storage = `facility-filters-${user?.id ?? 'guest'}`;
  const [filters, setFilters] = useState<{ hubs: string[]; owner: string; status: string; health: string; priority: string }>(() => {
    try { return { hubs: [], owner: 'all', status: 'all', health: 'all', priority: 'all', ...JSON.parse(localStorage.getItem(storage) || '{}') }; }
    catch { return { hubs: [], owner: 'all', status: 'all', health: 'all', priority: 'all' }; }
  });
  const change = (patch: Partial<typeof filters>) => { const next = { ...filters, ...patch }; setFilters(next); localStorage.setItem(storage, JSON.stringify(next)); };
  const visible = projects.filter(p => (!filters.hubs.length || filters.hubs.includes(p.hub)) && (filters.owner === 'all' || p.owner_id === filters.owner) && (filters.status === 'all' || p.status === filters.status) && (filters.health === 'all' || p.health === filters.health) && (filters.priority === 'all' || p.priority === filters.priority));
  return { filters, change, visible };
}
function Filters({ filters, change, members }: { filters: ReturnType<typeof usePortfolioFilters>['filters']; change: ReturnType<typeof usePortfolioFilters>['change']; members: { id: string; name: string }[] }) {
  return <div className="flex flex-wrap items-center gap-3 border-y py-3">
    <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">Hubs</span>{HUBS.map(h => <label className="flex items-center gap-1.5" key={h.key}><Checkbox checked={filters.hubs.includes(h.key)} onCheckedChange={checked => change({ hubs: checked ? [...filters.hubs, h.key] : filters.hubs.filter(k => k !== h.key) })} />{h.label}</label>)}</div>
    {[{ key: 'owner', label: 'Owner', options: members.map(m => ({ value: m.id, label: m.name })) }, { key: 'status', label: 'Status', options: ['Idea', 'Planned', 'In progress', 'On hold', 'Done', 'Cancelled'].map(v => ({ value: v, label: v })) }, { key: 'health', label: 'Health', options: ['On track', 'At risk', 'Off track'].map(v => ({ value: v, label: v })) }, { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'].map(v => ({ value: v, label: v })) }].map(f => <Select key={f.key} value={filters[f.key as 'owner' | 'status' | 'health' | 'priority']} onValueChange={v => change({ [f.key]: v })}><SelectTrigger aria-label={f.label} className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>{f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>)}
  </div>;
}
export function ProjectCard({ project: p, count, owner }: { project: Project; count: string; owner?: string }) {
  return <Link to={`/facilities/projects/${p.id}`} className="block rounded-md border bg-card p-4 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent space-y-2">
    <div className="flex items-start justify-between gap-2"><strong className="leading-snug">{p.title}</strong><Badge variant="outline">{hubName(p.hub)}</Badge></div>
    <div className="flex flex-wrap gap-2 items-center text-sm"><span className={healthClass(p.health)}>● {p.health}</span><span>· {p.status}</span>{p.decision_needed && <Badge variant="secondary">Decision needed</Badge>}</div>
    <div className="text-sm text-muted-foreground">{p.site || 'No site'} · {owner || 'Unassigned'} · {dateLabel(p.target_date)}</div>
    <div className="text-sm">Next: {p.next_step || 'Add a next step'} <span className="text-muted-foreground">· {count} milestones</span></div>
  </Link>;
}
export default function FacilityOverview() {
  const { projects, milestones, loading, error } = useFacilityData();
  const { data: members = [] } = useOpsTeamMembers();
  const { filters, change, visible } = usePortfolioFilters(projects);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const now = new Date();
  const quarterStart = format(startOfQuarter(now), 'yyyy-MM-dd');
  const quarterEnd = format(endOfQuarter(now), 'yyyy-MM-dd');
  const keyDates = milestones.filter(m => !m.done && m.due_date && ['Deadline', 'Decision point'].includes(m.type) && visible.some(p => p.id === m.project_id)).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  const stat = [
    ['Active projects', visible.filter(p => !['Idea', 'Done', 'Cancelled'].includes(p.status)).length],
    ['At risk / off track', visible.filter(p => ['At risk', 'Off track'].includes(p.health) && !['Done', 'Cancelled'].includes(p.status)).length],
    ['Milestones overdue', milestones.filter(m => !m.done && m.due_date && daysFromNow(m.due_date) < 0 && visible.some(p => p.id === m.project_id)).length],
    ['Key dates · next 60 days', keyDates.filter(m => m.due_date && daysFromNow(m.due_date) >= 0 && daysFromNow(m.due_date) <= 60).length],
  ] as const;
  const card = (p: Project) => <ProjectCard key={p.id} project={p} owner={members.find(m => m.id === p.owner_id)?.name} count={`${milestones.filter(m => m.project_id === p.id && m.done).length}/${milestones.filter(m => m.project_id === p.id).length}`} />;
  return <FacilityShell title="Facilities overview" actions={<Button asChild><Link to="/facilities/projects/new"><Plus className="h-4 w-4 mr-2" />New project</Link></Button>}>
    {error && <p role="alert" className="text-destructive">Unable to load projects. Please try again.</p>}
    {loading ? <p>Loading projects…</p> : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{stat.map(([label, value]) => <div key={label} className="border-t-2 border-accent bg-card px-4 py-3"><div className="text-3xl font-semibold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}</div>
      <Filters filters={filters} change={change} members={members} />
      <section><Button variant="ghost" onClick={() => setIdeasOpen(!ideasOpen)} aria-expanded={ideasOpen}><ChevronDown className={`h-4 w-4 mr-2 ${ideasOpen ? 'rotate-180' : ''}`} />Ideas ({visible.filter(p => p.status === 'Idea').length})</Button>{ideasOpen && <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">{visible.filter(p => p.status === 'Idea').map(card)}</div>}</section>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">{['Planned', 'In progress', 'On hold', 'Done this quarter'].map(status => {
        const items = visible.filter(p => status === 'Done this quarter' ? p.status === 'Done' && !!p.completed_date && p.completed_date >= quarterStart && p.completed_date <= quarterEnd : p.status === status);
        return <section key={status} className="space-y-3"><h2 className="font-semibold border-b pb-2">{status} <span className="text-muted-foreground">({items.length})</span></h2>{items.length ? items.map(card) : <p className="text-sm text-muted-foreground">No projects here yet.</p>}</section>;
      })}</div>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Key dates</h2>{keyDates.length ? keyDates.map(m => { const p = projects.find(p => p.id === m.project_id); const days = daysFromNow(m.due_date || ''); return <Link key={m.id} to={`/facilities/projects/${m.project_id}`} className="flex flex-wrap justify-between gap-2 border-b py-3 hover:bg-muted/50"><span><strong>{m.title}</strong> · {p?.title} · {hubName(p?.hub || '')}</span><span className={days < 30 ? 'text-destructive font-medium' : 'text-muted-foreground'}>{dateLabel(m.due_date)} · {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</span></Link>; }) : <p className="text-muted-foreground">No key dates yet. Add a deadline or decision point to a project.</p>}</section>
    </>}
  </FacilityShell>;
}

export function FacilityProjectsList() {
  const { projects, milestones, loading } = useFacilityData();
  const { data: members = [] } = useOpsTeamMembers();
  const { filters, change, visible } = usePortfolioFilters(projects);
  const [sort, setSort] = useState<keyof Project>('target_date');
  const [desc, setDesc] = useState(false);
  const sorted = [...visible].sort((a, b) => String(a[sort] || '').localeCompare(String(b[sort] || '')) * (desc ? -1 : 1));
  const exportCsv = () => {
    const fields = ['title', 'hub', 'site', 'status', 'health', 'priority', 'target_date', 'next_step'] as const;
    const csv = [fields.join(','), ...sorted.map(p => fields.map(f => `"${String(p[f] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'facilities-projects.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <FacilityShell title="Projects" actions={<div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />CSV</Button><Button asChild><Link to="/facilities/projects/new"><Plus className="h-4 w-4 mr-2" />New project</Link></Button></div>}>
    <Filters filters={filters} change={change} members={members} />
    {loading ? <p>Loading…</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{(['title','hub','status','health','priority','target_date'] as const).map(f => <th className="p-3 whitespace-nowrap" key={f}><Button variant="ghost" size="sm" onClick={() => { if (sort === f) setDesc(!desc); else { setSort(f); setDesc(false); } }}>{f.replace('_', ' ')} {sort === f ? (desc ? '↓' : '↑') : ''}</Button></th>)}<th className="p-3">Milestones</th></tr></thead><tbody>{sorted.map(p => <tr key={p.id} className="border-b"><td className="p-3 font-medium"><Link className="text-accent hover:underline" to={`/facilities/projects/${p.id}`}>{p.title}</Link></td><td className="p-3">{hubName(p.hub)}</td><td className="p-3">{p.status}</td><td className={`p-3 whitespace-nowrap ${healthClass(p.health)}`}>● {p.health}</td><td className="p-3">{p.priority}</td><td className="p-3 whitespace-nowrap">{dateLabel(p.target_date)}</td><td className="p-3">{milestones.filter(m => m.project_id === p.id && m.done).length}/{milestones.filter(m => m.project_id === p.id).length}</td></tr>)}</tbody></table>{!sorted.length && <p className="py-8 text-muted-foreground">No projects match. Change the filters or add a project.</p>}</div>}
  </FacilityShell>;
}

export function FacilityTimeline() {
  const { projects, milestones, dependencies, loading } = useFacilityData();
  const [zoom, setZoom] = useState('18 months');
  const [offset, setOffset] = useState(0);
  const start = zoom === '18 months' ? addMonths(new Date(2026, 9, 1), offset * 6) : zoom === '6 months' ? addMonths(new Date(new Date().getFullYear(), new Date().getMonth(), 1), offset * 6) : addMonths(startOfQuarter(new Date()), offset * 3);
  const months = zoom === '18 months' ? 21 : zoom === '6 months' ? 6 : 3;
  const end = addMonths(start, months);
  const startTime = start.getTime(); const span = end.getTime() - startTime;
  const position = (date: string) => Math.max(0, Math.min(100, ((new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime() - startTime) / span) * 100));
  const inRange = (date?: string | null) => !!date && date >= format(start, 'yyyy-MM-dd') && date < format(end, 'yyyy-MM-dd');
  return <FacilityShell title="Project timeline" actions={<div className="flex gap-2 items-center"><Select value={zoom} onValueChange={v => { setZoom(v); setOffset(0); }}><SelectTrigger aria-label="Timeline range" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{['Quarter','6 months','18 months'].map(v => <SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => setOffset(offset - 1)}>←</Button><Button variant="outline" onClick={() => setOffset(offset + 1)}>→</Button></div>}>
    {loading ? <p>Loading…</p> : <div className="overflow-x-auto border rounded-md"><div className="min-w-[820px]">
      <div className="grid grid-cols-[230px_1fr] border-b text-sm font-medium"><div className="p-3">Projects</div><div className="flex">{Array.from({ length: months }, (_, i) => <div className="flex-1 border-l p-3 text-center" key={i}>{format(addMonths(start, i), 'MMM yy')}</div>)}</div></div>
      <div className="relative"><div className="absolute top-0 bottom-0 border-l-2 border-accent z-10 pointer-events-none" style={{ left: `calc(230px + (100% - 230px) * ${position(todayParis()) / 100})`, display: inRange(todayParis()) ? undefined : 'none' }}><span className="bg-accent text-accent-foreground text-xs px-1">Today</span></div>
        {milestones.filter(m => m.type === 'Deadline' && inRange(m.due_date)).map(m => <div key={m.id} className="absolute top-0 bottom-0 border-l border-dashed border-destructive pointer-events-none" style={{ left: `calc(230px + (100% - 230px) * ${position(m.due_date || '') / 100})` }} title={`Deadline: ${m.title}`} />)}
        {HUBS.map(h => <div key={h.key}><h2 className="px-3 py-2 bg-muted font-semibold text-sm">{h.label}</h2>{projects.filter(p => p.hub === h.key).map(p => {
          const from = p.start_date || p.created_at.slice(0, 10); const to = p.target_date || from;
          const left = position(from); const right = position(to);
          const deps = dependencies.filter(d => d.project_id === p.id).map(d => projects.find(other => other.id === d.depends_on_project_id)?.title).filter(Boolean);
          return <div key={p.id} className="grid grid-cols-[230px_1fr] border-b min-h-16"><Link title={p.title} to={`/facilities/projects/${p.id}`} className="px-3 py-2 text-sm leading-snug text-accent hover:underline truncate">{p.title}{deps.length > 0 && <span className="block text-xs text-muted-foreground truncate" title={`Depends on: ${deps.join(', ')}`}>↖ Depends on: {deps.join(', ')}</span>}</Link><div className="relative border-l bg-muted/20"><Link aria-label={`${p.title}, ${p.health}`} title={`${p.health} · ${dateLabel(from)} – ${dateLabel(to)}`} to={`/facilities/projects/${p.id}`} className={`absolute top-4 h-7 rounded-sm border text-xs font-medium px-2 whitespace-nowrap overflow-hidden ${p.health === 'On track' ? 'bg-accent/30 border-accent' : p.health === 'At risk' ? 'bg-warning/30 border-warning' : 'bg-destructive/30 border-destructive'}`} style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }}>{p.health}</Link>{milestones.filter(m => m.project_id === p.id && inRange(m.due_date)).map(m => <Link key={m.id} to={`/facilities/projects/${p.id}`} title={`${m.type}: ${m.title} · ${dateLabel(m.due_date)}`} className={`absolute top-3.5 z-10 text-lg leading-none ${m.type === 'Deadline' ? 'text-destructive' : 'text-accent'}`} style={{ left: `${position(m.due_date || '')}%` }}>◆</Link>)}</div></div>;
        })}{!projects.some(p => p.hub === h.key) && <p className="p-3 text-sm text-muted-foreground">No projects yet. Add one from Projects.</p>}</div>)}
      </div></div></div>}
    <p className="text-sm text-muted-foreground">◆ Milestone · red ◆ Deadline · dashed line Deadline · ↖ Dependency · bars show project health.</p>
  </FacilityShell>;
}
