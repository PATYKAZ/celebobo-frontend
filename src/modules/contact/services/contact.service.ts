import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, mockResponse } from "@/shared/lib/api";
import type { ContactInput } from "../types";

export const contactService = {
  send(input: ContactInput): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(undefined, 900);
    return api.post(ENDPOINTS.contact.send, input);
  },
};
