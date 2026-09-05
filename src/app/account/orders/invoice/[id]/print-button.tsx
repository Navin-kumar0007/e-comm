'use client';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
export default function InvoicePrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline">
      <Printer className="w-4 h-4 mr-2" /> Print Invoice
    </Button>
  );
}
