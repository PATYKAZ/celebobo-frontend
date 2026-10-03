import {
  Camera, Flash, Game, Headphone, Keyboard, Mobile, Monitor, Printer, Devices, Watch, Category2, type Icon,
} from "iconsax-reactjs";

/** Noms d'icônes (champ Category.icon, insensible à la casse) -> composant Iconsax. */
const MAP: Record<string, Icon> = {
  camera: Camera, flash: Flash, game: Game, headphone: Headphone, keyboard: Keyboard,
  mobile: Mobile, monitor: Monitor, printer: Printer, tablet: Devices, watch: Watch,
};

/** Icône Iconsax d'une catégorie (par nom). Fallback : Category2. */
export function CategoryIcon({ name, size = 18, variant = "Linear", className }: { name?: string; size?: number; variant?: "Linear" | "Bold" | "Bulk"; className?: string }) {
  const Cmp = (name && MAP[name.toLowerCase()]) || Category2;
  return <Cmp size={size} variant={variant} className={className} />;
}
