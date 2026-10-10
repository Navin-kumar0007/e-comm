"use client";

import { useState } from "react";
import { Store, Truck, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAdminSettingsAction } from "@/app/actions/admin-settings";
import { toast } from "sonner";

type SettingsTab = 'general' | 'shipping' | 'tax';

type ProviderInfo = { id: string; name: string; configured: boolean };

export default function SettingsForm({ initialSettings, providers }: { initialSettings: any; providers: ProviderInfo[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleGeneralSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const data = {
        storeName: fd.get("storeName") as string,
        contactEmail: fd.get("contactEmail") as string,
        storeDescription: fd.get("storeDescription") as string,
      };
      await updateAdminSettingsAction(data);
      setSettings({ ...settings, ...data });
      toast.success("General settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShippingSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const text = (k: string) => ((fd.get(k) as string) || "").trim() || null;
      const data = {
        freeShippingThreshold: Number(fd.get("freeThreshold")),
        flatShippingRate: Number(fd.get("flatRate")),
        shippingProvider: (fd.get("shippingProvider") as string) || "MANUAL",
        pickupName: text("pickupName"),
        pickupPhone: text("pickupPhone"),
        pickupAddress: text("pickupAddress"),
        pickupCity: text("pickupCity"),
        pickupState: text("pickupState"),
        pickupPincode: text("pickupPincode"),
        defaultPackageWeightGrams: Number(fd.get("defaultPackageWeightGrams")),
        packageLengthCm: Number(fd.get("packageLengthCm")),
        packageBreadthCm: Number(fd.get("packageBreadthCm")),
        packageHeightCm: Number(fd.get("packageHeightCm")),
        codEnabled: fd.get("codEnabled") === "on",
        codMaxOrderValue: Number(fd.get("codMaxOrderValue")),
        returnWindowHours: Number(fd.get("returnWindowHours")),
      };
      const res = await updateAdminSettingsAction(data);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSettings({ ...settings, ...data });
      toast.success("Shipping settings saved!");
    } catch (err) {
      toast.error("Failed to save shipping settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaxSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const data = {
        gstRate: Number(fd.get("gstRate")),
        gstin: ((fd.get("gstin") as string) || "").trim() || null,
        legalName: ((fd.get("legalName") as string) || "").trim() || null,
        businessAddress: ((fd.get("businessAddress") as string) || "").trim() || null,
        businessState: ((fd.get("businessState") as string) || "").trim() || null,
        invoicePrefix: (fd.get("invoicePrefix") as string) || "SN",
        fssaiLicense: ((fd.get("fssaiLicense") as string) || "").trim() || null,
        upiId: ((fd.get("upiId") as string) || "").trim() || null,
        signatoryName: ((fd.get("signatoryName") as string) || "").trim() || null,
        invoiceTerms: ((fd.get("invoiceTerms") as string) || "").trim() || null,
      };
      const res = await updateAdminSettingsAction(data);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      setSettings({ ...settings, ...data });
      toast.success("Tax settings saved!");
    } catch (err) {
      toast.error("Failed to save tax settings");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: 'general' as const, label: 'General', icon: Store },
    { key: 'shipping' as const, label: 'Shipping', icon: Truck },
    { key: 'tax' as const, label: 'Tax & GST', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage store preferences and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSave} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg border-b pb-4 text-foreground">Store Information</h2>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Store Name</Label><Input name="storeName" defaultValue={settings.storeName} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Contact Email</Label><Input name="contactEmail" defaultValue={settings.contactEmail} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Store Description</Label><Textarea name="storeDescription" defaultValue={settings.storeDescription} rows={3} className="rounded-xl" /></div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="rounded-full">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'shipping' && (
            <form onSubmit={handleShippingSave} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg border-b pb-4 text-foreground">Shipping Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Free Shipping Threshold (₹)</Label>
                  <Input name="freeThreshold" type="number" defaultValue={settings.freeShippingThreshold} className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Orders above this amount get free shipping</p>
                </div>
                <div className="space-y-2">
                  <Label>Flat Shipping Rate (₹)</Label>
                  <Input name="flatRate" type="number" defaultValue={settings.flatShippingRate} className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Applied to orders below the free shipping threshold</p>
                </div>

                <h3 className="font-semibold pt-4 border-t">Delivery Partner</h3>
                <div className="space-y-2">
                  <Label>Default partner for booking &amp; pincode checks</Label>
                  <select name="shippingProvider" defaultValue={settings.shippingProvider ?? "MANUAL"} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                    {providers.map(p => (
                      <option key={p.id} value={p.id} disabled={!p.configured}>
                        {p.name}{p.configured ? "" : " — add API credentials to enable"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Manual = you book with any courier and paste the AWB. API partners book, print labels and track automatically.</p>
                </div>

                <h3 className="font-semibold pt-4 border-t">Pickup Address (warehouse)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Contact / Warehouse Name</Label><Input name="pickupName" defaultValue={settings.pickupName ?? ""} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Pickup Phone</Label><Input name="pickupPhone" defaultValue={settings.pickupPhone ?? ""} className="rounded-xl" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input name="pickupAddress" defaultValue={settings.pickupAddress ?? ""} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>City</Label><Input name="pickupCity" defaultValue={settings.pickupCity ?? ""} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>State</Label><Input name="pickupState" defaultValue={settings.pickupState ?? ""} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Pincode</Label><Input name="pickupPincode" inputMode="numeric" maxLength={6} defaultValue={settings.pickupPincode ?? ""} className="rounded-xl" /></div>
                </div>

                <h3 className="font-semibold pt-4 border-t">Package Defaults</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Min weight (g)</Label><Input name="defaultPackageWeightGrams" type="number" min={50} defaultValue={settings.defaultPackageWeightGrams ?? 500} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Length (cm)</Label><Input name="packageLengthCm" type="number" min={1} defaultValue={settings.packageLengthCm ?? 20} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Breadth (cm)</Label><Input name="packageBreadthCm" type="number" min={1} defaultValue={settings.packageBreadthCm ?? 15} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Height (cm)</Label><Input name="packageHeightCm" type="number" min={1} defaultValue={settings.packageHeightCm ?? 10} className="rounded-xl" /></div>
                </div>

                <h3 className="font-semibold pt-4 border-t">Cash on Delivery &amp; Returns</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="codEnabled" defaultChecked={settings.codEnabled ?? true} className="w-4 h-4" /> Offer Cash on Delivery
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max COD order value (₹)</Label>
                    <Input name="codMaxOrderValue" type="number" min={0} defaultValue={settings.codMaxOrderValue ?? 5000} className="rounded-xl" />
                    <p className="text-xs text-muted-foreground">Bigger orders must pay online (limits RTO losses).</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Return window (hours after delivery)</Label>
                    <Input name="returnWindowHours" type="number" min={0} defaultValue={settings.returnWindowHours ?? 48} className="rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="rounded-full">
                  {isSaving ? "Saving..." : "Save Shipping"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'tax' && (
            <form onSubmit={handleTaxSave} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
              <h2 className="font-heading font-bold text-lg border-b pb-4 text-foreground">Tax Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>GST Rate (%)</Label>
                  <Input name="gstRate" type="number" step="0.1" defaultValue={settings.gstRate} className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Prices are GST-inclusive; this rate is used to show the GST portion on invoices.</p>
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input name="gstin" defaultValue={settings.gstin ?? ""} placeholder="e.g. 29ABCDE1234F1Z5" className="rounded-xl font-mono uppercase" />
                  <p className="text-xs text-muted-foreground">Leave empty if not GST-registered — invoices will then print as a plain &quot;Invoice&quot;, not a &quot;Tax Invoice&quot;.</p>
                </div>
                <div className="space-y-2">
                  <Label>Registered Business Name</Label>
                  <Input name="legalName" defaultValue={settings.legalName ?? ""} placeholder="As on GST certificate" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Registered Business Address</Label>
                  <Textarea name="businessAddress" defaultValue={settings.businessAddress ?? ""} rows={2} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business State</Label>
                    <Input name="businessState" defaultValue={settings.businessState ?? ""} placeholder="e.g. Karnataka" className="rounded-xl" />
                    <p className="text-xs text-muted-foreground">Same-state orders show CGST + SGST; others show IGST.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Number Prefix</Label>
                    <Input name="invoicePrefix" defaultValue={settings.invoicePrefix ?? "SN"} className="rounded-xl font-mono uppercase" />
                    <p className="text-xs text-muted-foreground">Invoices are numbered PREFIX/2026-27/00001.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>FSSAI Licence No.</Label>
                    <Input name="fssaiLicense" inputMode="numeric" maxLength={14} defaultValue={settings.fssaiLicense ?? ""} placeholder="14 digits" className="rounded-xl font-mono" />
                    <p className="text-xs text-muted-foreground">Food businesses must print this on every invoice.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Shop UPI ID</Label>
                    <Input name="upiId" defaultValue={(settings as any).upiId ?? ""} placeholder="e.g. spicynuts@okicici" className="rounded-xl font-mono lowercase" />
                    <p className="text-xs text-muted-foreground">Counter billing shows a payment QR with the exact bill amount.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Authorised Signatory</Label>
                    <Input name="signatoryName" defaultValue={settings.signatoryName ?? ""} placeholder="Owner / proprietor name" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Terms (optional)</Label>
                  <Textarea name="invoiceTerms" defaultValue={settings.invoiceTerms ?? ""} rows={2} placeholder="e.g. Goods once sold are returnable only as per our returns policy." className="rounded-xl" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="rounded-full">
                  {isSaving ? "Saving..." : "Save Tax Settings"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
