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
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 rounded-full w-12 h-12 md:w-14 md:h-14 shadow-2xl z-40 bg-gradient-to-br from-[#052C1E] to-[#0A3D2A] hover:from-[#0A3D2A] hover:to-[#052C1E] text-amber-300 border border-amber-500/40 hover:scale-105 active:scale-95 transition-all ${
          isOpen ? "hidden" : "flex"
        }`}
      >
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse text-amber-300" />
      </Button>

      {/* Floating Chat Window - responsive for mobile and desktop */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 md:bottom-6 sm:w-96 bg-background dark:bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[75vh] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#052C1E] via-[#0A3D2A] to-[#052C1E] text-amber-200 p-4 flex items-center justify-between border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Bot size={18} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-amber-100 leading-none">
                  Spicy Nuts Concierge
                </h3>
                <span className="text-[10px] text-amber-300/80 font-mono">
                  AI Sommelier &amp; Guide
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-200 hover:bg-white/10 rounded-full"
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
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} className="text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-br-none shadow-sm"
                      : "bg-muted/70 text-foreground border border-border/40 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={12} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="p-3 rounded-2xl bg-muted/70 text-muted-foreground rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-200" />
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
              className="flex-1 bg-background border border-border/80 rounded-full px-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-foreground"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-[#052C1E] hover:bg-[#0A3D2A] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-amber-300 border border-amber-500/30 shrink-0 h-9 w-9 md:h-10 md:w-10"
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
