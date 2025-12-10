import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bike, Wrench, User, Calendar, Loader2 } from "lucide-react";
import { useBikeHistory, useUpdateBikeAssignment } from "@/hooks/useBikeAssignments";
import { format } from "date-fns";

export default function BikeHistory() {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const decodedBikeId = bikeId ? decodeURIComponent(bikeId) : "";
  
  const { data, isLoading } = useBikeHistory(decodedBikeId);
  const updateAssignment = useUpdateBikeAssignment();

  const handleMarkReturned = async (assignmentId: string) => {
    await updateAssignment.mutateAsync({
      id: assignmentId,
      status: "returned",
      returned_at: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { assignments = [], maintenance = [] } = data || {};
  const currentAssignment = assignments.find((a) => a.status === "assigned");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tps/bike-history")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bike className="h-6 w-6" />
            Bike: {decodedBikeId}
          </h1>
          {assignments.length > 0 && (
            <p className="text-muted-foreground">SKU: {assignments[0].bike_sku}</p>
          )}
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {currentAssignment ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">
                  Currently Assigned
                </Badge>
                <p className="font-medium">{currentAssignment.guest_reservation?.guest_name}</p>
                <p className="text-sm text-muted-foreground">
                  Trip: {currentAssignment.trip?.trip_code} - {currentAssignment.trip?.trip_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Since: {format(new Date(currentAssignment.created_at), "PPP")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleMarkReturned(currentAssignment.id)}
                disabled={updateAssignment.isPending}
              >
                Mark as Returned
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">This bike is currently available</p>
          )}
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList>
          <TabsTrigger value="assignments" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Assignments ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            Maintenance ({maintenance.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {assignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No assignment history found for this bike
                </p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {assignment.guest_reservation?.guest_name || "Unknown Guest"}
                          </span>
                          <Badge
                            variant={assignment.status === "assigned" ? "default" : "secondary"}
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Trip: {assignment.trip?.trip_code} - {assignment.trip?.trip_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Assigned: {format(new Date(assignment.created_at), "PPP")}
                          </span>
                          {assignment.returned_at && (
                            <span>
                              Returned: {format(new Date(assignment.returned_at), "PPP")}
                            </span>
                          )}
                        </div>
                        {assignment.notes && (
                          <p className="text-sm mt-2">{assignment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {maintenance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No maintenance records found for this bike
                </p>
              ) : (
                <div className="space-y-4">
                  {maintenance.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{record.maintenance_type}</span>
                          <Badge
                            variant={record.status === "completed" ? "secondary" : "default"}
                          >
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {format(new Date(record.created_at), "PPP")}
                          </span>
                          {record.completed_at && (
                            <span>
                              Completed: {format(new Date(record.completed_at), "PPP")}
                            </span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm mt-2">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
