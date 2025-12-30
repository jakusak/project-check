import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Filter, Eye, Upload, FileText, AlertTriangle, Clock } from "lucide-react";
import { useFleetNotices, FleetNoticeStatus, FleetNoticeType } from "@/hooks/useFleetNotices";
import { format, differenceInDays } from "date-fns";
import FleetNoticeDetail from "@/components/fleet/FleetNoticeDetail";
import NewFleetNoticeForm from "@/components/fleet/NewFleetNoticeForm";

const STATUS_COLORS: Record<FleetNoticeStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  needs_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  ready_to_assign: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  assigned: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  in_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  in_dispute: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  exception: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const TYPE_LABELS: Record<FleetNoticeType, string> = {
  speeding: "Speeding",
  parking: "Parking",
  restricted_zone: "Restricted Zone",
  toll_fine: "Toll Fine",
  unknown: "Unknown",
};

export default function FleetNoticesList() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: notices, isLoading } = useFleetNotices({
    status: statusFilter !== "all" ? [statusFilter as FleetNoticeStatus] : undefined,
    notice_type: typeFilter !== "all" ? [typeFilter as FleetNoticeType] : undefined,
  });

  const filteredNotices = notices?.filter(notice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      notice.license_plate?.toLowerCase().includes(search) ||
      notice.reference_number?.toLowerCase().includes(search) ||
      notice.driver?.name?.toLowerCase().includes(search) ||
      notice.violation_location?.toLowerCase().includes(search)
    );
  });

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return { text: "Overdue", variant: "destructive" as const };
    if (days <= 7) return { text: `${days}d left`, variant: "destructive" as const };
    if (days <= 14) return { text: `${days}d left`, variant: "secondary" as const };
    return { text: `${days}d`, variant: "outline" as const };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Notices</h1>
          <p className="text-muted-foreground">Manage all violation notices and fines</p>
        </div>
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Notice</DialogTitle>
            </DialogHeader>
            <NewFleetNoticeForm onSuccess={() => setShowNewForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plate, reference, driver, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="ready_to_assign">Ready to Assign</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_payment">In Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="in_dispute">In Dispute</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="speeding">Speeding</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="restricted_zone">Restricted Zone</SelectItem>
                <SelectItem value="toll_fine">Toll Fine</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Fine</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredNotices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No notices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotices?.map((notice) => {
                  const deadlineStatus = getDeadlineStatus(notice.deadline_date);
                  return (
                    <TableRow key={notice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedNoticeId(notice.id)}>
                      <TableCell className="font-medium">
                        {format(new Date(notice.received_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {notice.deadline_date ? (
                          <div className="flex items-center gap-1">
                            {deadlineStatus?.variant === "destructive" && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                            <Badge variant={deadlineStatus?.variant || "outline"}>
                              {deadlineStatus?.text}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABELS[notice.notice_type]}</Badge>
                      </TableCell>
                      <TableCell>{notice.country || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{notice.license_plate || "—"}</TableCell>
                      <TableCell>{notice.driver?.name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell className="text-right font-medium">
                        {notice.fine_amount ? `${notice.currency || "€"}${notice.fine_amount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[notice.status]}>
                          {notice.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedNoticeId(notice.id); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedNoticeId} onOpenChange={(open) => !open && setSelectedNoticeId(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          {selectedNoticeId && <FleetNoticeDetail noticeId={selectedNoticeId} onClose={() => setSelectedNoticeId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
