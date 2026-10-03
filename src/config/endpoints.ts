/**
 * Contrat de l'API Celebobo v1 (Django REST Framework) — source : `/api/v1/schema/`.
 *
 * - Base : env.API_URL (`/api/v1`, relayé vers Django par next.config.ts)
 * - Les clés JSON sont en snake_case côté Django ; le client convertit automatiquement
 *   en camelCase à la réception et en snake_case à l'envoi (cf. shared/lib/api/case.ts).
 * - Listes paginées : { results, next, previous, meta: { count, page, pageSize, totalPages } } → `api.page`.
 * - Auth : JWT en cookies httpOnly (cb_access / cb_refresh) + CSRF — voir shared/lib/api/client.ts.
 */
export const ENDPOINTS = {
  auth: {
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    me: "/me/",
    forgotPassword: "/auth/password/reset/",
    resetPassword: "/auth/password/reset/confirm/",
    changePassword: "/auth/password/change/",
    verifyEmail: "/auth/email/verify/",
    resendVerification: "/auth/email/resend/",
    google: "/auth/social/google/",
    referralCode: (code: string) => `/auth/referral-codes/${encodeURIComponent(code)}/validate/`,
    wsTicket: "/auth/ws-ticket/",
  },

  // ---- Boutique ---------------------------------------------------------
  categories: {
    list: "/categories/",
    detail: (id: number | string) => `/categories/${id}/`, // category/<pk>/
  },
  products: {
    list: "/products/", // products/, results/ (?search=), category/<pk>/ (?category=)
    detail: (id: number | string) => `/products/${id}/`, // product/<pk>/
    testimonies: (id: number | string) => `/products/${id}/testimonies/`, // GET + POST (testimony/add/)
    related: (id: number | string) => `/products/${id}/related/`,
    suggest: "/products/suggest/", // autocomplétion de recherche
  },
  favorites: {
    list: "/favorites/", // favoris/
    toggle: (productId: number | string) => `/favorites/${productId}/toggle/`, // favori/<id>/toggle/
  },
  cart: {
    get: "/cart/",
    addItem: "/cart/items/", // add-to-cart/
    updateItem: (productId: number | string) => `/cart/items/${productId}/`, // update-cart/
    removeItem: (productId: number | string) => `/cart/items/${productId}/`, // remove-from-cart/
    clear: "/cart/",
  },
  orders: {
    create: "/orders/", // start-conversation/ : crée Order + Conversation depuis le panier
    list: "/orders/", // my_orders/ (?status=attente|traitement|terminé)
    detail: (id: number | string) => `/orders/${id}/`,
  },

  // ---- Compte -----------------------------------------------------------
  profile: {
    get: "/profile/", // profile/updateinfo/
    update: "/profile/", // PATCH (multipart pour l'avatar)
    addresses: "/profile/addresses/",
  },

  // ---- Échanges ---------------------------------------------------------
  conversations: {
    list: "/conversations/", // conversations/, messages/, discussions/
    create: "/conversations/", // conversations/new/
    detail: (id: number | string) => `/conversations/${id}/`,
    messages: (id: number | string) => `/conversations/${id}/messages/`, // GET (?after=<id>) + POST multipart
  },
  notifications: {
    list: "/notifications/",
    markRead: (id: number | string) => `/notifications/${id}/read/`,
    assign: (id: number | string) => `/notifications/${id}/assign/`, // body: { revendeurId }
    assignDiscussion: (id: number | string) => `/notifications/${id}/assign-discussion/`,
    mukubwaReply: (id: number | string) => `/notifications/${id}/mukubwa-reply/`,
    revendeurReply: (id: number | string) => `/notifications/${id}/revendeur-reply/`,
  },
  assistant: {
    message: "/assistant/message/", // assistant/message/
    history: "/assistant/history/",
  },
  contact: {
    send: "/contact/",
  },
  newsletter: {
    subscribe: "/newsletter/subscribe/",
  },
  resellerApplication: {
    submit: "/reseller-applications/", // « Devenir revendeur »
  },
  tracking: {
    lookup: "/orders/track/", // ?number=&contact=  (suivi public sans compte)
  },
  /** Temps réel : WebSocket (NEXT_PUBLIC_WS_URL) ou SSE. Canaux : conversation:{id}, user:{id}, presence */
  realtime: {
    ws: "/ws/",
    sse: "/events/",
  },
  addressBook: {
    list: "/profile/addresses-book/",
    detail: (id: number | string) => `/profile/addresses-book/${id}/`,
  },
  notificationPreferences: {
    get: "/profile/notification-preferences/",
    pushSubscribe: "/profile/push-subscriptions/",
  },
  orderActions: {
    cancel: (id: number | string) => `/orders/${id}/cancel/`,
  },

  // ---- Administration (cele-admin/) ------------------------------------
  admin: {
    dashboard: "/admin/dashboard/",
    analytics: "/admin/analytics/", // graphs/
    products: {
      list: "/admin/products/",
      create: "/admin/products/",
      detail: (id: number | string) => `/admin/products/${id}/`,
      update: (id: number | string) => `/admin/products/${id}/`,
      remove: (id: number | string) => `/admin/products/${id}/`,
    },
    sales: {
      list: "/admin/sales/", // ventes/, ventes_rev/
      create: "/admin/sales/",
      bulk: "/admin/sales/bulk/", // bulk-vente/
      detail: (id: number | string) => `/admin/sales/${id}/`,
      update: (id: number | string) => `/admin/sales/${id}/`,
      remove: (id: number | string) => `/admin/sales/${id}/`,
      exportExcel: "/admin/sales/export/excel/",
      exportPdf: "/admin/sales/export/pdf/",
      searchOrders: "/admin/orders/search/", // api/orders/search/
    },
    resellers: {
      list: "/admin/resellers/", // revendeurs/invites
    },
    orders: {
      list: "/admin/orders/",
      detail: (id: number | string) => `/admin/orders/${id}/`,
      assign: (id: number | string) => `/admin/orders/${id}/assign/`,
      updateStatus: (id: number | string) => `/admin/orders/${id}/status/`,
    },
    conversations: {
      conclude: (id: number | string) => `/admin/conversations/${id}/conclude/`, // conclure_discussion
      list: "/admin/conversations/", // boîte de réception (?assigned=false&awaitingReply=true)
    },
    categories: {
      list: "/admin/categories/",
      detail: (id: number | string) => `/admin/categories/${id}/`,
      reorder: "/admin/categories/reorder/",
    },
    stock: {
      movements: (productId: number | string) => `/admin/products/${productId}/stock-movements/`,
      adjust: (productId: number | string) => `/admin/products/${productId}/stock/`,
    },
    productsBulk: {
      action: "/admin/products/bulk/",
      importCsv: "/admin/products/import/",
      exportCsv: "/admin/products/export/",
      restore: (id: number | string) => `/admin/products/${id}/restore/`,
    },
    salesActions: {
      convertOrder: (orderId: number | string) => `/admin/orders/${orderId}/convert-to-sales/`,
      refund: (saleId: number | string) => `/admin/sales/${saleId}/refund/`,
    },
    orderWorkflow: {
      status: (id: number | string) => `/admin/orders/${id}/status/`,
      history: (id: number | string) => `/admin/orders/${id}/history/`,
      reassign: (id: number | string) => `/admin/orders/${id}/reassign/`,
    },
    resellersAdmin: {
      create: "/admin/resellers/",
      detail: (id: number | string) => `/admin/resellers/${id}/`,
      setActive: (id: number | string) => `/admin/resellers/${id}/active/`,
      availability: "/me/availability/",
    },
    commissions: {
      list: "/admin/commissions/",
      payments: "/admin/commissions/payments/",
      mine: "/me/commissions/",
    },
    users: {
      list: "/admin/users/",
      detail: (id: number | string) => `/admin/users/${id}/`,
      setRole: (id: number | string) => `/admin/users/${id}/role/`,
    },
    audit: {
      list: "/admin/audit-log/",
    },
    me: {
      dashboard: "/me/dashboard/", // tableau de bord revendeur
      orders: "/me/orders/",
      sales: "/me/sales/",
      invites: "/me/invites/",
    },
  },
} as const;
