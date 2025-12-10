import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaintenanceRecords } from "@/hooks/useEquipmentHealth";
import { format } from "date-fns";
import { Wrench, Plus, Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500 text-white",
  completed: "bg-green-600 text-white",
};

export default function MaintenanceList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "__all__",
  });

  const { data: records, isLoading } = useMaintenanceRecords(filters);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          Maintenance Records
        </h1>
        <Button onClick={() => navigate("/maintenance/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : records && records.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/maintenance/${record.id}`)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(record.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.sku}</TableCell>
                      <TableCell>{record.equipment_item?.name || "-"}</TableCell>
                      <TableCell>{record.maintenance_type}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[record.status]}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.completed_at
                          ? format(new Date(record.completed_at), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.creator_email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No maintenance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
