import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { api, ApiError, mockResponse } from "@/shared/lib/api";
import { resolveDemoUser } from "../mocks/users";
import { DB, nextMockUserId } from "@/shared/mock-db";
import type { LoginInput, RegisterInput, User } from "../types";

export const authService = {
  async login(input: LoginInput): Promise<User> {
    if (env.USE_MOCKS) {
      if (input.password.length < 4) throw new ApiError(400, "Mot de passe invalide", { password: ["Au moins 4 caractères."] });
      const known = resolveDemoUser(input.login);
      // Tout autre identifiant => client générique
      const user: User =
        known ?? {
          id: 99,
          username: input.login.split("@")[0],
          email: input.login.includes("@") ? input.login : `${input.login}@celebobo.com`,
          firstName: input.login.split("@")[0],
          lastName: "",
          role: "client",
          avatar: null,
          phoneNumber: null,
        };
      return mockResponse(user, 600);
    }
    return api.post<User>(ENDPOINTS.auth.login, input);
  },

  async register(input: RegisterInput): Promise<User> {
    if (env.USE_MOCKS) {
      if (input.password !== input.passwordConfirm) {
        throw new ApiError(400, "Les mots de passe ne correspondent pas", { passwordConfirm: ["Les mots de passe ne correspondent pas."] });
      }
      // Crée le compte dans la base de démo (id unique) et rattache le parrain via son code revendeur.
      const sponsor = input.codeRevendeur ? DB.users.find((u) => u.role === "revendeur" && u.codeRevendeur === input.codeRevendeur) : undefined;
      if (input.codeRevendeur && !sponsor) throw new ApiError(400, "Code revendeur inconnu", { codeRevendeur: ["Aucun revendeur trouvé avec ce code."] });
      const id = nextMockUserId();
      DB.users.push({
        id, username: input.email.split("@")[0], email: input.email, firstName: input.firstName, lastName: input.lastName,
        role: "client", avatar: null, phoneNumber: input.phoneNumber ?? null, joinedAt: new Date().toISOString(), active: true, invitedBy: sponsor?.id ?? null,
      });
      return mockResponse<User>(
        { id, username: input.email.split("@")[0], email: input.email, firstName: input.firstName, lastName: input.lastName, role: "client", avatar: null, phoneNumber: input.phoneNumber ?? null },
        700,
      );
    }
    return api.post<User>(ENDPOINTS.auth.register, input);
  },

  async logout(): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(undefined, 200);
    await api.post(ENDPOINTS.auth.logout);
  },

  /** Utilisateur de la session (cookie Django). Renvoie null si non connecté. */
  async me(): Promise<User | null> {
    if (env.USE_MOCKS) return null; // en mock, l'état vient du store persistant
    try {
      return await api.get<User>(ENDPOINTS.auth.me);
    } catch (e) {
      if (e instanceof ApiError && (e.isUnauthorized || e.isForbidden)) return null;
      throw e;
    }
  },

  forgotPassword(email: string): Promise<void> {
    if (env.USE_MOCKS) return mockResponse(undefined, 500);
    return api.post(ENDPOINTS.auth.forgotPassword, { email });
  },
};
