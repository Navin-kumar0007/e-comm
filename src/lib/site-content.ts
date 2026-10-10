import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { CONTENT_DEFAULTS, type ContentKey, type ContentOf } from "@/lib/site-content-shared";
export * from "@/lib/site-content-shared";

// Storefront text and offers that the owner edits from Admin → Website editor.
// Each block has a default (what the site showed before), so an empty database changes nothing.

/** One block of content: saved value merged over its default. Cached per request. */
export const getSiteContent = cache(async <K extends ContentKey>(key: K): Promise<ContentOf<K>> => {
  const def = CONTENT_DEFAULTS[key];
  try {
    const row = await prisma.siteContent.findUnique({ where: { key } });
    if (!row) return def;
    const saved = JSON.parse(row.value);
    return (Array.isArray(def) ? (Array.isArray(saved) ? saved : def) : { ...(def as object), ...(saved as object) }) as ContentOf<K>;
  } catch {
    return def; // never let a content problem break the shop
  }
}) as <K extends ContentKey>(key: K) => Promise<ContentOf<K>>;
