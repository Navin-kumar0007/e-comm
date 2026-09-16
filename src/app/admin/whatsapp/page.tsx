"use client";

import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Tag, 
  Sparkles, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Phone,
  HelpCircle,
  ExternalLink,
  Clock,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getWhatsAppMarketingDataAction, 
  broadcastOfferAction, 
  broadcastNewReleaseAction 
} from "@/app/actions/whatsapp-actions";

export default function WhatsAppMarketingPage() {
  const [activeTab, setActiveTab] = useState<"OFFER" | "RELEASE" | "LOGS" | "SETTINGS">("OFFER");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // Broadcast Offer Form
  const [offerTitle, setOfferTitle] = useState("Festival of Lights Royal Harvest Sale");
  const [offerDiscount, setOfferDiscount] = useState(15);
  const [offerCode, setOfferCode] = useState("ROYAL15");
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  // Broadcast New Release Form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isSendingRelease, setIsSendingRelease] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getWhatsAppMarketingDataAction();
      setData(res);

      // Fetch products for release dropdown
      const prodRes = await fetch("/api/products?limit=20").then(r => r.json()).catch(() => []);
      if (Array.isArray(prodRes) && prodRes.length > 0) {
        setProducts(prodRes);
        setSelectedProductId(prodRes[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load WhatsApp marketing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCode.trim()) {
      toast.error("Please provide a coupon code.");
      return;
    }

    setIsSendingOffer(true);
    const res = await broadcastOfferAction({
      title: offerTitle,
      discount: Number(offerDiscount),
      couponCode: offerCode.trim().toUpperCase(),
    });
    setIsSendingOffer(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Broadcast dispatched to ${res.sent} subscribers!`);
      loadData();
    }
  };

  const handleSendRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product.");
      return;
    }

    setIsSendingRelease(false);
    const res = await broadcastNewReleaseAction(selectedProductId);
    setIsSendingRelease(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`New release announcement sent to ${res.sent} subscribers!`);
      loadData();
    }
  };

  const metrics = data?.metrics || { total: 0, offers: 0, releases: 0, priceDrops: 0 };
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              WhatsApp Marketing &amp; Automation
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Automate personalized WhatsApp broadcasts, offers, harvest drops, price alerts &amp; order tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-none font-mono text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" /> Auto-Dispatcher Active
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl gap-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">{metrics.total}</div>
          <span className="text-[11px] text-muted-foreground mt-1">Direct WhatsApp opt-ins</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Offer Alerts</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">{metrics.offers}</div>
          <span className="text-[11px] text-muted-foreground mt-1">Opted into secret deals</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">New Harvests</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">{metrics.releases}</div>
          <span className="text-[11px] text-muted-foreground mt-1">Opted into new releases</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Price Drops</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">{metrics.priceDrops}</div>
          <span className="text-[11px] text-muted-foreground mt-1">Active price watch alerts</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 gap-2 overflow-x-auto pb-1">
        {[
          { id: "OFFER", label: "Broadcast Offer / Coupon", icon: Tag },
          { id: "RELEASE", label: "Announce New Release", icon: Sparkles },
          { id: "LOGS", label: "Delivery Activity Logs", icon: Clock },
          { id: "SETTINGS", label: "API Configuration", icon: HelpCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#0A261D] dark:bg-amber-500 text-white dark:text-zinc-950 font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Broadcast Offer */}
      {activeTab === "OFFER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSendOffer} className="lg:col-span-7 bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-heading font-bold text-foreground">Draft Offer Broadcast</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Dispatches directly to customers who subscribed for deals. Includes formatted markdown and emojis.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Campaign Headline</label>
              <Input
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="e.g. Royal Diwali Harvest Sale"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Discount %</label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(Number(e.target.value))}
                  className="rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Coupon Code</label>
                <Input
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ROYAL15"
                  className="rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSendingOffer || metrics.offers === 0}
                className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md gap-2"
              >
                <Send className="w-4 h-4" />
                {isSendingOffer ? "Broadcasting..." : `Send Offer Broadcast (${metrics.offers} Subscribers)`}
              </Button>
            </div>
          </form>

          {/* WhatsApp Preview Card */}
          <div className="lg:col-span-5 bg-[#ECE5DD] dark:bg-zinc-950 p-4 sm:p-5 rounded-3xl border border-border/60 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <MessageCircle className="w-4 h-4 text-[#25D366]" /> Live WhatsApp Message Preview
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm text-xs leading-relaxed font-sans text-zinc-800 dark:text-zinc-200 space-y-3">
                <div className="font-bold text-amber-700 dark:text-amber-400">✨ SPICY NUTS — ROYAL HARVEST OFFER ✨</div>
                <div>{offerTitle}</div>
                <div>
                  Enjoy an exclusive <strong className="font-bold">{offerDiscount}% OFF</strong> on our imperial single-estate dry fruits &amp; organic spices!
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-zinc-800 rounded-xl border border-amber-500/20 font-mono text-[11px]">
                  🎁 Use Coupon Code: <strong>{offerCode || "ROYAL15"}</strong>
                </div>
                <div className="text-primary underline">🛍️ https://spicynuts.in/shop</div>
                <div className="text-[10px] text-zinc-500 italic pt-1 border-t border-border/40">
                  100% Pure • Sun-Dried • Direct from Partner Farms
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              Formatted with native WhatsApp bolding, links, and emojis.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Broadcast New Release */}
      {activeTab === "RELEASE" && (
        <div className="max-w-2xl bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-heading font-bold text-foreground">Announce New Product Launch</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Select an active harvest from your inventory to instantly alert subscribers on WhatsApp.
          </p>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Select Harvest Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.weight || "Standard"}) — ₹{p.salePrice || p.price}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSendRelease}
              disabled={isSendingRelease || metrics.releases === 0}
              className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isSendingRelease ? "Broadcasting..." : `Announce to ${metrics.releases} WhatsApp Subscribers`}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Activity Logs */}
      {activeTab === "LOGS" && (
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-bold text-foreground">Recent WhatsApp Activity Log</h3>
            <span className="text-xs text-muted-foreground">Showing last {recentLogs.length} events</span>
          </div>

          {recentLogs.length > 0 ? (
            <div className="divide-y divide-border/40 overflow-x-auto">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono font-bold">+{log.phone}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">
                        {log.type}
                      </Badge>
                      <Badge
                        className={`text-[10px] font-bold border-none py-0 ${
                          log.status === "SENT"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : log.status === "SIMULATED"
                            ? "bg-blue-500/15 text-blue-700"
                            : "bg-rose-500/15 text-rose-700"
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-1 max-w-xl">{log.message}</p>
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-[11px] font-mono">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No WhatsApp messages logged yet. Send a test broadcast above or subscribe in the storefront!
            </div>
          )}
        </div>
      )}

      {/* Tab 4: API Configuration */}
      {activeTab === "SETTINGS" && (
        <div className="max-w-3xl bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground">WhatsApp Gateway Configuration</h3>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <strong className="font-bold">Zero-Setup Simulator Mode is Active:</strong> Every automated WhatsApp message (offers, price drops, order confirmations) is safely simulated and logged to the database so your store never crashes.
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground">To Connect Live Meta WhatsApp Cloud API:</h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li>Visit Meta for Developers (<a href="https://developers.facebook.com" target="_blank" className="text-primary underline">developers.facebook.com</a>) and create a WhatsApp Business App.</li>
              <li>Get your <strong>Permanent Access Token</strong> and <strong>Phone Number ID</strong>.</li>
              <li>Add the following keys to your project <code className="bg-muted px-1.5 py-0.5 rounded font-mono">.env</code>:</li>
            </ol>
            <pre className="p-4 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto">
{`WHATSAPP_PHONE_NUMBER_ID="your_meta_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_meta_cloud_access_token"`}
            </pre>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="font-semibold text-sm text-foreground">Alternative: Twilio WhatsApp Gateway</h4>
            <pre className="p-4 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto">
{`TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
