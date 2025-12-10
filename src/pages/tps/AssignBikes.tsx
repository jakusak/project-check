import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Bike, User, Check, Loader2 } from "lucide-react";
import {
  useTrips,
  useGuestReservations,
  useEquipmentItems,
  useCreateBikeAssignment,
  useBikeAssignments,
  GuestReservation,
} from "@/hooks/useBikeAssignments";

export default function AssignBikes() {
  const navigate = useNavigate();
  const [tripSearch, setTripSearch] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestReservation | null>(null);

  // Form state
  const [bikeSku, setBikeSku] = useState("");
  const [bikeUniqueId, setBikeUniqueId] = useState("");
  const [equipmentItemId, setEquipmentItemId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: trips, isLoading: tripsLoading } = useTrips(tripSearch);
  const { data: guests, isLoading: guestsLoading } = useGuestReservations(selectedTripId);
  const { data: equipmentItems } = useEquipmentItems("Bike Equipment");
  const { data: existingAssignments } = useBikeAssignments({ tripId: selectedTripId, status: "assigned" });
  const createAssignment = useCreateBikeAssignment();

  const guestAssignmentMap = new Map(
    existingAssignments?.map((a) => [a.guest_reservation_id, a]) || []
  );

  const handleOpenAssign = (guest: GuestReservation) => {
    setSelectedGuest(guest);
    setBikeSku("");
    setBikeUniqueId("");
    setEquipmentItemId("");
    setNotes("");
    setAssignModalOpen(true);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedGuest || !bikeSku || !bikeUniqueId) return;

    await createAssignment.mutateAsync({
      bike_sku: bikeSku,
      bike_unique_id: bikeUniqueId,
      equipment_item_id: equipmentItemId || undefined,
      guest_reservation_id: selectedGuest.id,
      trip_id: selectedTripId,
      notes: notes || undefined,
    });

    setAssignModalOpen(false);
    setSelectedGuest(null);
  };

  const handleEquipmentSelect = (itemId: string) => {
    setEquipmentItemId(itemId);
    const item = equipmentItems?.find((i) => i.id === itemId);
    if (item) {
      setBikeSku(item.sku);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assign Bikes</h1>
          <p className="text-muted-foreground">Search trips and assign bikes to guests</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tps/bike-history")}>
          Search Bike History
        </Button>
      </div>

      {/* Trip Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Trips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by trip code or name..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {tripsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trips && trips.length > 0 ? (
            <div className="grid gap-2">
              {trips.slice(0, 10).map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTripId === trip.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{trip.trip_code}</span>
                      <span className="text-muted-foreground ml-2">{trip.trip_name}</span>
                    </div>
                    <Badge variant="outline">
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </Badge>
                  </div>
                  {trip.ops_area && (
                    <p className="text-sm text-muted-foreground mt-1">{trip.ops_area}</p>
                  )}
                </button>
              ))}
            </div>
          ) : tripSearch ? (
            <p className="text-center text-muted-foreground py-4">No trips found</p>
          ) : (
            <p className="text-center text-muted-foreground py-4">Enter a search term to find trips</p>
          )}
        </CardContent>
      </Card>

      {/* Guest List */}
      {selectedTripId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Guests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : guests && guests.length > 0 ? (
              <div className="space-y-2">
                {guests.map((guest) => {
                  const assignment = guestAssignmentMap.get(guest.id);
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{guest.guest_name}</span>
                          {guest.reservation_code && (
                            <Badge variant="secondary">{guest.reservation_code}</Badge>
                          )}
                        </div>
                        {guest.bike_size && (
                          <p className="text-sm text-muted-foreground">Size: {guest.bike_size}</p>
                        )}
                        {assignment && (
                          <p className="text-sm text-primary mt-1">
                            <Bike className="inline h-3 w-3 mr-1" />
                            Assigned: {assignment.bike_unique_id} ({assignment.bike_sku})
                          </p>
                        )}
                      </div>
                      <div>
                        {assignment ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Assigned
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleOpenAssign(guest)}>
                            <Bike className="h-4 w-4 mr-1" />
                            Assign Bike
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No guests found for this trip
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Bike to {selectedGuest?.guest_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Equipment (Optional)</Label>
              <Select value={equipmentItemId} onValueChange={handleEquipmentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from catalog..." />
                </SelectTrigger>
                <SelectContent>
                  {equipmentItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bike SKU *</Label>
              <Input
                value={bikeSku}
                onChange={(e) => setBikeSku(e.target.value)}
                placeholder="Enter bike SKU"
              />
            </div>

            <div className="space-y-2">
              <Label>Unique Bike ID *</Label>
              <Input
                value={bikeUniqueId}
                onChange={(e) => setBikeUniqueId(e.target.value)}
                placeholder="Enter unique bike identifier"
              />
              <p className="text-xs text-muted-foreground">
                This ID must be unique among all currently assigned bikes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={!bikeSku || !bikeUniqueId || createAssignment.isPending}
            >
              {createAssignment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Bike
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
