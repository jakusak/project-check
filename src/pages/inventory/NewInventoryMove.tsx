import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCreateInventoryMove } from '@/hooks/useInventoryMoves';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface MoveLine {
  equipment_item_id?: string;
  sku: string;
  qty: number;
  notes?: string;
  name?: string;
}

export default function NewInventoryMove() {
  const navigate = useNavigate();
  const createMove = useCreateInventoryMove();

  const [sourceOpsArea, setSourceOpsArea] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [targetOpsArea, setTargetOpsArea] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<MoveLine[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

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

  const { data: equipmentItems = [] } = useQuery({
    queryKey: ['equipment-items-for-move'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('id, sku, name, category')
        .eq('availability', true)
        .order('sku');
      if (error) throw error;
      return data;
    },
  });

  const filteredEquipment = equipmentItems.filter(
    (item) =>
      item.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(skuSearch.toLowerCase())
  );

  const addLine = (item: typeof equipmentItems[0]) => {
    if (lines.find((l) => l.sku === item.sku)) {
      toast.error('Item already added');
      return;
    }
    setLines([...lines, { equipment_item_id: item.id, sku: item.sku, qty: 1, name: item.name }]);
    setSkuSearch('');
  };

  const updateLineQty = (index: number, qty: number) => {
    const updated = [...lines];
    updated[index].qty = Math.max(1, qty);
    setLines(updated);
  };

  const updateLineNotes = (index: number, notes: string) => {
    const updated = [...lines];
    updated[index].notes = notes;
    setLines(updated);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!sourceOpsArea || !sourceLocation || !targetOpsArea || !targetLocation) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (lines.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    await createMove.mutateAsync({
      source_ops_area: sourceOpsArea,
      source_location_name: sourceLocation,
      target_ops_area: targetOpsArea,
      target_location_name: targetLocation,
      notes: notes || undefined,
      lines: lines.map((l) => ({
        equipment_item_id: l.equipment_item_id,
        sku: l.sku,
        qty: l.qty,
        notes: l.notes,
      })),
    });

    navigate('/inventory/moves');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/moves')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">New Inventory Move</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ops Area *</Label>
              <Select value={sourceOpsArea} onValueChange={setSourceOpsArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source ops area" />
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
              <Label>Location Name *</Label>
              <Input
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                placeholder="e.g., Warehouse A, Storage Room 1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ops Area *</Label>
              <Select value={targetOpsArea} onValueChange={setTargetOpsArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target ops area" />
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
              <Label>Location Name *</Label>
              <Input
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="e.g., Field Station B, Van #123"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items to Move</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Search by SKU or name..."
              />
              {skuSearch && filteredEquipment.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
                  {filteredEquipment.slice(0, 10).map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex justify-between items-center"
                      onClick={() => addLine(item)}
                    >
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-muted-foreground text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lines.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{line.sku}</TableCell>
                    <TableCell>{line.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateLineQty(index, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.notes || ''}
                        onChange={(e) => updateLineNotes(index, e.target.value)}
                        placeholder="Optional notes"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeLine(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {lines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Search for items above to add them to this move</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this inventory move..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => navigate('/inventory/moves')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createMove.isPending}>
          {createMove.isPending ? 'Submitting...' : 'Submit Move'}
        </Button>
      </div>
    </div>
  );
}
