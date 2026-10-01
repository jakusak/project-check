import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FacilityShell } from '@/components/facilities/FacilityShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HUBS, Contractor, useFacilityData, useFacilityEdit, useFacilityMutation, hubName } from '@/lib/facilityProjects';
import { useOpsTasks } from '@/hooks/useOpsTasks';

const blank: Partial<Contractor> = { company_name: '', hub: 'fr', contact_name: '', phone: '', email: '', trade: '', notes: '' };
export default function FacilityContractors() {
  const { contractors, projects } = useFacilityData();
  const { data: tasks = [] } = useOpsTasks();
  const [selected, setSelected] = useState<Partial<Contractor> | null>(null);
  const { canEdit } = useFacilityEdit(selected?.hub || 'fr');
  const mutation = useFacilityMutation();
  const set = (key: keyof Contractor, value: string) => setSelected(s => ({ ...s, [key]: value }));
  return <FacilityShell title="Contractors" actions={<Button onClick={() => setSelected({ ...blank })}>Add contractor</Button>}>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{['Company','Contact','Trade','Hub','Projects'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{contractors.map(c => <tr key={c.id} className="border-b"><td className="p-3"><Button variant="link" onClick={() => setSelected(c)}>{c.company_name}</Button></td><td className="p-3">{c.contact_name || '—'}</td><td className="p-3">{c.trade || '—'}</td><td className="p-3">{hubName(c.hub)}</td><td className="p-3">{projects.filter(p => p.contractor_id === c.id).length}</td></tr>)}</tbody></table>{!contractors.length && <p className="py-8 text-muted-foreground">No contractors yet. Add a company to link it to projects.</p>}</div>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.id ? selected.company_name : 'Add contractor'}</DialogTitle></DialogHeader>{selected && <div className="space-y-3"><div><Label>Hub</Label><Select value={selected.hub} onValueChange={v => set('hub', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{HUBS.map(h => <SelectItem key={h.key} value={h.key}>{h.label}</SelectItem>)}</SelectContent></Select></div>{(['company_name','contact_name','phone','email','trade'] as const).map(key => <div key={key}><Label htmlFor={key}>{key.replace('_',' ')}</Label><Input id={key} value={selected[key] || ''} onChange={e => set(key, e.target.value)} disabled={!canEdit} /></div>)}<div><Label htmlFor="contractor-notes">Notes</Label><Textarea id="contractor-notes" value={selected.notes || ''} onChange={e => set('notes', e.target.value)} disabled={!canEdit} /></div>{canEdit && <Button disabled={!selected.company_name?.trim()} onClick={() => mutation.mutate({ table: 'facility_contractors', id: selected.id, values: { company_name: selected.company_name, contact_name: selected.contact_name, phone: selected.phone, email: selected.email, trade: selected.trade, hub: selected.hub, notes: selected.notes } }, { onSuccess: () => setSelected(null) })}>Save</Button>}{selected.id && <><h3 className="font-semibold">Linked projects</h3>{projects.filter(p => p.contractor_id === selected.id).map(p => <Link className="block text-accent hover:underline" key={p.id} to={`/facilities/projects/${p.id}`}>{p.title}</Link>)}<h3 className="font-semibold">Linked tasks</h3>{tasks.filter(t => t.main_owner?.name === selected.company_name).map(t => <p key={t.id}>{t.title}</p>)}</>}</div>}</DialogContent></Dialog>
  </FacilityShell>;
}
