import { money } from "@/modules/products/services/products.mapper";
import type { Cart, CartItem, CartProduct, CartQuote } from "../types";

export interface QuoteLineDto {
  productId: number;
  variantId: number | null;
  name: string;
  variantLabel: string;
  image: string;
  unitPrice: string;
  quantity: number;
  total: string;
}

/** Devis de l'API (`quote` du panier et `POST /checkout/quote/`). */
export interface QuoteDto {
  lines: QuoteLineDto[];
  subtotal: string;
  discount: string;
  shippingFee: string;
  total: string;
  freeShippingRemaining: string | null;
  shippingZone: string;
  deliveryEstimate: string;
  couponCode: string | null;
  couponError: string | null;
}

export interface CartLineDto {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  available: boolean;
}

export interface CartDto {
  token: string | null;
  lines: CartLineDto[];
  quote: QuoteDto;
}

export function toQuote(dto: QuoteDto): CartQuote {
  return {
    subtotal: money(dto.subtotal),
    discount: money(dto.discount),
    shippingFee: money(dto.shippingFee),
    total: money(dto.total),
    freeShippingRemaining: dto.freeShippingRemaining == null ? null : money(dto.freeShippingRemaining),
    shippingZone: dto.shippingZone || null,
    deliveryEstimate: dto.deliveryEstimate || null,
    couponCode: dto.couponCode || null,
    couponError: dto.couponError || null,
  };
}

/**
 * Les lignes du panier ne portent que des identifiants : nom, image et prix viennent du devis,
 * slug / catégorie / prix catalogue de la fiche produit (`products`).
 */
function toItem(line: CartLineDto, quote: QuoteDto, products: ReadonlyMap<number, CartProduct>): CartItem {
  const priced = quote.lines.find((q) => q.productId === line.productId && q.variantId === line.variantId);
  const known = products.get(line.productId);
  const unit = priced ? money(priced.unitPrice) : (known?.priceSolde ?? known?.price ?? 0);
  const catalog = !line.variantId && known && known.price > unit ? known.price : unit;
  return {
    id: line.id,
    productId: line.productId,
    variantId: line.variantId,
    variantLabel: priced?.variantLabel || null,
    quantity: line.quantity,
    available: line.available,
    product: {
      id: line.productId,
      slug: known?.slug ?? "",
      name: priced?.name ?? known?.name ?? "Produit indisponible",
      image: (line.variantId ? priced?.image : null) || known?.image || priced?.image || null,
      price: catalog,
      priceSolde: catalog > unit ? unit : null,
      category: known?.category,
      freeShipping: known?.freeShipping,
    },
  };
}

export function toCart(dto: CartDto, products: ReadonlyMap<number, CartProduct>): Cart {
  return { token: dto.token, items: dto.lines.map((l) => toItem(l, dto.quote, products)), quote: toQuote(dto.quote) };
}
