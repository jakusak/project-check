import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
  Search, 
  Bike, 
  User, 
  Check, 
  Loader2, 
  CheckCircle2,
  ScanBarcode,
  ChevronRight
} from "lucide-react";
import {
  useTrips,
  useGuestReservations,
  useEquipmentItems,
  useCreateBikeAssignment,
  useBikeAssignments,
  GuestReservation,
} from "@/hooks/useBikeAssignments";
import MobileBarcodeScanner from "@/components/mobile/MobileBarcodeScanner";

export default function MobileAssignBike() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Search Trip, 2: Select Guest, 3: Assign Bike
  const [tripSearch, setTripSearch] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedGuest, setSelectedGuest] = useState<GuestReservation | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

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

  const selectedTrip = trips?.find(t => t.id === selectedTripId);

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setStep(2);
  };

  const handleSelectGuest = (guest: GuestReservation) => {
    setSelectedGuest(guest);
    setBikeSku("");
    setBikeUniqueId("");
    setEquipmentItemId("");
    setNotes("");
    setStep(3);
  };

  const handleEquipmentSelect = (itemId: string) => {
    setEquipmentItemId(itemId);
    const item = equipmentItems?.find((i) => i.id === itemId);
    if (item) {
      setBikeSku(item.sku);
    }
  };

  const handleScanResult = (scannedValue: string) => {
    setShowScanner(false);
    // Try to find equipment by SKU first
    const equipment = equipmentItems?.find(
      e => e.sku.toLowerCase() === scannedValue.toLowerCase()
    );
    
    if (equipment) {
      setEquipmentItemId(equipment.id);
      setBikeSku(equipment.sku);
    }
    // Set the scanned value as unique ID
    setBikeUniqueId(scannedValue);
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

    setIsSuccess(true);
  };

  // Scanner modal
  if (showScanner) {
    return (
      <MobileBarcodeScanner
        title="Scan Bike"
        onScanSuccess={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  // Success screen
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Bike Assigned</h1>
        <p className="text-muted-foreground mb-2">
          Bike {bikeUniqueId} assigned to {selectedGuest?.guest_name}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Trip: {selectedTrip?.trip_code}
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => {
              setIsSuccess(false);
              setSelectedGuest(null);
              setStep(2);
            }}
          >
            Assign Another Bike
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg"
            onClick={() => navigate("/m/home")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h1 className="text-xl font-bold mb-2">Assign Bike</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {step === 1 && "Search for a trip"}
        {step === 2 && "Select a guest"}
        {step === 3 && "Enter bike details"}
      </p>

      {/* Step 1: Search Trip */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by trip code or name..."
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                />
              </div>

              {tripsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : trips && trips.length > 0 ? (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {trips.slice(0, 20).map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip.id)}
                      className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{trip.trip_code}</span>
                          <p className="text-sm text-muted-foreground">{trip.trip_name}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(trip.start_date).toLocaleDateString()}
                        </Badge>
                        {trip.ops_area && (
                          <Badge variant="secondary" className="text-xs">{trip.ops_area}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : tripSearch ? (
                <p className="text-center text-muted-foreground py-8">No trips found</p>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Enter a search term to find trips
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Select Guest */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Trip info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedTrip?.trip_code}</p>
                  <p className="text-sm text-muted-foreground">{selectedTrip?.trip_name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guest list */}
          {guestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : guests && guests.length > 0 ? (
            <div className="space-y-2">
              {guests.map((guest) => {
                const assignment = guestAssignmentMap.get(guest.id);
                return (
                  <Card key={guest.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{guest.guest_name}</span>
                          </div>
                          {guest.reservation_code && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {guest.reservation_code}
                            </Badge>
                          )}
                          {guest.bike_size && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Size: {guest.bike_size}
                            </p>
                          )}
                          {assignment && (
                            <p className="text-sm text-primary mt-1">
                              <Bike className="inline h-3 w-3 mr-1" />
                              {assignment.bike_unique_id}
                            </p>
                          )}
                        </div>
                        <div>
                          {assignment ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleSelectGuest(guest)}>
                              <Bike className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No guests found for this trip
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Assign Bike */}
      {step === 3 && selectedGuest && (
        <div className="space-y-4">
          {/* Guest info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedGuest.guest_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrip?.trip_code} • {selectedGuest.bike_size && `Size: ${selectedGuest.bike_size}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scan button */}
          <Button
            size="lg"
            variant="outline"
            className="w-full h-16 text-lg"
            onClick={() => setShowScanner(true)}
          >
            <ScanBarcode className="h-6 w-6 mr-2" />
            Scan Bike Barcode
          </Button>

          {/* Manual entry */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-base">Equipment Type (Optional)</Label>
                <Select value={equipmentItemId} onValueChange={handleEquipmentSelect}>
                  <SelectTrigger className="h-12 text-base mt-2">
                    <SelectValue placeholder="Select from catalog..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentItems?.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-base py-3">
                        {item.name} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base">Bike SKU *</Label>
                <Input
                  value={bikeSku}
                  onChange={(e) => setBikeSku(e.target.value)}
                  placeholder="Enter bike SKU"
                  className="h-12 text-base mt-2"
                />
              </div>

              <div>
                <Label className="text-base">Unique Bike ID *</Label>
                <Input
                  value={bikeUniqueId}
                  onChange={(e) => setBikeUniqueId(e.target.value)}
                  placeholder="Enter unique bike identifier"
                  className="h-12 text-base mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This ID must be unique among all currently assigned bikes
                </p>
              </div>

              <div>
                <Label className="text-base">Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special notes..."
                  className="text-base mt-2"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1 h-14 text-lg"
              onClick={handleSubmitAssignment}
              disabled={!bikeSku || !bikeUniqueId || createAssignment.isPending}
            >
              {createAssignment.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Bike"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
