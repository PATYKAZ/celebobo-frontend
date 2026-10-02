import type { Category } from "@/modules/categories/types";
import type { Product } from "@/modules/products/types";
import { VERB_RE } from "../types";

/** Colonnes du CSV produits (import / export). */
export const CSV_HEADERS = [
  "id",
  "nom",
  "description",
  "categorie",
  "prix",
  "prix_achat",
  "prix_solde",
  "stock",
  "seuil_stock",
  "vendu_avant_le",
  "badge",
  "livraison_offerte",
  "frais_livraison",
  "actif",
] as const;
export type CsvHeader = (typeof CSV_HEADERS)[number];

const esc = (v: string | number | boolean | null | undefined) => {
  const s = v == null ? "" : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function productsToCsv(list: Product[]): string {
  const rows = list.map((p) =>
    [p.id, p.name, p.description, p.category, p.price, p.pricePrimary ?? "", p.priceSolde ?? "", p.stock, p.stockThreshold, p.dateWish?.slice(0, 10) ?? "", p.badge ?? "", p.freeShipping ? "oui" : "non", p.shippingFee ?? "", p.isActive === false ? "non" : "oui"]
      .map(esc)
      .join(";"),
  );
  return [CSV_HEADERS.join(";"), ...rows].join("\r\n");
}

export const CSV_TEMPLATE = `${CSV_HEADERS.join(";")}\r\n;Casque Bluetooth Nova;Casque sans fil qui offre une excellente autonomie;Audio;129;70;99;25;5;2026-12-31;Best-seller;oui;;oui`;

/** Télécharge un texte en fichier (BOM UTF-8 pour Excel). */
export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿", text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse un CSV (séparateur ; ou ,) avec guillemets. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = first.split(";").length >= first.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export interface ImportData {
  name: string;
  description: string;
  categoryId: number;
  price: number;
  pricePrimary: number | null;
  priceSolde: number | null;
  stock: number;
  stockThreshold: number;
  dateWish: string | null;
  badge: string | null;
  freeShipping: boolean;
  shippingFee: number | null;
  isActive: boolean;
}

export interface ImportRow {
  /** n° de ligne dans le fichier (1 = en-tête) */
  line: number;
  /** id existant => mise à jour, sinon création */
  id: number | null;
  data: ImportData | null;
  raw: Partial<Record<CsvHeader, string>>;
  errors: string[];
}

const num = (s: string | undefined) => (s == null || s.trim() === "" ? null : Number(s.replace(",", ".")));
const yes = (s: string | undefined, def: boolean) => (s == null || s.trim() === "" ? def : /^(oui|yes|true|1|o)$/i.test(s.trim()));

/** Valide chaque ligne : renvoie les données typées + la liste des erreurs. */
export function validateImport(table: string[][], categories: Category[], existingIds: Set<number>): { rows: ImportRow[]; missingColumns: string[] } {
  if (!table.length) return { rows: [], missingColumns: [...CSV_HEADERS] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const required: CsvHeader[] = ["nom", "description", "categorie", "prix"];
  const missingColumns = required.filter((h) => !head.includes(h));
  const idx = (h: CsvHeader) => head.indexOf(h);

  const rows = table.slice(1).map((cells, i): ImportRow => {
    const raw: Partial<Record<CsvHeader, string>> = {};
    for (const h of CSV_HEADERS) if (idx(h) >= 0) raw[h] = (cells[idx(h)] ?? "").trim();
    const errors: string[] = [];
    const id = raw.id ? Number(raw.id) : null;
    if (id != null && (!Number.isInteger(id) || !existingIds.has(id))) errors.push(`id « ${raw.id} » inconnu (laissez vide pour créer).`);
    const name = raw.nom ?? "";
    if (!name) errors.push("Nom manquant.");
    const description = raw.description ?? "";
    if (description.length < 20 || description.length > 100) errors.push("Description : 20 à 100 caractères.");
    else if (!VERB_RE.test(description)) errors.push("Description : doit contenir un verbe (est, avec, permet…).");
    const cat = categories.find((c) => c.name.toLowerCase() === (raw.categorie ?? "").toLowerCase());
    if (!cat) errors.push(`Catégorie « ${raw.categorie ?? ""} » introuvable.`);
    const price = num(raw.prix);
    if (price == null || Number.isNaN(price) || price <= 0) errors.push("Prix invalide.");
    const solde = num(raw.prix_solde);
    if (solde != null && (Number.isNaN(solde) || solde <= 0 || (price != null && solde >= price))) errors.push("Prix soldé invalide (doit être < prix).");
    const cost = num(raw.prix_achat);
    if (cost != null && (Number.isNaN(cost) || cost < 0)) errors.push("Prix d'achat invalide.");
    const stock = num(raw.stock) ?? 0;
    if (!Number.isInteger(stock) || stock < 0) errors.push("Stock invalide.");
    const threshold = num(raw.seuil_stock) ?? 5;
    if (!Number.isInteger(threshold) || threshold < 0) errors.push("Seuil de stock invalide.");
    const wish = raw.vendu_avant_le || null;
    if (wish && !/^\d{4}-\d{2}-\d{2}$/.test(wish)) errors.push("Date : format AAAA-MM-JJ.");
    const fee = num(raw.frais_livraison);

    const data: ImportData | null = errors.length
      ? null
      : {
          name,
          description,
          categoryId: cat!.id,
          price: price as number,
          pricePrimary: cost,
          priceSolde: solde,
          stock,
          stockThreshold: threshold,
          dateWish: wish,
          badge: raw.badge || null,
          freeShipping: yes(raw.livraison_offerte, false),
          shippingFee: fee != null && !Number.isNaN(fee) ? fee : null,
          isActive: yes(raw.actif, true),
        };
    return { line: i + 2, id: id != null && existingIds.has(id) ? id : null, data, raw, errors };
  });
  return { rows, missingColumns };
}
