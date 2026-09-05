"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { markSubscriptionDeliveredAction } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";

export default function MarkDeliveredButton({ id }: { id: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkDelivered = async () => {
    if (!confirm("Has this month's box been dispatched? This will push their next delivery date forward by 1 month.")) return;
    
    setIsProcessing(true);
    try {
      await markSubscriptionDeliveredAction(id);
      toast.success("Box marked as delivered! Next delivery date updated.");
    } catch (err) {
      toast.error("Failed to update subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleMarkDelivered}
      disabled={isProcessing}
      className="text-primary border-primary/20 hover:bg-primary/10"
    >
      <Truck size={16} className="mr-1.5" /> 
      {isProcessing ? "Updating..." : "Mark Dispatched"}
    </Button>
  );
}
