import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFleetNotice, useUploadFleetNoticeFile, FleetNoticeType } from "@/hooks/useFleetNotices";
import { Upload, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ExtractedData {
  notice_type?: string;
  fine_amount?: number;
  currency?: string;
  violation_date?: string;
  violation_time?: string;
  deadline_date?: string;
  license_plate?: string;
  violation_location?: string;
  reference_number?: string;
  issuing_authority?: string;
  country?: string;
  raw_text_summary?: string;
}

export default function NewFleetNoticeForm({ onSuccess }: NewFleetNoticeFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const createNotice = useCreateFleetNotice();
  const uploadFile = useUploadFleetNoticeFile();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      notice_type: "unknown",
      currency: "EUR",
    },
  });

  const noticeType = watch("notice_type");

  const extractDataFromFile = async (file: File) => {
    setIsExtracting(true);
    setExtractedFields([]);
    
    try {
      // First upload the file temporarily to get a URL
      const tempPath = `temp/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('fleet-notices')
        .upload(tempPath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file for analysis');
        return;
      }

      toast.info('Analyzing document with AI...', { duration: 3000 });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('extract-fleet-notice', {
        body: { filePath: tempPath },
      });

      if (error) {
        console.error('Extraction error:', error);
        toast.error('Failed to analyze document');
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to parse document');
        return;
      }

      const extracted: ExtractedData = data.data;
      const fieldsPopulated: string[] = [];

      // Populate form fields from extracted data
      if (extracted.notice_type && ['speeding', 'parking', 'restricted_zone', 'toll_fine', 'unknown'].includes(extracted.notice_type)) {
        setValue('notice_type', extracted.notice_type as FleetNoticeType);
        fieldsPopulated.push('Notice Type');
      }

      if (extracted.fine_amount) {
        setValue('fine_amount', extracted.fine_amount.toString());
        fieldsPopulated.push('Fine Amount');
      }

      if (extracted.currency) {
        setValue('currency', extracted.currency);
        fieldsPopulated.push('Currency');
      }

      if (extracted.violation_date) {
        const time = extracted.violation_time || '12:00';
        setValue('violation_datetime', `${extracted.violation_date}T${time}`);
        fieldsPopulated.push('Violation Date/Time');
      }

      if (extracted.deadline_date) {
        setValue('deadline_date', extracted.deadline_date);
        fieldsPopulated.push('Deadline');
      }

      if (extracted.license_plate) {
        setValue('license_plate', extracted.license_plate);
        fieldsPopulated.push('License Plate');
      }

      if (extracted.violation_location) {
        setValue('violation_location', extracted.violation_location);
        fieldsPopulated.push('Location');
      }

      if (extracted.reference_number) {
        setValue('reference_number', extracted.reference_number);
        fieldsPopulated.push('Reference Number');
      }

      if (extracted.issuing_authority) {
        setValue('issuing_authority', extracted.issuing_authority);
        fieldsPopulated.push('Issuing Authority');
      }

      if (extracted.country) {
        setValue('country', extracted.country);
        fieldsPopulated.push('Country');
      }

      // Add raw text summary to notes if available
      if (extracted.raw_text_summary) {
        setValue('notes_internal', `AI Analysis: ${extracted.raw_text_summary}`);
        fieldsPopulated.push('Notes');
      }

      setExtractedFields(fieldsPopulated);

      if (fieldsPopulated.length > 0) {
        toast.success(`AI extracted ${fieldsPopulated.length} fields from document`);
      } else {
        toast.info('Could not extract data. Please fill in manually.');
      }

    } catch (err) {
      console.error('Extraction error:', err);
      toast.error('Failed to analyze document');
    } finally {
      setIsExtracting(false);
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Auto-extract from first image file
      const imageFile = selectedFiles.find(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      
      if (imageFile && imageFile.type.startsWith('image/')) {
        await extractDataFromFile(imageFile);
      }
    }
  };

  const isLoading = createNotice.isPending || uploadFile.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Document Upload */}
      <div className="space-y-2">
        <Label>Upload Document (PDF, Image)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors relative">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isExtracting}
          />
          <label htmlFor="file-upload" className={`cursor-pointer ${isExtracting ? 'pointer-events-none' : ''}`}>
            {isExtracting ? (
              <>
                <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                <p className="text-sm text-primary font-medium">Analyzing document with AI...</p>
                <p className="text-xs text-muted-foreground mt-1">Extracting fields automatically</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {files.length > 0 ? `${files.length} file(s) selected` : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</p>
                <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI will auto-extract fields from images
                </p>
              </>
            )}
          </label>
        </div>
        {files.length > 0 && !isExtracting && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{file.name}</span>
            ))}
          </div>
        )}
        {extractedFields.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>AI extracted: {extractedFields.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Notice Type */}
        <div className="space-y-2">
          <Label>Notice Type *</Label>
          <Select value={noticeType} onValueChange={(v) => setValue("notice_type", v as FleetNoticeType)}>
            <SelectTrigger className={extractedFields.includes('Notice Type') ? 'ring-2 ring-green-500/50' : ''}>
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
          <Input 
            {...register("country")} 
            placeholder="e.g., DE, FR, IT" 
            className={extractedFields.includes('Country') ? 'ring-2 ring-green-500/50' : ''}
          />
        </div>

        {/* License Plate */}
        <div className="space-y-2">
          <Label>License Plate</Label>
          <Input 
            {...register("license_plate")} 
            placeholder="e.g., AB-123-CD" 
            className={`font-mono ${extractedFields.includes('License Plate') ? 'ring-2 ring-green-500/50' : ''}`}
          />
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input 
            {...register("reference_number")} 
            placeholder="Ticket/notice reference" 
            className={extractedFields.includes('Reference Number') ? 'ring-2 ring-green-500/50' : ''}
          />
        </div>

        {/* Fine Amount */}
        <div className="space-y-2">
          <Label>Fine Amount</Label>
          <div className="flex gap-2">
            <Select value={watch("currency") || "EUR"} onValueChange={(v) => setValue("currency", v)}>
              <SelectTrigger className={`w-24 ${extractedFields.includes('Currency') ? 'ring-2 ring-green-500/50' : ''}`}>
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
            <Input 
              {...register("fine_amount")} 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              className={`flex-1 ${extractedFields.includes('Fine Amount') ? 'ring-2 ring-green-500/50' : ''}`}
            />
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label>Payment Deadline</Label>
          <Input 
            {...register("deadline_date")} 
            type="date" 
            className={extractedFields.includes('Deadline') ? 'ring-2 ring-green-500/50' : ''}
          />
        </div>

        {/* Violation Date/Time */}
        <div className="space-y-2">
          <Label>Violation Date/Time</Label>
          <Input 
            {...register("violation_datetime")} 
            type="datetime-local" 
            className={extractedFields.includes('Violation Date/Time') ? 'ring-2 ring-green-500/50' : ''}
          />
        </div>

        {/* Issuing Authority */}
        <div className="space-y-2">
          <Label>Issuing Authority</Label>
          <Input 
            {...register("issuing_authority")} 
            placeholder="e.g., City of Milan" 
            className={extractedFields.includes('Issuing Authority') ? 'ring-2 ring-green-500/50' : ''}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Violation Location</Label>
        <Input 
          {...register("violation_location")} 
          placeholder="e.g., A1 Autobahn, km 45" 
          className={extractedFields.includes('Location') ? 'ring-2 ring-green-500/50' : ''}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Internal Notes</Label>
        <Textarea 
          {...register("notes_internal")} 
          placeholder="Any additional notes..." 
          rows={3} 
          className={extractedFields.includes('Notes') ? 'ring-2 ring-green-500/50' : ''}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || isExtracting}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Notice
        </Button>
      </div>
    </form>
  );
}
