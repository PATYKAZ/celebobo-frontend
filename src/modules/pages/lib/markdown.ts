/** Sous-ensemble Markdown du back-office : titres `##`, paragraphes, listes `-` / `1.`, tableaux `| a | b |`, **gras**, *italique*, [liens](url). */
export type MdBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export interface MdSection {
  heading: string | null;
  blocks: MdBlock[];
}

const ITEM = /^\s*(?:[-*+]|(\d+)[.)])\s+(.*)$/;
const TABLE_ROW = /^\|.*\|$/;
const TABLE_RULE = /^\|(\s*:?-{3,}:?\s*\|)+$/;

const cells = (line: string) => line.slice(1, -1).split("|").map((cell) => cell.trim());

export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let table: string[][] = [];
  const flushTable = () => {
    if (table.length) blocks.push({ type: "table", head: table[0], rows: table.slice(1) });
    table = [];
  };
  const flush = () => {
    flushTable();
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const item = line.match(ITEM);
    if (TABLE_ROW.test(line)) {
      if (paragraph.length) flush();
      // la ligne de séparation `|---|---|` sépare l'en-tête des lignes
      if (!TABLE_RULE.test(line)) table.push(cells(line));
      continue;
    }
    flushTable();
    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length <= 2 ? 2 : 3, text: heading[2] });
    } else if (item) {
      flush();
      const ordered = !!item[1];
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item[2]);
      else blocks.push({ type: "list", ordered, items: [item[2]] });
    } else paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Regroupe les blocs par titre (le contenu avant le premier titre forme une section sans titre). */
export function markdownSections(source: string): MdSection[] {
  const sections: MdSection[] = [];
  for (const block of parseMarkdown(source)) {
    if (block.type === "heading") sections.push({ heading: block.text, blocks: [] });
    else if (sections.length) sections[sections.length - 1].blocks.push(block);
    else sections.push({ heading: null, blocks: [block] });
  }
  return sections;
}

export type MdInline = { type: "text" | "strong" | "em"; text: string } | { type: "link"; text: string; href: string };

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): MdInline[] {
  const parts: MdInline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1]) parts.push({ type: "strong", text: m[1] });
    else if (m[2]) parts.push({ type: "em", text: m[2] });
    else parts.push({ type: "link", text: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

/** Texte brut (sans balisage inline). */
export const plainText = (text: string) => parseInline(text).map((p) => p.text).join("");
