"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
      } else {
        toast.success("Password updated. Please sign in.");
        router.push("/login");
        return;
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">This reset link is incomplete. Please request a new one.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="rounded-full">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" className="pl-10 h-11 rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required autoComplete="new-password" className="pl-10 h-11 rounded-xl" />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-full text-base font-semibold">
        {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : "Set New Password"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Sign In
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 pt-28 md:pt-36">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold">Spicy Nuts</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Choose a New Password</h1>
        </div>
        <div className="glass rounded-3xl p-8 shadow-xl border border-border/50">
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
