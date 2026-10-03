export * from "./types";
export { ProductsListView } from "./components/ProductsListView";
export { ProductCreateView, ProductEditView } from "./components/ProductFormView";
export { ProductAdminDetailView } from "./components/ProductAdminDetailView";
export { ProductForm } from "./components/ProductForm";
export { StockPill, DeadlineBadge } from "./components/StockBadges";
export {
  useAdminProducts, useAdminProduct, useSaveProduct, useDeleteProduct, useTrashProducts, useRestoreProducts, useDuplicateProduct,
  useBulkProducts, useAdjustStock, useStockMovements, useImportProducts, useProductSalesStats, adminProductKeys,
} from "./hooks/useAdminProducts";
export { adminProductsService } from "./services/admin-products.service";
