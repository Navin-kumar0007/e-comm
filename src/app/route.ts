import { getSiteContent } from "@/lib/site-content";
import { prisma } from "@/lib/db/prisma";
import { SITE_URL } from "@/lib/site";
import { storeJsonLd } from "@/lib/store-jsonld";
import { LANDING_BODY } from "./_royal/landing-body";

// The homepage is the cinematic Royal Pantry page (built from the landing artifact, see _royal/).
// It is a complete HTML page with its own menu, basket and footer, so it is served here rather than
// inside the shop layout. Title and description come from the website editor's SEO fields.
// Rebuilt in the background at most every 10 minutes, and straight away when the editor saves.
export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type ShopEntry = { slug: string; price: number; stock: number };
const SHOP_RE = /const SHOP = (\{[^\n]*?\});/;

/**
 * The landing page was generated with each jar's price and stock typed in. Swap that table for
 * today's values from the catalogue (first active pack size, sale price if any; hidden or missing
 * products show as sold out), so admin changes reach the homepage. Falls back to the built page.
 */
async function landingWithLivePrices() {
  const m = LANDING_BODY.match(SHOP_RE);
  if (!m) return LANDING_BODY;
  try {
    const shop = JSON.parse(m[1]) as Record<string, ShopEntry>;
    const products = await prisma.product.findMany({
      where: { slug: { in: Object.values(shop).map((p) => p.slug) } },
      select: {
        slug: true, price: true, salePrice: true, stock: true, status: true,
        variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }], take: 1, select: { price: true, salePrice: true, stock: true } },
      },
    });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    for (const entry of Object.values(shop)) {
      const p = bySlug.get(entry.slug);
      const v = p?.variants[0];
      entry.price = Number(v ? (v.salePrice ?? v.price) : (p?.salePrice ?? p?.price ?? entry.price));
      entry.stock = p && p.status === "ACTIVE" ? Math.max(0, v ? v.stock : p.stock) : 0;
    }
    return LANDING_BODY.replace(m[0], `const SHOP = ${JSON.stringify(shop).replace(/</g, "\\u003c")};`);
  } catch (e) {
    console.error("[HOME] Live prices failed, serving the built page:", e);
    return LANDING_BODY;
  }
}

export async function GET() {
  const [seo, body] = await Promise.all([getSiteContent("seo"), landingWithLivePrices()]);
  const title = esc(seo.homeTitle), description = esc(seo.homeDescription);
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  // Google Analytics only after the visitor says yes, with the same choice and banner as the rest of the shop.
  const consent = ga
    ? `<div id="cc" role="dialog" aria-label="Cookie choices" hidden style="position:fixed;z-index:100;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);max-width:560px;margin:0 auto;padding:16px;border-radius:18px;background:#fffdf8;color:#24140f;border:1px solid rgba(201,164,90,.5);box-shadow:0 24px 50px -20px rgba(0,0,0,.6);font:14px/1.45 Manrope,system-ui,sans-serif">
<p style="margin:0">We use essential cookies to run the shop (login, cart). With your permission we also use Google Analytics to see which pages are useful. <a href="/privacy-policy" style="color:#6e1a2c;font-weight:700">Privacy Policy</a></p>
<p style="margin:12px 0 0;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px"><button type="button" data-cc="denied" style="height:40px;padding:0 16px;border-radius:99px;border:1px solid #e8ddcc;background:#fff;font:700 13px Manrope,system-ui,sans-serif;cursor:pointer">Only essential</button><button type="button" data-cc="granted" style="height:40px;padding:0 16px;border-radius:99px;border:0;background:#6e1a2c;color:#fff;font:700 13px Manrope,system-ui,sans-serif;cursor:pointer">Accept analytics</button></p></div>
<script>(function(){var K="sn-cookie-consent",id=${JSON.stringify(ga)},c=null;try{c=localStorage.getItem(K)}catch(e){}
function load(){var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",id,{anonymize_ip:true});}
if(c==="granted")load();else if(c!=="denied"){var b=document.getElementById("cc");b.hidden=false;b.addEventListener("click",function(e){var v=e.target.getAttribute&&e.target.getAttribute("data-cc");if(!v)return;try{localStorage.setItem(K,v)}catch(x){}b.hidden=true;if(v==="granted")load();});}})();</script>`
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${SITE_URL}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="Spicy Nuts"><meta property="og:locale" content="en_IN">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${SITE_URL}/">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}">
<meta name="theme-color" content="#1a0509">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Spicy Nuts">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script type="application/ld+json">${JSON.stringify(storeJsonLd).replace(/</g, "\\u003c")}</script>
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
${consent}
</body>
</html>
`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
