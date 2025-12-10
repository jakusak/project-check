import { useState } from "react";
import { Link } from "react-router-dom";
import { useCycleCountsForReview } from "@/hooks/useCycleCounts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  submitted: "secondary",
  validated: "default",
  rejected: "destructive",
};

export default function CycleCountReview() {
  const [statusFilter, setStatusFilter] = useState("__all__");
  const { data: cycleCounts, isLoading } = useCycleCountsForReview(statusFilter);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cycle Count Review</h1>
        <p className="text-muted-foreground">
          Review and validate submitted cycle counts
        </p>
      </div>
      
      <div className="flex gap-4">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cycle Counts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : cycleCounts && cycleCounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Ops Area</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycleCounts.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell>
                      {format(new Date(cc.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cc.creator_email}
                    </TableCell>
                    <TableCell>{cc.ops_area}</TableCell>
                    <TableCell>{cc.location_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[cc.status]}>
                        {cc.status.charAt(0).toUpperCase() + cc.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/cycle-counts/review/${cc.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No cycle counts to review
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
