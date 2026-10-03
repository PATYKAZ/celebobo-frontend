import { ENDPOINTS } from "@/config/endpoints";
import { api } from "@/shared/lib/api";
import type { ContactInput, ContactReceipt } from "../types";

export const contactService = {
  /** `POST /contact/` (202) — `website` est le champ piège anti-robots, toujours vide. */
  async send(input: ContactInput): Promise<ContactReceipt> {
    await api.post(ENDPOINTS.contact.send, {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() ?? "",
      subject: input.subject,
      message: input.message.trim(),
      website: "",
    });
    return { sentAt: new Date().toISOString() };
  },
};
