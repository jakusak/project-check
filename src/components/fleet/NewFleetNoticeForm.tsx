import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFleetNotice, useUploadFleetNoticeFile, FleetNoticeType } from "@/hooks/useFleetNotices";
import { Upload, Loader2 } from "lucide-react";

interface FormData {
  notice_type: FleetNoticeType;
  country: string;
  issuing_authority: string;
  violation_datetime: string;
  violation_location: string;
  fine_amount: string;
  currency: string;
  deadline_date: string;
  reference_number: string;
  license_plate: string;
  notes_internal: string;
}

interface NewFleetNoticeFormProps {
  onSuccess?: () => void;
}

export default function NewFleetNoticeForm({ onSuccess }: NewFleetNoticeFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const createNotice = useCreateFleetNotice();
  const uploadFile = useUploadFleetNoticeFile();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      notice_type: "unknown",
      currency: "EUR",
    },
  });

  const noticeType = watch("notice_type");

  const onSubmit = async (data: FormData) => {
    try {
      const notice = await createNotice.mutateAsync({
        notice_type: data.notice_type,
        country: data.country || undefined,
        issuing_authority: data.issuing_authority || undefined,
        violation_datetime: data.violation_datetime || undefined,
        violation_location: data.violation_location || undefined,
        fine_amount: data.fine_amount ? parseFloat(data.fine_amount) : undefined,
        currency: data.currency || undefined,
        deadline_date: data.deadline_date || undefined,
        reference_number: data.reference_number || undefined,
        license_plate: data.license_plate || undefined,
        notes_internal: data.notes_internal || undefined,
      });

      // Upload files
      for (let i = 0; i < files.length; i++) {
        await uploadFile.mutateAsync({
          noticeId: notice.id,
          file: files[i],
          isPrimary: i === 0,
        });
      }

      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const isLoading = createNotice.isPending || uploadFile.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Document Upload */}
      <div className="space-y-2">
        <Label>Upload Document (PDF, Image)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {files.length > 0 ? `${files.length} file(s) selected` : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</p>
          </label>
        </div>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{file.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Notice Type */}
        <div className="space-y-2">
          <Label>Notice Type *</Label>
          <Select value={noticeType} onValueChange={(v) => setValue("notice_type", v as FleetNoticeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="speeding">Speeding</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="restricted_zone">Restricted Zone / ZLT</SelectItem>
              <SelectItem value="toll_fine">Toll Fine</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label>Country</Label>
          <Input {...register("country")} placeholder="e.g., DE, FR, IT" />
        </div>

        {/* License Plate */}
        <div className="space-y-2">
          <Label>License Plate</Label>
          <Input {...register("license_plate")} placeholder="e.g., AB-123-CD" className="font-mono" />
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input {...register("reference_number")} placeholder="Ticket/notice reference" />
        </div>

        {/* Fine Amount */}
        <div className="space-y-2">
          <Label>Fine Amount</Label>
          <div className="flex gap-2">
            <Select value={watch("currency") || "EUR"} onValueChange={(v) => setValue("currency", v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
                <SelectItem value="CZK">CZK</SelectItem>
                <SelectItem value="PLN">PLN</SelectItem>
              </SelectContent>
            </Select>
            <Input {...register("fine_amount")} type="number" step="0.01" placeholder="0.00" className="flex-1" />
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label>Payment Deadline</Label>
          <Input {...register("deadline_date")} type="date" />
        </div>

        {/* Violation Date/Time */}
        <div className="space-y-2">
          <Label>Violation Date/Time</Label>
          <Input {...register("violation_datetime")} type="datetime-local" />
        </div>

        {/* Issuing Authority */}
        <div className="space-y-2">
          <Label>Issuing Authority</Label>
          <Input {...register("issuing_authority")} placeholder="e.g., City of Milan" />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Violation Location</Label>
        <Input {...register("violation_location")} placeholder="e.g., A1 Autobahn, km 45" />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Internal Notes</Label>
        <Textarea {...register("notes_internal")} placeholder="Any additional notes..." rows={3} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Notice
        </Button>
      </div>
    </form>
  );
}
