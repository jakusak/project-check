import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupplyRequests, SupplyRequest } from "@/hooks/useSupplyRequests";
import { toast } from "sonner";
import { Plus, Search, ShoppingCart, Package, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<SupplyRequest["status"], string> = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  closed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const statusLabels: Record<SupplyRequest["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
};

const priorityColors: Record<SupplyRequest["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const categoryLabels: Record<SupplyRequest["category"], string> = {
  kitchen_supplies: "Kitchen",
  office_supplies: "Office",
};

export default function SupplyDashboard() {
  const { data: requests = [], isLoading, updateStatus } = useSupplyRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter === "new") {
      list = list.filter((r) => r.status === "open");
    } else if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.items.toLowerCase().includes(q) ||
          r.requested_by.toLowerCase().includes(q) ||
          categoryLabels[r.category].toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, search]);

  const counts = useMemo(() => ({
    open: requests.filter((r) => r.status === "open").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    closed: requests.filter((r) => r.status === "closed").length,
    total: requests.length,
  }), [requests]);

  const handleStatusChange = (id: string, newStatus: SupplyRequest["status"]) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success(`Status updated to ${statusLabels[newStatus]}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const nextStatus = (current: SupplyRequest["status"]): SupplyRequest["status"] | null => {
    if (current === "open") return "in_progress";
    if (current === "in_progress") return "closed";
    return null;
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supply Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Kitchen & office supply tickets</p>
        </div>
        <Button asChild>
          <Link to="/supply/new"><Plus className="h-4 w-4 mr-1.5" /> New Request</Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("new")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2"><ShoppingCart className="h-4 w-4 text-amber-700" /></div>
            <div><p className="text-2xl font-bold">{counts.open}</p><p className="text-xs text-muted-foreground">Open</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("in_progress")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2"><Clock className="h-4 w-4 text-blue-700" /></div>
            <div><p className="text-2xl font-bold">{counts.in_progress}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("closed")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /></div>
            <div><p className="text-2xl font-bold">{counts.closed}</p><p className="text-xs text-muted-foreground">Closed</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2"><Package className="h-4 w-4 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by item, requester, or category..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="new">New / Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading requests...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No requests found</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/supply/new">Submit a request</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{categoryLabels[r.category]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.items}</TableCell>
                    <TableCell className="text-center">{r.quantity}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[r.priority]}>{r.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.requested_by}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {nextStatus(r.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(r.id, nextStatus(r.status)!)}
                          disabled={updateStatus.isPending}
                        >
                          → {statusLabels[nextStatus(r.status)!]}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Done</span>
                      )}
                    </TableCell>
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
