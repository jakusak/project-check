import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HUBS } from '@/lib/facilityProjects';

export function FacilityShell({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const location = useLocation();
  const links = [
    { to: '/facilities/overview', label: 'Overview' },
    { to: '/facilities/timeline', label: 'Timeline' },
    { to: '/facilities/review', label: 'Weekly review' },
    { to: '/facilities/projects', label: 'Projects' },
    { to: '/facilities/contractors', label: 'Contractors' },
  ];
  return <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-base leading-relaxed">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{title}</h1>{actions}</div>
    <nav aria-label="Facilities pages" className="flex flex-wrap gap-1 border-b pb-2">
      {links.map(link => <Button key={link.to} variant={location.pathname === link.to ? 'secondary' : 'ghost'} size="sm" asChild><Link to={link.to}>{link.label}</Link></Button>)}
    </nav>
    <nav aria-label="Hub request dashboards" className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground mr-1">Requests:</span>{HUBS.map(h => <Link className="text-accent underline-offset-4 hover:underline" key={h.key} to={`/facilities/${h.legacy}`}>{h.label}</Link>)}</nav>
    {children}
  </div>;
}
