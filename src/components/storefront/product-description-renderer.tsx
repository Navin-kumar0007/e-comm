import Link from "next/link";
import { Sparkles, ShieldCheck, Flame, Dumbbell, HeartPulse, Activity } from "lucide-react";

interface ProductDescriptionRendererProps {
  description: string;
  productName: string;
}

export function ProductDescriptionRenderer({ description, productName }: ProductDescriptionRendererProps) {
  if (!description) {
    return (
      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
        Pure, unadulterated harvest direct from partner farms. Packed to retain maximum freshness and natural goodness.
      </p>
    );
  }

  // Parse lines and sections
  const lines = description.split("\n");
  const tableRows: { nutrient: string; amount: string }[] = [];
  const textParagraphs: string[] = [];
  let isInsideTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("|")) {
      isInsideTable = true;
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      // Skip header divider row like |---|---|
      if (cells.length >= 2 && !cells[0].includes("---") && cells[0].toLowerCase() !== "nutrient") {
        tableRows.push({ nutrient: cells[0], amount: cells[1] });
      }
      continue;
    } else {
      isInsideTable = false;
    }

    // Normal text line / header
    textParagraphs.push(line);
  }

  // Helper to render text with markdown links & bold removed or formatted
  const formatInlineText = (text: string) => {
    // Replace [Text](url) with link
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index).replace(/\*\*/g, ""));
      }
      parts.push(
        <Link
          key={match.index}
          href={match[2]}
          className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80 transition-colors ml-1"
        >
          {match[1]}
        </Link>
      );
      lastIdx = linkRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx).replace(/\*\*/g, ""));
    }

    return parts.length > 0 ? parts : text.replace(/\*\*/g, "");
  };

  const getNutrientIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("calorie") || n.includes("energy")) return <Flame className="w-4 h-4 text-amber-500" />;
    if (n.includes("protein")) return <Dumbbell className="w-4 h-4 text-emerald-600" />;
    if (n.includes("fat")) return <HeartPulse className="w-4 h-4 text-rose-500" />;
    return <Activity className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-8">
      {/* Text Sections */}
      <div className="space-y-4">
        {textParagraphs.map((para, idx) => {
          const isHeading =
            para.startsWith("**") &&
            para.endsWith("**") &&
            !para.toLowerCase().includes("nutritional profile");
          const isSourcing = para.toLowerCase().includes("traceability & sourcing");

          if (isHeading) {
            return (
              <h3
                key={idx}
                className="text-lg sm:text-xl font-heading font-bold text-foreground mt-4 mb-2 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                {para.replace(/\*\*/g, "")}
              </h3>
            );
          }

          if (isSourcing) {
            return (
              <h4
                key={idx}
                className="text-base sm:text-lg font-heading font-bold text-foreground mt-6 mb-2 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                {para.replace(/\*\*/g, "")}
              </h4>
            );
          }

          return (
            <p key={idx} className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {formatInlineText(para)}
            </p>
          );
        })}
      </div>

      {/* Modern Nutritional Facts Grid (Parsed from Markdown Table) */}
      {tableRows.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-zinc-900/60 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-amber-500/20 pb-3">
            <div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-foreground">
                Nutritional Profile
              </h4>
              <p className="text-xs text-muted-foreground">Values per 100g of pure harvest</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono">
              Lab Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {tableRows.map((row, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-border/50 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  {getNutrientIcon(row.nutrient)}
                  <span className="font-medium truncate">{row.nutrient}</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-foreground font-mono">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function extractProductShortSummary(desc: string = ""): string {
  if (!desc) return "";
  const lines = desc.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("**") &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("|") &&
      !trimmed.toLowerCase().startsWith("why choose") &&
      trimmed.length > 25
    ) {
      return trimmed.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    }
  }
  return lines[0]?.replace(/\*\*/g, "").trim() || "";
}
