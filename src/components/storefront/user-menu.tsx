"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, Package, Settings, LogIn, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm" className="rounded-full gap-2 text-sm">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background" />}>
        <User className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
        <div className="px-3 py-2 mb-1">
          <p className="font-semibold text-sm">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />} className="rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" /> My Account
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/vault" />} className="rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" /> Pantry Vault
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/orders" />} className="rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" /> My Orders
          </div>
        </DropdownMenuItem>
        {(session.user as any).role === "ADMIN" && (
          <DropdownMenuItem render={<Link href="/admin" />} className="rounded-lg cursor-pointer">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Shield className="w-4 h-4" /> Admin Panel
            </div>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href="/account/settings" />} className="rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
