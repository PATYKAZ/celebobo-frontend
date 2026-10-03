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
    detail: (slug: string) => `/categories/${slug}/`,
  },
  products: {
    list: "/products/",
    facets: "/products/facets/",
    detail: (slug: string) => `/products/${slug}/`,
    related: (slug: string) => `/products/${slug}/related/`,
    reviews: (slug: string) => `/products/${slug}/reviews/`,
    reviewEligibility: (slug: string) => `/products/${slug}/reviews/eligibility/`,
    suggest: "/search/suggest/",
  },
  home: "/home/",
  favorites: {
    list: "/me/favorites/",
    remove: (productId: number) => `/me/favorites/${productId}/`,
  },
  /** Panier serveur ; invité identifié par l'en-tête `X-Cart-Token` (jeton renvoyé dans `token`). */
  cart: {
    get: "/cart/", // GET (?city=) / DELETE (vider)
    items: "/cart/items/",
    item: (itemId: number) => `/cart/items/${itemId}/`, // PATCH { quantity } / DELETE
    coupon: "/cart/coupon/", // POST { code } / DELETE
    merge: "/cart/merge/", // POST { token } (connecté) : fusionne le panier invité
  },
  checkout: {
    quote: "/checkout/quote/",
    shippingZones: "/shipping/zones/",
    settings: "/settings/public/", // payment_methods, shipping
  },
  orders: {
    create: "/orders/", // en-tête Idempotency-Key requis
    list: "/me/orders/",
    detail: (number: string) => `/me/orders/${encodeURIComponent(number)}/`,
    cancel: (number: string) => `/me/orders/${encodeURIComponent(number)}/cancel/`,
    invoice: (number: string) => `/me/orders/${encodeURIComponent(number)}/invoice/`,
  },

  // ---- Compte -----------------------------------------------------------
  profile: {
    me: "/me/", // GET / PATCH / DELETE
    devices: "/me/devices/",
    device: (id: number | string) => `/me/devices/${id}/`,
    pushPublicKey: "/push/public-key/",
  },
  uploads: {
    sign: "/uploads/sign/",
    complete: "/uploads/complete/",
  },

  // ---- Échanges ---------------------------------------------------------
  conversations: {
    list: "/conversations/", // ?kind=order|support&status=open|closed&unread=&search=
    create: "/conversations/", // discussion de support : { subject, message }
    detail: (id: number | string) => `/conversations/${id}/`,
    messages: (id: number | string) => `/conversations/${id}/messages/`, // GET (?before=<id>&limit=) + POST { body, attachment, clientMsgId }
    read: (id: number | string) => `/conversations/${id}/read/`,
    close: (id: number | string) => `/conversations/${id}/close/`,
    reopen: (id: number | string) => `/conversations/${id}/reopen/`,
    assign: (id: number | string) => `/conversations/${id}/assign/`, // { resellerId } (support uniquement)
    proposePrice: (id: number | string) => `/conversations/${id}/price-proposals/`,
    respondProposal: (proposalId: number | string) => `/price-proposals/${proposalId}/respond/`,
    clientOrder: (number: string) => `/me/orders/${encodeURIComponent(number)}/`,
    staffOrder: (orderId: number | string) => `/bo/orders/${orderId}/`,
    /** Pièce jointe : signature Cloudinary (purpose message_attachment) puis enregistrement */
    uploadSign: "/uploads/sign/",
    uploadComplete: "/uploads/complete/",
  },
  notifications: {
    list: "/notifications/",
    markRead: (id: number | string) => `/notifications/${id}/read/`,
    readAll: "/notifications/read-all/",
    unreadCounts: "/notifications/unread-counts/",
    assignableResellers: "/bo/resellers/assignable/",
    assignOrder: (orderId: number | string) => `/bo/orders/${orderId}/assign/`, // { resellerId, note }
    declineOrder: (orderId: number | string) => `/bo/orders/${orderId}/decline/`, // { reason }
  },
  assistant: {
    sessions: "/assistant/sessions/",
    session: (id: string) => `/assistant/sessions/${id}/`,
    messages: (id: string) => `/assistant/sessions/${id}/messages/`, // ?stream=false → { content, products, error }
  },
  contact: {
    send: "/contact/",
  },
  newsletter: {
    subscribe: "/newsletter/subscribe/",
    unsubscribe: "/newsletter/unsubscribe/",
  },
  resellerApplication: {
    submit: "/reseller-applications/", // « Devenir revendeur »
  },
  site: {
    settings: "/settings/public/",
    pages: "/pages/",
    page: (slug: string) => `/pages/${encodeURIComponent(slug)}/`,
    faq: "/faq/",
  },
  tracking: {
    lookup: "/orders/track/", // POST { number, contact } (suivi public sans compte)
  },
  /** Temps réel : WebSocket direct vers le backend (env.WS_URL, ticket `auth.wsTicket`) — voir shared/lib/realtime.ts */
  addressBook: {
    list: "/me/addresses/",
    detail: (id: number | string) => `/me/addresses/${id}/`,
    setDefault: (id: number | string) => `/me/addresses/${id}/set-default/`,
  },
  notificationPreferences: {
    get: "/me/notification-preferences/",
  },
  orderActions: {
    cancel: (id: number | string) => `/orders/${id}/cancel/`,
  },

  // ---- Administration (cele-admin/) ------------------------------------
  admin: {
    dashboard: {
      summary: "/bo/dashboard/summary/",
      revenueSeries: "/bo/dashboard/revenue-series/",
      paymentSplit: "/bo/dashboard/payment-split/",
      topProducts: "/bo/dashboard/top-products/",
      recentSales: "/bo/dashboard/recent-sales/",
      openOrders: "/bo/dashboard/open-orders/",
    },
    analytics: {
      categories: "/bo/analytics/categories/",
      peakHours: "/bo/analytics/peak-hours/",
      sellers: "/bo/analytics/sellers/",
      slowMovers: "/bo/analytics/slow-movers/",
      export: "/bo/analytics/export/",
    },
    products: {
      list: "/bo/products/",
      detail: (id: number) => `/bo/products/${id}/`,
      duplicate: (id: number) => `/bo/products/${id}/duplicate/`,
      restore: (id: number) => `/bo/products/${id}/restore/`,
      variants: (id: number) => `/bo/products/${id}/variants/`,
      stockAdjustments: (id: number) => `/bo/products/${id}/stock-adjustments/`,
      stockMovements: (id: number) => `/bo/products/${id}/stock-movements/`,
      bulk: "/bo/products/bulk/",
      import: "/bo/products/import/",
      export: "/bo/products/export/",
      stockAlerts: "/bo/stock/alerts/",
    },
    variants: {
      detail: (id: number) => `/bo/variants/${id}/`,
    },
    reviews: {
      list: "/bo/reviews/",
      detail: (id: number) => `/bo/reviews/${id}/`,
    },
    sales: {
      list: "/bo/sales/",
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
      list: "/bo/categories/",
      detail: (id: number) => `/bo/categories/${id}/`,
      reorder: "/bo/categories/reorder/",
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

  // ---- Transverse -------------------------------------------------------
  /** Tâches asynchrones (exports, imports, rapports) — cf. shared/lib/api/jobs.ts. */
  jobs: {
    list: "/jobs/",
    detail: (id: string) => `/jobs/${id}/`,
    download: (id: string) => `/jobs/${id}/download/`,
  },
} as const;
