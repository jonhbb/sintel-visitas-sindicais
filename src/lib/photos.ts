import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "visit-photos";

export type PendingPhoto = { path: string; dataUrl: string };

export async function capturePhoto(userId: string, visitId: string): Promise<PendingPhoto | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 70,
      width: 1280,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
      source: Capacitor.isNativePlatform() ? CameraSource.Prompt : CameraSource.Photos,
    });
    if (!photo.dataUrl) return null;
    return { path: `${userId}/${visitId}/${crypto.randomUUID()}.jpg`, dataUrl: photo.dataUrl };
  } catch {
    // usuário cancelou a captura
    return null;
  }
}

export async function uploadPhoto({ path, dataUrl }: PendingPhoto) {
  const blob = await (await fetch(dataUrl)).blob();
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (error || !data) return {};
  return Object.fromEntries(data.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

export async function removePhotos(paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}
