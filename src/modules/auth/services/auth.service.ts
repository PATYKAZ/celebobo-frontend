import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";
import type { LoginInput, RegisterInput, RegisterResult, ResetPasswordInput, User } from "../types";
import { toUser, type ProfileDto } from "./auth.mapper";

async function currentUser(): Promise<User> {
  return toUser(await api.get<ProfileDto>(ENDPOINTS.auth.me));
}

export const authService = {
  async login(input: LoginInput): Promise<User> {
    await api.post(ENDPOINTS.auth.login, { email: input.login.trim(), password: input.password });
    return currentUser();
  },

  /** Connexion Google : le backend échange le `code` OAuth et pose les cookies de session. */
  async loginWithGoogle(code: string): Promise<User> {
    await api.post(ENDPOINTS.auth.google, { code });
    return currentUser();
  },

  register(input: RegisterInput): Promise<RegisterResult> {
    return api.post<RegisterResult>(ENDPOINTS.auth.register, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      phoneNumber: input.phoneNumber,
      referralCode: input.codeRevendeur,
    });
  },

  async logout(): Promise<void> {
    await api.post(ENDPOINTS.auth.logout);
  },

  /** Utilisateur de la session (cookies JWT). Renvoie null si non connecté. */
  async me(): Promise<User | null> {
    try {
      return await currentUser();
    } catch (e) {
      if (e instanceof ApiError && (e.isUnauthorized || e.isForbidden)) return null;
      throw e;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post(ENDPOINTS.auth.forgotPassword, { email });
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await api.post(ENDPOINTS.auth.resetPassword, {
      uid: input.uid,
      token: input.token,
      newPassword1: input.password,
      newPassword2: input.passwordConfirm,
    });
  },

  async verifyEmail(key: string): Promise<void> {
    await api.post(ENDPOINTS.auth.verifyEmail, { key });
  },

  async resendVerification(email: string): Promise<void> {
    await api.post(ENDPOINTS.auth.resendVerification, { email });
  },
};
