import { prisma } from "@/lib/db/prisma";
import { BOOKED_STATUSES } from "@/lib/analytics";

// One customer = one phone number (last 10 digits), or the email when there's no phone.
// Guests who never made an account and people with accounts are joined this way.

export const phoneKey = (p: string | null | undefined) => {
  const d = (p || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
};
export const customerKey = (phone: string | null | undefined, email: string | null | undefined) => phoneKey(phone) || (email || "").trim().toLowerCase();
const isPlaceholderEmail = (e: string) => /@(shop|walk-in)\.spicynuts\.in$|^walk-in@/i.test(e);

export type Segment = "new" | "repeat" | "vip" | "inactive" | "codRisk" | "wholesale" | "noOrders";

export interface CustomerRow {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  userId: string | null;
  hasAccount: boolean;
  customerType: string;
  businessName: string | null;
  orders: number;
  spend: number;
  firstOrder: string | null;
  lastOrder: string | null;
  returned: number;
  rto: number;
  cod: number;
  shop: number;
  whatsappOffers: boolean;
  segments: Segment[];
}

const VIP_SPEND = 5000;
const DAY = 864e5;

export async function getCustomerDirectory(): Promise<CustomerRow[]> {
  return (await buildDirectory()).rows;
}

/** The directory plus which orders belong to which customer (the profile uses the same matching). */
async function buildDirectory(): Promise<{ rows: CustomerRow[]; orderIds: Map<string, string[]> }> {
  const [users, orders] = await Promise.all([
    prisma.user.findMany({ where: { role: "USER" }, select: { id: true, name: true, email: true, phone: true, customerType: true, businessName: true, whatsappOptIn: true, createdAt: true } }),
    prisma.order.findMany({
      where: { status: { notIn: ["DELETED", "EXPIRED", "PENDING"] } },
      select: { id: true, userId: true, customerName: true, customerEmail: true, customerPhone: true, total: true, status: true, paymentMethod: true, channel: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const map = new Map<string, CustomerRow>();
  const userKey = new Map<string, string>();
  const orderIds = new Map<string, string[]>();
  const blank = (key: string): CustomerRow => ({ key, name: "", phone: null, email: null, userId: null, hasAccount: false, customerType: "RETAIL", businessName: null, orders: 0, spend: 0, firstOrder: null, lastOrder: null, returned: 0, rto: 0, cod: 0, shop: 0, whatsappOffers: false, segments: [] });

  // A person can show up by account, phone or email; any of them leads to the same customer.
  const alias = new Map<string, string>();
  const remember = (key: string, phone?: string | null, email?: string | null) => {
    const pk = phoneKey(phone);
    if (pk && !alias.has(pk)) alias.set(pk, key);
    const em = (email || "").trim().toLowerCase();
    if (em && !isPlaceholderEmail(em) && !alias.has(em)) alias.set(em, key);
  };
  for (const u of users as any[]) {
    const key = alias.get(phoneKey(u.phone)) ?? alias.get((u.email || "").toLowerCase()) ?? customerKey(u.phone, u.email);
    if (!key) continue;
    const c = map.get(key) ?? blank(key);
    Object.assign(c, { name: u.name, phone: u.phone ? phoneKey(u.phone) : c.phone, email: u.email, userId: u.id, hasAccount: true, customerType: u.customerType, businessName: u.businessName, whatsappOffers: !!u.whatsappOptIn });
    map.set(key, c);
    userKey.set(u.id, key);
    remember(key, u.phone, u.email);
  }
  for (const o of orders as any[]) {
    if (!o.customerPhone && isPlaceholderEmail(o.customerEmail)) continue; // anonymous walk-in counter sale
    const email = isPlaceholderEmail(o.customerEmail) ? "" : String(o.customerEmail).toLowerCase();
    const key = (o.userId && userKey.get(o.userId)) || alias.get(phoneKey(o.customerPhone)) || (email && alias.get(email)) || customerKey(o.customerPhone, email);
    if (!key) continue;
    remember(key, o.customerPhone, email);
    orderIds.set(key, [...(orderIds.get(key) ?? []), o.id]);
    const c = map.get(key) ?? blank(key);
    if (!c.name) c.name = o.customerName;
    if (!c.phone && phoneKey(o.customerPhone)) c.phone = phoneKey(o.customerPhone);
    if (!c.email && !isPlaceholderEmail(o.customerEmail)) c.email = o.customerEmail;
    if (BOOKED_STATUSES.includes(o.status)) {
      c.orders++;
      c.spend += o.total;
      c.firstOrder = c.firstOrder ?? o.createdAt.toISOString();
      c.lastOrder = o.createdAt.toISOString();
      if (o.paymentMethod === "COD") c.cod++;
      if (o.channel === "SHOP") c.shop++;
    }
    if (o.status === "RETURNED") c.returned++;
    if (o.status === "RTO") c.rto++;
    map.set(key, c);
  }

  const now = Date.now();
  const rows = [...map.values()].map((c) => {
    const seg: Segment[] = [];
    if (!c.orders) seg.push("noOrders");
    if (c.orders === 1 && c.firstOrder && now - new Date(c.firstOrder).getTime() < 30 * DAY) seg.push("new");
    if (c.orders >= 2) seg.push("repeat");
    if (c.spend >= VIP_SPEND) seg.push("vip");
    if (c.lastOrder && now - new Date(c.lastOrder).getTime() > 60 * DAY) seg.push("inactive");
    if (c.rto > 0) seg.push("codRisk");
    if (c.customerType === "WHOLESALE") seg.push("wholesale");
    return { ...c, spend: Math.round(c.spend * 100) / 100, segments: seg };
  });
  return { rows: rows.sort((a, b) => (b.lastOrder ?? "").localeCompare(a.lastOrder ?? "") || b.spend - a.spend), orderIds };
}

/** Everything about one customer for their profile page. */
export async function getCustomerProfile(key: string) {
  const isPhone = /^\d{10}$/.test(key);
  const user = await prisma.user.findFirst({
    where: isPhone ? { phone: { endsWith: key } } : { email: key },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, customerType: true, businessName: true, gstin: true, wholesaleDiscount: true, whatsappOptIn: true, emailOptIn: true, termsAcceptedAt: true, points: true, provider: true },
  });
  // Same matching as the customer list, so the numbers always agree.
  const ids = (await buildDirectory()).orderIds.get(key) ?? [];
  const orderWhere = { id: { in: ids } };
  const phoneVariants = isPhone ? [key, `91${key}`] : user?.phone ? [phoneKey(user.phone), `91${phoneKey(user.phone)}`] : [];
  const [orders, notes, consents, requests, chats, returns] = await Promise.all([
    prisma.order.findMany({
      where: { ...orderWhere, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, status: true, total: true, paymentMethod: true, channel: true, invoiceNumber: true, shippingAddress: true, customerName: true, customerEmail: true, customerPhone: true, codStatus: true, items: { select: { productName: true, weight: true, quantity: true } } },
    }),
    prisma.customerNote.findMany({ where: { key }, orderBy: { createdAt: "desc" } }),
    prisma.consentRecord.findMany({ where: { OR: [...(user ? [{ userId: user.id }] : []), ...(phoneVariants.length ? [{ phone: { in: phoneVariants } }] : [])] }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.privacyRequest.findMany({ where: { OR: [...(user ? [{ userId: user.id }] : []), ...(isPhone ? [{ phone: { endsWith: key } }] : [{ email: key }])] }, orderBy: { createdAt: "desc" } }),
    phoneVariants.length ? prisma.whatsAppLog.findMany({ where: { phone: { in: phoneVariants } }, orderBy: { createdAt: "desc" }, take: 40 }) : Promise.resolve([]),
    prisma.returnRequest.count({ where: { order: orderWhere } }).catch(() => 0),
  ]);
  if (!user && !orders.length) return null;
  const booked = orders.filter((o: any) => BOOKED_STATUSES.includes(o.status));
  const spend = booked.reduce((s: number, o: any) => s + o.total, 0);
  const addresses = [...new Set(orders.map((o: any) => o.shippingAddress).filter((a: string) => a && !a.startsWith("Counter sale")))].slice(0, 6);
  const name = user?.name ?? orders[0]?.customerName ?? "Customer";
  return JSON.parse(JSON.stringify({
    key, name, user, phone: isPhone ? key : user?.phone ? phoneKey(user.phone) : phoneKey(orders[0]?.customerPhone), email: user?.email ?? orders.find((o: any) => !isPlaceholderEmail(o.customerEmail))?.customerEmail ?? null,
    stats: {
      orders: booked.length, spend: Math.round(spend * 100) / 100, aov: booked.length ? Math.round((spend / booked.length) * 100) / 100 : 0,
      first: booked.length ? booked[booked.length - 1].createdAt : null, last: booked[0]?.createdAt ?? null,
      rto: orders.filter((o: any) => o.status === "RTO").length, cancelled: orders.filter((o: any) => o.status === "CANCELLED").length, returns,
      cod: booked.filter((o: any) => o.paymentMethod === "COD").length,
    },
    orders, addresses, notes, consents, requests, chats,
  }));
}
