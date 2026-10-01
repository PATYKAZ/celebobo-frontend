/**
 * Contrat d'API attendu (REST / Django REST Framework).
 *
 * - Base : env.API_URL  (ex: http://localhost:8000/api)
 * - Les clés JSON sont en snake_case côté Django ; le client convertit automatiquement
 *   en camelCase à la réception et en snake_case à l'envoi (cf. shared/lib/api/case.ts).
 * - Listes paginées : { count, next, previous, results }  (cf. shared/lib/api/types.ts)
 * - Auth : session Django (cookies + CSRF) — voir shared/lib/api/client.ts.
 *
 * Correspondance avec l'ancien backend Django (templates) indiquée en commentaire.
 */
export const ENDPOINTS = {
  auth: {
    login: "/auth/login/", // allauth /accounts/login/
    register: "/auth/register/", // allauth /accounts/signup/
    logout: "/auth/logout/",
    me: "/auth/me/",
    forgotPassword: "/auth/password/forgot/",
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
    },
  },
} as const;
