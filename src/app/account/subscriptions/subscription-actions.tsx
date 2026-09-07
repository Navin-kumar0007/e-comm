"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserSubscriptionAction } from "@/app/actions/user-subscriptions";
import { toast } from "sonner";

export default function SubscriptionActions({ 
  id, 
  status 
}: { 
  id: string, 
  status: string 
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async (newStatus: 'ACTIVE' | 'CANCELLED') => {
    if (newStatus === 'CANCELLED' && !confirm("Are you sure you want to cancel your Taste of Spicy Nuts subscription? You will lose access to early seasonal harvests.")) {
      return;
    }

    setIsProcessing(true);
    try {
      await toggleUserSubscriptionAction(id, newStatus);
      toast.success(newStatus === 'ACTIVE' ? "Subscription reactivated successfully!" : "Subscription cancelled.");
    } catch (err) {
      toast.error("Failed to update subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManage = () => {
    toast.info("Box contents management coming soon!");
  };

  if (status === 'ACTIVE') {
    return (
      <>
        <Button variant="outline" className="rounded-xl flex-1" onClick={handleManage} disabled={isProcessing}>
          Manage Box Contents
        </Button>
        <Button variant="destructive" className="rounded-xl" onClick={() => handleToggle('CANCELLED')} disabled={isProcessing}>
          {isProcessing ? "Updating..." : "Cancel Subscription"}
        </Button>
      </>
    );
  }

  return (
    <Button className="rounded-xl" onClick={() => handleToggle('ACTIVE')} disabled={isProcessing}>
      {isProcessing ? "Updating..." : "Reactivate Subscription"}
    </Button>
  );
}
