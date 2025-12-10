import { useParams, useNavigate } from 'react-router-dom';
import { useInventoryMove, useInventoryMoveLines, useUpdateMoveStatus } from '@/hooks/useInventoryMoves';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InventoryMoveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: move, isLoading: moveLoading } = useInventoryMove(id);
  const { data: lines = [], isLoading: linesLoading } = useInventoryMoveLines(id);
  const updateStatus = useUpdateMoveStatus();

  if (moveLoading || linesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!move) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Move not found</p>
        <Button variant="outline" onClick={() => navigate('/inventory/moves')}>
          Back to Moves
        </Button>
      </div>
    );
  }

  const canUpdateStatus = isAdmin && move.status === 'submitted';

  const handleComplete = () => {
    updateStatus.mutate({ moveId: move.id, status: 'completed' });
  };

  const handleCancel = () => {
    updateStatus.mutate({ moveId: move.id, status: 'cancelled' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/moves')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Inventory Move</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(move.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <Badge className={statusColors[move.status] || ''} variant="outline">
          {move.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Ops Area</dt>
                <dd className="font-medium">{move.source_ops_area}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Location</dt>
                <dd className="font-medium">{move.source_location_name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Ops Area</dt>
                <dd className="font-medium">{move.target_ops_area}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Location</dt>
                <dd className="font-medium">{move.target_location_name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {move.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{move.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items ({lines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.sku}</TableCell>
                  <TableCell>{line.equipment_items?.name || '-'}</TableCell>
                  <TableCell>{line.equipment_items?.category || '-'}</TableCell>
                  <TableCell className="text-right">{line.qty}</TableCell>
                  <TableCell className="max-w-xs truncate">{line.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {move.completed_at && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Completed on {format(new Date(move.completed_at), 'MMM d, yyyy h:mm a')}
            </p>
          </CardContent>
        </Card>
      )}

      {move.cancelled_at && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Cancelled on {format(new Date(move.cancelled_at), 'MMM d, yyyy h:mm a')}
            </p>
          </CardContent>
        </Card>
      )}

      {canUpdateStatus && (
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateStatus.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Move
          </Button>
          <Button onClick={handleComplete} disabled={updateStatus.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Completed
          </Button>
        </div>
      )}
    </div>
  );
}
