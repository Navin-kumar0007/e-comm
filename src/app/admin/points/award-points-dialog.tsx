"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X } from "lucide-react";
import { awardPointsAction } from "@/app/actions/admin-points";
import { toast } from "sonner";

export default function AwardPointsDialog({ 
  userId, 
  userName,
  currentPoints
}: { 
  userId: string;
  userName: string;
  currentPoints: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [points, setPoints] = useState<number>(100);

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await awardPointsAction(userId, points);
      toast.success(`Successfully ${points > 0 ? 'awarded' : 'deducted'} ${Math.abs(points)} points`);
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to update points");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="text-amber-600 border-amber-200 hover:bg-amber-50"
      >
        <Sparkles size={16} className="mr-1.5" /> Award Points
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Modify Points</h3>
                  <p className="text-sm text-gray-500">For {userName} (Current: {currentPoints})</p>
                </div>
              </div>

              <form onSubmit={handleAward} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Points to Add (or Deduct)</label>
                  <Input 
                    type="number"
                    required
                    value={points}
                    onChange={e => setPoints(Number(e.target.value))}
                    className="text-lg font-bold"
                  />
                  <p className="text-xs text-gray-500">Use a negative number to deduct points.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="flex-1 bg-amber-500 hover:bg-amber-600">
                    {isProcessing ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
