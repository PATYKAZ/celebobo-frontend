import { ListPageSkeleton } from "@/shared/ui/PageSkeletons";

export default function Loading() {
  return <ListPageSkeleton label="Chargement des notifications" rows={6} />;
}
