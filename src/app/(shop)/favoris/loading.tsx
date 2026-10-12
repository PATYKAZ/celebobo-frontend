import { Block } from "@/shared/ui/Block";
import { BreadcrumbSkeleton, ProductGridSkeleton, SkeletonRoot, TitleBlockSkeleton } from "@/shared/ui/PageSkeletons";

export default function Loading() {
  return (
    <SkeletonRoot label="Chargement de vos favoris">
      <BreadcrumbSkeleton />
      <TitleBlockSkeleton description={false} />
      <Block pad="none" className="p-3 sm:p-6">
        <ProductGridSkeleton count={10} columns={5} />
      </Block>
    </SkeletonRoot>
  );
}
