import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Browser } from "@capacitor/browser";

export type Coords = { latitude: number; longitude: number };

export async function getCurrentCoords(): Promise<Coords> {
  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.requestPermissions();
    if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
      throw new Error("Permissão de localização negada.");
    }
  }
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

// Melhor esforço: precisa de internet; retorna null se falhar
export async function reverseGeocode({ latitude, longitude }: Coords): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export function mapsUrl(v: { latitude?: number | null; longitude?: number | null; company_address: string }) {
  const destination =
    v.latitude != null && v.longitude != null ? `${v.latitude},${v.longitude}` : v.company_address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export async function openMaps(v: Parameters<typeof mapsUrl>[0]) {
  const url = mapsUrl(v);
  if (Capacitor.isNativePlatform()) await Browser.open({ url });
  else window.open(url, "_blank", "noopener");
}
