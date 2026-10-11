// City and state for an Indian pincode, from India Post's public pincode directory.
// Used only to show "Delivering to Bidar, Karnataka"; any failure just means no place name.

export type Place = { city: string; state: string };

const cache = new Map<string, { at: number; place: Place | null }>();
const DAY = 24 * 60 * 60 * 1000;

export async function lookupPincode(pincode: string): Promise<Place | null> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return null;
  const hit = cache.get(pincode);
  if (hit && Date.now() - hit.at < (hit.place ? 30 * DAY : DAY)) return hit.place;
  let place: Place | null = null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    const json = await res.json();
    const po = Array.isArray(json) && json[0]?.Status === "Success" ? json[0].PostOffice?.[0] : null;
    if (po?.District && po?.State) place = { city: String(po.District), state: String(po.State) };
  } catch {
    // Directory slow or down: carry on without a place name.
  }
  cache.set(pincode, { at: Date.now(), place });
  return place;
}

/** "BIDAR" / "bidar" -> "Bidar"; keeps short words like "of" lower-case. */
const titleCase = (s: string) =>
  s.trim().toLowerCase().replace(/\b([a-z])([a-z]*)/g, (w, a: string, b: string) => (["of", "and"].includes(w) ? w : a.toUpperCase() + b));

export const placeLabel = (p: Place | null | undefined) => (p ? `${titleCase(p.city)}, ${titleCase(p.state)}` : null);
