import { Receipt2 } from "iconsax-reactjs";

interface Line {
  name: string;
  qty: string;
  amount: string;
}

/** Extrait les lignes du message auto-généré (« - Produit × 2 = $99.00 » + « Total : $… »). */
export function parseCartMessage(content: string): { lines: Line[]; total: string | null } {
  const lines: Line[] = [];
  let total: string | null = null;
  for (const raw of content.split("\n")) {
    const l = raw.trim();
    const m = l.match(/^-\s*(.+?)\s*[×x]\s*(\d+)\s*=\s*(.+)$/);
    if (m) lines.push({ name: m[1], qty: m[2], amount: m[3] });
    const t = l.match(/^Total\s*:\s*(.+)$/i);
    if (t) total = t[1];
  }
  return { lines, total };
}

/** Récapitulatif de commande affiché à la place du texte brut du message auto-généré. */
export function OrderSummaryCard({ content, orderId, mine }: { content: string; orderId?: number | null; mine?: boolean }) {
  const { lines, total } = parseCartMessage(content);
  if (!lines.length) return <p className="whitespace-pre-wrap">{content}</p>;
  return (
    <div className="min-w-[240px]">
      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide opacity-90">
        <Receipt2 size={16} variant="Bold" /> Demande de commande{orderId ? ` #${orderId}` : ""}
      </div>
      <ul className={`divide-y rounded-lg px-3 ${mine ? "divide-white/20 bg-white/15" : "divide-line-3 bg-page/60"}`}>
        {lines.map((l, i) => (
          <li key={i} className="flex items-start justify-between gap-3 py-2 text-[13px] leading-[18px]">
            <span className="min-w-0">
              <span className="block font-semibold">{l.name}</span>
              <span className="opacity-70">Quantité : {l.qty}</span>
            </span>
            <span className="shrink-0 font-bold">{l.amount}</span>
          </li>
        ))}
      </ul>
      {total && (
        <div className="mt-2 flex items-center justify-between text-[14px] font-bold">
          <span>Total</span>
          <span>{total}</span>
        </div>
      )}
    </div>
  );
}
