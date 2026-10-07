"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export function PincodeChecker({ price }: { price: number }) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ serviceable: boolean; message: string } | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setResult({ serviceable: false, message: "Enter a valid 6-digit pincode." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/serviceability?pincode=${pincode}&value=${price}`);
      const data = await res.json();
      setResult(data.error ? { serviceable: false, message: "Couldn't check right now. Please try again." } : data);
    } catch {
      setResult({ serviceable: false, message: "Couldn't check right now. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={check} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[220px]">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Delivery pincode"
            aria-label="Delivery pincode"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
        </button>
      </form>
      {result && (
        <p className={`text-xs font-medium ${result.serviceable ? "text-primary" : "text-destructive"}`}>{result.message}</p>
      )}
    </div>
  );
}
