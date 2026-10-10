import { Fragment, type ReactNode } from "react";

// A small, safe formatter for text written in the website editor (no HTML is ever injected):
//   # Heading, ## Heading, ### Heading     - bullet / * bullet     1. numbered
//   **bold**   _italic_   [link text](https://… or /page or mailto:…)   blank line = new paragraph

const safeHref = (u: string) => (/^(https:\/\/|\/|#|mailto:|tel:)/i.test(u) ? u : null);

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={`${keyBase}-${i++}`}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={`${keyBase}-${i++}`}>{m[3]}</em>);
    else if (m[4]) {
      const href = safeHref(m[5]);
      out.push(href ? <a key={`${keyBase}-${i++}`} href={href} className="text-primary underline" {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{m[4]}</a> : m[4]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (para.length) { blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(" "), `p${blocks.length}`)}</p>); para = []; }
    if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>);
      blocks.push(list.ordered ? <ol key={`o${blocks.length}`}>{items}</ol> : <ul key={`u${blocks.length}`}>{items}</ul>);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) { flush(); continue; }
    if (h) {
      flush();
      const level = h[1].length;
      const content = inline(h[2], `h${blocks.length}`);
      blocks.push(level === 1 ? <h2 key={`h${blocks.length}`}>{content}</h2> : level === 2 ? <h3 key={`h${blocks.length}`}>{content}</h3> : <h4 key={`h${blocks.length}`}>{content}</h4>);
    } else if (ul || ol) {
      if (para.length) { const p = para; para = []; blocks.push(<p key={`p${blocks.length}`}>{inline(p.join(" "), `p${blocks.length}`)}</p>); }
      const ordered = !!ol;
      if (list && list.ordered !== ordered) flush();
      list = list ?? { ordered, items: [] };
      list.items.push((ul ?? ol)![1]);
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return <>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</>;
}
