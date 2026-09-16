import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCleanProductImage(images: string[] | string | undefined, productName: string = ""): string {
  let parsed: string[] = [];
  if (Array.isArray(images)) {
    parsed = images;
  } else if (typeof images === "string") {
    try {
      parsed = JSON.parse(images);
    } catch {
      parsed = [images];
    }
  }

  const firstValid = parsed.find(img => img && typeof img === "string" && !img.includes("placehold.co") && !img.includes("placeholder.jpg"));
  if (firstValid) return firstValid;

  // Smart culinary fallback based on product name
  const name = (productName || "").toLowerCase();
  if (name.includes("almond") || name.includes("badam")) {
    return "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("cashew") || name.includes("kaju")) {
    return "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("walnut") || name.includes("akhrot")) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("pista") || name.includes("pistachio")) {
    return "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("pumpkin") || name.includes("pepita")) {
    return "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("seed") || name.includes("chia") || name.includes("flax") || name.includes("sabja") || name.includes("sunflower")) {
    return "https://images.unsplash.com/photo-1627993077741-f761d49cfa35?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("date") || name.includes("kishmish") || name.includes("raisin") || name.includes("anjeer") || name.includes("mewa")) {
    return "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop";
  }
  if (name.includes("masala") || name.includes("spice") || name.includes("turmeric") || name.includes("pepper")) {
    return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop";
  }

  return "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop";
}
