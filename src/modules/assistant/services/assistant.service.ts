import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, wait } from "@/shared/lib/api";
import { productsService } from "@/modules/products/services/products.service";
import { FALLBACK_REPLY, MOCK_RULES } from "../mocks/replies";
import type { AssistantReply } from "../types";

export const assistantService = {
  async send(message: string): Promise<AssistantReply> {
    if (env.USE_MOCKS) {
      await wait(900 + Math.random() * 700);
      const rule = MOCK_RULES.find((r) => r.match.test(message));
      if (!rule) return { reply: FALLBACK_REPLY };
      if (!rule.products) return { reply: rule.reply };
      const res = await productsService.list(rule.products);
      return { reply: rule.reply, products: res.results };
    }
    return api.post<AssistantReply>(ENDPOINTS.assistant.message, { message });
  },
};
