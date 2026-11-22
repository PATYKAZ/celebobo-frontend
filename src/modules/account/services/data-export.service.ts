import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { DataExportJob, DataExportStatus } from "../types";

/** « Télécharger mes données » : `/me/data-export/` (un export par heure, lien valable 48 h). */
export const dataExportService = {
  status: () => api.get<DataExportStatus>(ENDPOINTS.profile.dataExport),

  /** Lance la préparation (202) ; `429 personal_data_export_too_soon` si un export a été demandé il y a moins d'une heure. */
  request: () => api.post<DataExportJob>(ENDPOINTS.profile.dataExport),

  /** Lien direct (cookies de session, même origine via le proxy). */
  downloadUrl: (id: string) => api.url(ENDPOINTS.profile.dataExportDownload(id)),
};
