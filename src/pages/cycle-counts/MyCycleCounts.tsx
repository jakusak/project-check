import { Link } from "react-router-dom";
import { useMyCycleCounts } from "@/hooks/useCycleCounts";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { Plus } from "lucide-react";

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  submitted: "secondary",
  validated: "default",
  rejected: "destructive",
};

export default function MyCycleCounts() {
  const { data: cycleCounts, isLoading } = useMyCycleCounts();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cycle Counts</h1>
          <p className="text-muted-foreground">
            View your submitted cycle count records
          </p>
        </div>
        <Button asChild>
          <Link to="/cycle-counts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Cycle Count
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
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
                  <TableHead>Ops Area</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycleCounts.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell>
                      {format(new Date(cc.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{cc.ops_area}</TableCell>
                    <TableCell>{cc.location_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[cc.status]}>
                        {cc.status.charAt(0).toUpperCase() + cc.status.slice(1)}
                      </Badge>
                      {cc.status === "rejected" && cc.rejection_note && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {cc.rejection_note}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No cycle counts submitted yet.{" "}
              <Link to="/cycle-counts/new" className="text-primary hover:underline">
                Create your first one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
