import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  useFleetNotice, 
  useFleetNoticeFiles, 
  useUpdateFleetNotice, 
  useFleetDrivers, 
  useFleetVehicles,
  useUploadFleetNoticeFile,
  FleetNoticeStatus 
} from "@/hooks/useFleetNotices";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  User, 
  Car, 
  Calendar, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Loader2,
  ExternalLink,
  Mail
} from "lucide-react";
import { FleetNoticeEmailDialog } from "./FleetNoticeEmailDialog";

interface FleetNoticeDetailProps {
  noticeId: string;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: FleetNoticeStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "needs_review", label: "Needs Review" },
  { value: "ready_to_assign", label: "Ready to Assign" },
  { value: "assigned", label: "Assigned" },
  { value: "in_payment", label: "In Payment" },
  { value: "paid", label: "Paid" },
  { value: "in_dispute", label: "In Dispute" },
  { value: "closed", label: "Closed" },
  { value: "exception", label: "Exception" },
];

export default function FleetNoticeDetail({ noticeId, onClose }: FleetNoticeDetailProps) {
  const { data: notice, isLoading } = useFleetNotice(noticeId);
  const { data: files } = useFleetNoticeFiles(noticeId);
  const { data: drivers } = useFleetDrivers();
  const { data: vehicles } = useFleetVehicles();
  const updateNotice = useUpdateFleetNotice();
  const uploadFile = useUploadFleetNoticeFile();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [driverName, setDriverName] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  if (isLoading || !notice) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const handleStatusChange = async (status: FleetNoticeStatus) => {
    await updateNotice.mutateAsync({ id: noticeId, status });
  };

  const handleAssignDriverByName = async (name: string) => {
    if (!name.trim()) return;
    
    // First check if driver exists
    let driver = drivers?.find(d => d.name.toLowerCase() === name.toLowerCase().trim());
    
    if (!driver) {
      // Create new driver with this name
      const { data: newDriver, error } = await supabase
        .from("fleet_drivers")
        .insert({ name: name.trim() })
        .select()
        .single();
      
      if (error) {
        console.error("Failed to create driver:", error);
        return;
      }
      driver = newDriver;
    }
    
    await updateNotice.mutateAsync({ id: noticeId, driver_id: driver.id } as any);
    setDriverName("");
  };

  const handleAssignVehicle = async (vehicleId: string) => {
    await updateNotice.mutateAsync({ id: noticeId, vehicle_id: vehicleId } as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      await uploadFile.mutateAsync({ noticeId, file: e.target.files[0] });
    }
  };

  const handleMarkPaid = async () => {
    await updateNotice.mutateAsync({
      id: noticeId,
      status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
      paid_amount: notice.fine_amount,
    } as any);
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from("fleet-notices").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">
              {notice.notice_type.replace(/_/g, " ").toUpperCase()} Notice
            </h2>
            <Badge className="text-sm">{notice.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Reference: {notice.reference_number || "—"} • Received: {format(new Date(notice.received_date), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Email Driver
          </Button>
          <Select value={notice.status} onValueChange={(v) => handleStatusChange(v as FleetNoticeStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FleetNoticeEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        notice={notice}
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents ({files?.length || 0})</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Violation Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Violation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Type</Label>
                    <p className="font-medium">{notice.notice_type.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Country</Label>
                    <p className="font-medium">{notice.country || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Date/Time</Label>
                    <p className="font-medium">
                      {notice.violation_datetime 
                        ? format(new Date(notice.violation_datetime), "MMM d, yyyy h:mm a")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Authority</Label>
                    <p className="font-medium">{notice.issuing_authority || "—"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Location</Label>
                  <p className="font-medium">{notice.violation_location || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Financial */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Fine Amount</Label>
                    <p className="text-2xl font-bold">
                      {notice.currency || "€"}{notice.fine_amount?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Deadline</Label>
                    <div className="flex items-center gap-2">
                      {notice.deadline_date ? (
                        <>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(notice.deadline_date), "MMM d, yyyy")}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
                {notice.status !== "paid" && notice.status !== "closed" && (
                  <Button onClick={handleMarkPaid} className="w-full" variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                {notice.paid_date && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Paid on {format(new Date(notice.paid_date), "MMM d, yyyy")}
                      {notice.paid_amount && ` • ${notice.currency || "€"}${notice.paid_amount}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notice.notes_internal || "No notes"}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="upload-more"
                />
                <label htmlFor="upload-more">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {files?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {files?.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4 flex items-center gap-3">
                      {file.file_type.startsWith("image/") ? (
                        <img 
                          src={getFileUrl(file.file_path)} 
                          alt={file.file_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">{file.file_type}</p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">License Plate</Label>
                  <p className="font-mono font-medium">{notice.license_plate || "—"}</p>
                </div>
                {notice.vehicle ? (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{notice.vehicle.make} {notice.vehicle.model}</p>
                    <p className="text-sm text-muted-foreground">
                      {notice.vehicle.fleet_type} • {notice.vehicle.country_base}
                    </p>
                  </div>
                ) : (
                  <Select onValueChange={handleAssignVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.license_plate} - {v.make} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Driver */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notice.driver ? (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{notice.driver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {notice.driver.email || notice.driver.phone || "No contact info"}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">No driver assigned</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter driver name..."
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAssignDriverByName(driverName);
                          }
                        }}
                      />
                      <Button 
                        onClick={() => handleAssignDriverByName(driverName)}
                        disabled={!driverName.trim()}
                      >
                        Assign
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notice.status === "paid" ? (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Paid</p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {notice.paid_date && format(new Date(notice.paid_date), "MMM d, yyyy")}
                      {notice.paid_amount && ` • ${notice.currency || "€"}${notice.paid_amount}`}
                      {notice.payment_method && ` via ${notice.payment_method}`}
                    </p>
                  </div>
                </div>
              ) : notice.status === "in_dispute" ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">In Dispute</p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {notice.dispute_reason || "No reason provided"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Amount Due</Label>
                      <p className="text-2xl font-bold">
                        {notice.currency || "€"}{notice.fine_amount?.toLocaleString() || "0"}
                      </p>
                    </div>
                    {notice.deadline_date && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Due By</Label>
                        <p className="font-medium">{format(new Date(notice.deadline_date), "MMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleMarkPaid}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateNotice.mutateAsync({ id: noticeId, status: "in_dispute" })}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dispute
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
