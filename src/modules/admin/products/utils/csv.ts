/** Colonnes du CSV produits accepté par l'API (import) ; `slug` présent = mise à jour, absent = création. */
export const CSV_HEADERS = ["slug", "name", "description", "category", "price", "sale_price", "cost_price", "stock", "stock_threshold", "is_active"] as const;

export const CSV_REQUIRED = ["name", "category", "price"] as const;

export const CSV_TEMPLATE = `${CSV_HEADERS.join(";")}\r\n;Casque Bluetooth Nova;Casque sans fil qui offre une excellente autonomie;audio;129;99;70;25;5;oui`;

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
