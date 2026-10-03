import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { parseInline, parseMarkdown, type MdBlock } from "../lib/markdown";

const SAFE_HREF = /^(\/(?!\/)|https?:|mailto:|tel:)/;

export function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) => {
        if (p.type === "strong") return <strong key={i} className="font-bold text-ink">{p.text}</strong>;
        if (p.type === "em") return <em key={i}>{p.text}</em>;
        if (p.type === "link" && SAFE_HREF.test(p.href)) {
          return p.href.startsWith("/") ? (
            <Link key={i} href={p.href} className="font-semibold text-primary hover:underline">{p.text}</Link>
          ) : (
            <a key={i} href={p.href} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{p.text}</a>
          );
        }
        return <span key={i}>{p.text}</span>;
      })}
    </>
  );
}

export function MarkdownBlocks({ blocks }: { blocks: MdBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          const H = b.level === 2 ? "h2" : "h3";
          return <H key={i} className={cn("text-ink first:mt-0", b.level === 2 ? "mt-7 text-[19px] leading-[26px] sm:text-[22px] sm:leading-[30px]" : "mt-5 text-[16px] leading-[23px] sm:text-[18px]")}><Inline text={b.text} /></H>;
        }
        if (b.type === "list") {
          const L = b.ordered ? "ol" : "ul";
          return (
            <L key={i} className={cn("mt-3 space-y-2 pl-5 first:mt-0", b.ordered ? "list-decimal marker:font-bold marker:text-primary" : "list-disc marker:text-primary")}>
              {b.items.map((it, j) => <li key={j} className="pl-1"><Inline text={it} /></li>)}
            </L>
          );
        }
        return <p key={i} className="mt-3 first:mt-0"><Inline text={b.text} /></p>;
      })}
    </>
  );
}

/** Rendu du Markdown du back-office (sous-ensemble sûr, sans HTML brut). */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("text-[14px] leading-[23px] text-ink-2 sm:text-[15px] sm:leading-[26px]", className)}>
      <MarkdownBlocks blocks={parseMarkdown(source)} />
    </div>
  );
}
