"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import Link from "next/link";
import { Leaf, Mail, Lock, User, Loader2, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
      } else {
        toast.success("OTP sent! Check your email inbox.");
        setCooldown(60);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
    setIsSending(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every(d => d !== "") && newOtp.join("").length === 6) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        toast.success("Email verified! ✅");
        setIsVerified(true);
        setStep(2);
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    }
    setIsVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords don\'t match");
      setIsLoading(false);
      return;
    }

    const result = await registerUser({ name, email, password });

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("Account created!", {
      description: "Please sign in with your new credentials.",
    });
    router.push("/login");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 pt-28 md:pt-36">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-terracotta/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-[28rem] h-[28rem] bg-brand-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold">Spicy Nuts</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join the organic food revolution</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${step === 1 && !isVerified ? 'bg-primary text-primary-foreground' : isVerified ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
            {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            Verify Email
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <User className="w-3.5 h-3.5" />
            Create Account
          </div>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8 shadow-xl border border-border/50">

          {/* STEP 1: Email + OTP */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={isSending || cooldown > 0}
                className="w-full h-11 rounded-full font-semibold"
              >
                {isSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <><ShieldCheck className="w-4 h-4 mr-2" /> Send Verification Code</>
                )}
              </Button>

              {cooldown > 0 && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">Enter the 6-digit code sent to your email</p>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    ))}
                  </div>
                  {isVerifying && (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Name + Password */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>{email}</strong> verified</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" name="name" placeholder="Your full name" required className="pl-10 h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full text-base font-semibold shadow-lg hover:shadow-primary/25 transition-all"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
