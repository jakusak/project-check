import { supabase } from "@/integrations/supabase/client";

const BUCKET = "facility-request-photos";

export async function uploadRequestPhotos(files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const f of files) {
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export function requestPhotoUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
