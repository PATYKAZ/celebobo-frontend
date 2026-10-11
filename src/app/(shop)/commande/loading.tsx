import { CartLayoutSkeleton } from "@/shared/ui/PageSkeletons";

export default function Loading() {
  return <CartLayoutSkeleton label="Chargement de la commande" lines={2} />;
}
