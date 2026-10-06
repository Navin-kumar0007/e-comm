import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { fallbackProductPhoto, isPlaceholderImage } from "./product-images"

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

  const firstValid = parsed.find(img => !isPlaceholderImage(img));
  if (firstValid) return firstValid;

  return fallbackProductPhoto(productName);
}
