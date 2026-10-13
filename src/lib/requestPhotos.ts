import { useEffect, useState } from "react";
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

export function useRequestPhotoUrls(paths: string[] | null | undefined) {
  const [urls, setUrls] = useState<{ path: string; url: string }[]>([]);
  const key = (paths || []).join("|");
  useEffect(() => {
    let cancelled = false;
    const list = paths || [];
    if (!list.length) { setUrls([]); return; }
    supabase.storage.from(BUCKET).createSignedUrls(list, 3600).then(({ data }) => {
      if (!cancelled) setUrls((data || []).filter(d => d.signedUrl).map(d => ({ path: d.path || "", url: d.signedUrl })));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}
