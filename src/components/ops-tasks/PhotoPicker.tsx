import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function PhotoPicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const urls = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach(u => URL.revokeObjectURL(u)), [urls]);
  return (
    <div className="space-y-2">
      <Label htmlFor="photos">Pictures (optional)</Label>
      <Input id="photos" type="file" accept="image/*" multiple
        onChange={e => { onChange([...files, ...Array.from(e.target.files || [])].slice(0, 6)); e.target.value = ""; }} />
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <div key={u} className="relative">
              <img src={u} alt="Attachment preview" className="h-20 w-20 object-cover rounded border" />
              <button type="button" aria-label="Remove picture" className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5"
                onClick={() => onChange(files.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
