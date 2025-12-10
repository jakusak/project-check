import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryMoves } from '@/hooks/useInventoryMoves';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InventoryMovesList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [opsAreaFilter, setOpsAreaFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: moves = [], isLoading } = useInventoryMoves({
    status: statusFilter || undefined,
    opsArea: opsAreaFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate ? `${endDate}T23:59:59` : undefined,
  });

  const { data: opsAreas = [] } = useQuery({
    queryKey: ['ops-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_area_to_hub')
        .select('ops_area')
        .order('ops_area');
      if (error) throw error;
      return [...new Set(data.map((d) => d.ops_area))];
    },
  });

  const clearFilters = () => {
    setStatusFilter('');
    setOpsAreaFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory Moves</h1>
        <Button onClick={() => navigate('/inventory/moves/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Move
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ops Area</label>
              <Select value={opsAreaFilter} onValueChange={setOpsAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  {opsAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : moves.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No inventory moves found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moves.map((move) => (
                  <TableRow
                    key={move.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/inventory/moves/${move.id}`)}
                  >
                    <TableCell>{format(new Date(move.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{move.source_ops_area}</div>
                      <div className="text-sm text-muted-foreground">{move.source_location_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{move.target_ops_area}</div>
                      <div className="text-sm text-muted-foreground">{move.target_location_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[move.status] || ''}>
                        {move.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{move.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
