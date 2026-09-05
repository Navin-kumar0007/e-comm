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

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
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
      const data = {
        freeShippingThreshold: Number(fd.get("freeThreshold")),
        flatShippingRate: Number(fd.get("flatRate")),
      };
      await updateAdminSettingsAction(data);
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
      const data = { gstRate: Number(fd.get("gstRate")) };
      await updateAdminSettingsAction(data);
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
                  <p className="text-xs text-muted-foreground">Applied to all orders. Standard GST for food items is 5%.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl text-foreground">
                  <p className="text-sm font-medium">Current Configuration</p>
                  <p className="text-xs text-muted-foreground mt-1">GSTIN: 27AABCU9603R1ZM (configured)</p>
                  <p className="text-xs text-muted-foreground">Currency: {settings.currency}</p>
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
