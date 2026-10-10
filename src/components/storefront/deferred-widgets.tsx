"use client";

import dynamic from "next/dynamic";

// Floating helpers that are not needed for the first screen. Their code downloads after the
// page has shown, so phones paint the page sooner.
const AIConcierge = dynamic(() => import("./ai-concierge").then((m) => m.AIConcierge), { ssr: false });
const WhatsAppWelcomePrompt = dynamic(() => import("./whatsapp-welcome-prompt").then((m) => m.WhatsAppWelcomePrompt), { ssr: false });
const AccessibilityToolbar = dynamic(() => import("@/components/accessibility/accessibility-toolbar").then((m) => m.AccessibilityToolbar), { ssr: false });

export function DeferredWidgets({ popup }: { popup: { enabled: boolean; title: string; text: string; delaySeconds: number } }) {
  return (
    <>
      <AIConcierge />
      <WhatsAppWelcomePrompt enabled={popup.enabled} title={popup.title} text={popup.text} delaySeconds={popup.delaySeconds} />
      <AccessibilityToolbar />
    </>
  );
}
