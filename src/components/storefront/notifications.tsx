"use client";

import { useState, useEffect } from "react";
import { Bell, Package, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationsDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(console.error);
    }
  }, [session]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'ORDER': return <Package className="w-4 h-4 text-primary" />;
      case 'PROMO': return <Tag className="w-4 h-4 text-secondary" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!session) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative text-primary hover:bg-white/5 transition-colors rounded-full p-2 h-9 w-9 inline-flex items-center justify-center">
        
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" 
              />
            )}
          </AnimatePresence>
        
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 glass-panel border-white/10 shadow-2xl bg-surface/95 backdrop-blur-3xl" align="end">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h4 className="font-heading font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto hide-scrollbar flex flex-col">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notif, i) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-4 p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                  if (notif.link) {
                    setOpen(false);
                    window.location.href = notif.link;
                  }
                }}
              >
                <div className={`mt-1 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-primary/20' : 'bg-muted'}`}>
                  {getIcon(notif.type)}
                </div>
                <div>
                  <p className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
