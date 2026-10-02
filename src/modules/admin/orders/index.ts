export * from "./types";
export { OrdersView } from "./components/OrdersView";
export { OrderDetailView } from "./components/OrderDetailView";
export { AssignResellerModal } from "./components/AssignResellerModal";
export { StatusActionBar } from "./components/StatusActionBar";
export { StatusStepper, StatusHistory } from "./components/OrderProgress";
export { OrderStatusDot, AvailabilityDot } from "./components/parts";
export { useAdminOrders, useAdminOrder, useResellerOptions, adminOrderKeys } from "./hooks/useAdminOrders";
export { adminOrdersService } from "./services/admin-orders.service";
// Transitions & assignation : hooks partagés du module orders
export { useSetOrderStatus, useAssignOrder } from "@/modules/orders/hooks/useOrderWorkflow";
