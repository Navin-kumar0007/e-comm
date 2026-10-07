"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    {
      role: "model",
      content:
        "Greetings! I am the Spicy Nuts Royal Concierge. How may I assist you with our single-estate dry fruits, organic masalas, or custom spice blends today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: "user" as const, content: input }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Network error. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button - positioned safely above mobile nav */}
      <Button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Shopping Concierge"
        className={`fixed bottom-[214px] right-3.5 md:bottom-24 md:right-6 rounded-full w-11 h-11 md:w-14 md:h-14 shadow-2xl z-40 bg-gradient-to-br from-royal-deep to-royal-deep hover:from-royal-deep hover:to-royal-deep text-brand-gold border border-brand-gold/40 hover:scale-105 active:scale-95 transition-all ${
          isOpen ? "hidden" : "flex"
        }`}
      >
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse text-brand-gold" />
      </Button>

      {/* Floating Chat Window - responsive for mobile and desktop */}
      {isOpen && (
        <div className="fixed bottom-[88px] right-3 left-3 sm:left-auto sm:right-6 md:bottom-6 sm:w-96 bg-background dark:bg-zinc-950 border border-brand-gold/30 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[75vh] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-royal-deep via-royal-deep to-royal-deep text-brand-gold p-4 flex items-center justify-between border-b border-brand-gold/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center border border-brand-gold/30">
                <Bot size={18} className="text-brand-gold" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-brand-gold leading-none">
                  Spicy Nuts Concierge
                </h3>
                <span className="text-[10px] text-brand-gold font-mono">
                  AI Sommelier &amp; Guide
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-brand-gold hover:bg-white/10 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 h-72 md:h-80 overflow-y-auto flex flex-col gap-3 text-xs md:text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="w-6 h-6 rounded-full bg-secondary/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} className="text-brand-gold-deep dark:text-brand-gold" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-brand-gold to-brand-gold text-white rounded-br-none shadow-sm"
                      : "bg-muted/70 text-foreground border border-border/40 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={12} className="text-brand-gold-deep dark:text-brand-gold" />
                </div>
                <div className="p-3 rounded-2xl bg-muted/70 text-muted-foreground rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-border/50 bg-muted/20 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Mamra almonds, saffron..."
              className="flex-1 bg-background border border-border/80 rounded-full px-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-royal-deep hover:bg-royal-deep dark:bg-secondary dark:hover:bg-secondary dark:text-zinc-950 text-brand-gold border border-brand-gold/30 shrink-0 h-9 w-9 md:h-10 md:w-10"
              disabled={loading || !input.trim()}
            >
              <Send size={15} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
