"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCouponAction } from "@/app/actions/admin-coupons";
import { toast } from "sonner";

export default function CouponDeleteButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    setIsDeleting(true);
    try {
      await deleteCouponAction(id);
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error("Failed to delete coupon");
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 size={16} />
    </Button>
  );
}
