"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUserSettings } from "@/app/actions/user-settings";
import { AddressMapSelector } from "@/components/storefront/address-map-selector";

export function SettingsForm({ user, availableTags }: { user: any, availableTags: any[] }) {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  
  const [selectedTags, setSelectedTags] = useState<string[]>(
    user?.dietaryTags?.map((t: any) => t.id) || []
  );

  const toggleDietary = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserSettings({ 
        name, 
        address,
        city,
        state,
        pincode,
        dietaryTagIds: selectedTags 
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Profile Info */}
      <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-5">
        <h2 className="text-lg font-heading font-bold">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled className="rounded-xl opacity-60" />
          </div>
        </div>
      </div>

      {/* Default Shipping Address */}
      <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-heading font-bold">Default Shipping Address</h2>
          <AddressMapSelector 
            onSelectAddress={(data) => {
              setAddress(data.address);
              setCity(data.city);
              setState(data.state);
              setPincode(data.pincode);
            }} 
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={e => setCity(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={state} onChange={e => setState(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" value={pincode} onChange={e => setPincode(e.target.value)} className="rounded-xl" />
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-5">
        <h2 className="text-lg font-heading font-bold">Dietary Preferences</h2>
        <p className="text-sm text-muted-foreground">Select your dietary preferences so we can personalize your experience (highlighting safe products).</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleDietary(tag.id)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                selectedTags.includes(tag.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/50 text-muted-foreground"
              }`}
            >
              {tag.name}
            </button>
          ))}
          {availableTags.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No dietary profiles configured yet.</p>
          )}
        </div>
      </div>

      {/* Save */}
      <Button
        type="submit"
        disabled={isSaving}
        className="rounded-full h-12 px-8 shadow-lg hover:shadow-primary/25 transition-all"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" /> Save Changes
          </>
        )}
      </Button>
    </form>
  );
}
