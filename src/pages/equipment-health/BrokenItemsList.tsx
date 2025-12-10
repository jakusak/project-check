import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBrokenItemReports } from "@/hooks/useEquipmentHealth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-destructive text-destructive-foreground",
  in_maintenance: "bg-yellow-500 text-white",
  resolved: "bg-green-600 text-white",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-destructive text-destructive-foreground",
};

export default function BrokenItemsList() {
  const navigate = useNavigate();
  const [opsAreas, setOpsAreas] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    opsArea: "__all__",
    status: "__all__",
    severity: "__all__",
  });

  const { data: reports, isLoading } = useBrokenItemReports(filters);

  useEffect(() => {
    loadOpsAreas();
  }, []);

  async function loadOpsAreas() {
    const { data } = await supabase
      .from("ops_area_to_hub")
      .select("ops_area")
      .order("ops_area");
    setOpsAreas([...new Set(data?.map((a) => a.ops_area) || [])]);
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Broken Item Reports
        </h1>
        <Button onClick={() => navigate("/broken-items/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Report Broken Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={filters.opsArea}
                onValueChange={(v) => setFilters((f) => ({ ...f, opsArea: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Areas</SelectItem>
                  {opsAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="in_maintenance">In Maintenance</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                value={filters.severity}
                onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
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
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Ops Area</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/broken-items/${report.id}`)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(report.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{report.sku}</TableCell>
                      <TableCell>{report.equipment_item?.name || "-"}</TableCell>
                      <TableCell>{report.ops_area}</TableCell>
                      <TableCell>{report.location_name}</TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_COLORS[report.severity]}>
                          {report.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[report.status]}>
                          {report.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.creator_email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No broken item reports found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
