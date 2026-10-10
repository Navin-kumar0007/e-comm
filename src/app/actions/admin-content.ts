'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requirePermission, staffActor } from '@/lib/auth-guard';
import { audit } from '@/lib/audit';
import { CONTENT_DEFAULTS, CONTENT_KEYS, type ContentKey } from '@/lib/site-content';

const LABEL: Record<ContentKey, string> = {
  announcement: 'Announcement bar', hero: 'Home page hero', banners: 'Offer banners', sections: 'Home page sections',
  popup: 'WhatsApp popup', contact: 'Contact & social', seo: 'Search engine (SEO)', policies: 'Policy pages',
};

/** Everything the editor needs: current values (saved or default) and recent versions. */
export async function getEditorData() {
  await requirePermission('catalog.manage');
  const [rows, versions] = await Promise.all([
    prisma.siteContent.findMany(),
    prisma.siteContentVersion.findMany({ orderBy: { createdAt: 'desc' }, take: 60, select: { id: true, key: true, createdBy: true, createdAt: true } }),
  ]);
  const values: Record<string, unknown> = {};
  for (const k of CONTENT_KEYS) {
    const row = rows.find((r: any) => r.key === k);
    const def = CONTENT_DEFAULTS[k];
    let saved: any = null;
    try { saved = row ? JSON.parse(row.value) : null; } catch { saved = null; }
    values[k] = saved === null ? def : Array.isArray(def) ? saved : { ...(def as object), ...saved };
  }
  return JSON.parse(JSON.stringify({ values, versions, updated: rows.map((r: any) => ({ key: r.key, by: r.updatedBy, at: r.updatedAt })) }));
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const link = (v: unknown) => {
  const s = str(v, 300);
  return !s || s.startsWith('/') || s.startsWith('#') || /^https:\/\//i.test(s) ? s : '';
};

/** Cleans what the editor sends, so a mistake can't break pages or inject scripts. */
function sanitize(key: ContentKey, v: any): any {
  switch (key) {
    case 'announcement':
      return { enabled: !!v.enabled, messages: (Array.isArray(v.messages) ? v.messages : []).slice(0, 5).map((m: any) => ({ text: str(m.text, 80), link: link(m.link) || undefined, linkText: str(m.linkText, 20) || undefined })).filter((m: any) => m.text) };
    case 'hero':
      return { eyebrow: str(v.eyebrow, 60), title: str(v.title, 60), subtitle: str(v.subtitle, 240), primaryText: str(v.primaryText, 30), primaryLink: link(v.primaryLink) || '/shop', secondaryText: str(v.secondaryText, 30), secondaryLink: link(v.secondaryLink) || '#gift' };
    case 'banners':
      return (Array.isArray(v) ? v : []).slice(0, 8).map((b: any, i: number) => ({
        id: str(b.id, 40) || `b${Date.now()}${i}`, image: link(b.image), mobileImage: link(b.mobileImage) || undefined, link: link(b.link) || undefined, alt: str(b.alt, 120) || 'Offer',
        startsAt: str(b.startsAt, 30) || undefined, endsAt: str(b.endsAt, 30) || undefined, enabled: !!b.enabled,
      })).filter((b: any) => b.image);
    case 'sections': {
      const all = CONTENT_DEFAULTS.sections.order as string[];
      const order = (Array.isArray(v.order) ? v.order : []).filter((k: string) => all.includes(k));
      for (const k of all) if (!order.includes(k)) order.push(k);
      return { order, hidden: (Array.isArray(v.hidden) ? v.hidden : []).filter((k: string) => all.includes(k)) };
    }
    case 'popup':
      return { enabled: !!v.enabled, title: str(v.title, 60), text: str(v.text, 160), delaySeconds: Math.max(2, Math.min(120, Math.round(Number(v.delaySeconds) || 8))) };
    case 'contact':
      return { phone: str(v.phone, 30), email: str(v.email, 120), address: str(v.address, 300), tagline: str(v.tagline, 240), instagram: link(v.instagram), youtube: link(v.youtube), facebook: link(v.facebook) };
    case 'seo':
      return { homeTitle: str(v.homeTitle, 70), homeDescription: str(v.homeDescription, 170) };
    case 'policies':
      return { privacy: str(v.privacy, 30000), terms: str(v.terms, 30000), shipping: str(v.shipping, 30000), returns: str(v.returns, 30000) };
  }
}

export async function saveContentAction(key: ContentKey, value: unknown) {
  await requirePermission('catalog.manage');
  if (!CONTENT_KEYS.includes(key)) return { error: 'Unknown section.' };
  const actor = await staffActor();
  const clean = sanitize(key, value ?? {});
  const json = JSON.stringify(clean);
  await prisma.$transaction([
    prisma.siteContent.upsert({ where: { key }, update: { value: json, updatedBy: actor }, create: { key, value: json, updatedBy: actor } }),
    prisma.siteContentVersion.create({ data: { key, value: json, createdBy: actor } }),
  ]);
  await audit({ action: 'content.update', entity: 'SiteContent', entityId: key, summary: `Edited ${LABEL[key]}`, data: clean, actor });
  revalidatePath('/', 'layout'); // every page picks up the change
  return { success: true, value: clean };
}

/** Puts back an earlier version (it becomes a new version, so it can be undone too). */
export async function restoreContentVersionAction(versionId: string) {
  await requirePermission('catalog.manage');
  const v = await prisma.siteContentVersion.findUnique({ where: { id: versionId } });
  if (!v) return { error: 'Version not found.' };
  return saveContentAction(v.key as ContentKey, JSON.parse(v.value));
}

/** Back to how the site was built (removes the saved value; history is kept). */
export async function resetContentAction(key: ContentKey) {
  await requirePermission('catalog.manage');
  const actor = await staffActor();
  await prisma.siteContent.deleteMany({ where: { key } });
  await prisma.siteContentVersion.create({ data: { key, value: JSON.stringify(CONTENT_DEFAULTS[key]), createdBy: `${actor} (reset)` } });
  await audit({ action: 'content.reset', entity: 'SiteContent', entityId: key, summary: `Reset ${LABEL[key]} to default`, actor });
  revalidatePath('/', 'layout');
  return { success: true };
}
