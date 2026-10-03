import { ENDPOINTS } from "@/config/endpoints";
import { api, uploadMedia } from "@/shared/lib/api";
import type { ProfileDto } from "@/modules/auth/services/auth.mapper";
import type { ChangePasswordInput, Profile, UpdatePersonalInput } from "../types";
import { toProfile } from "./account.mapper";

export const accountService = {
  async get(): Promise<Profile> {
    return toProfile(await api.get<ProfileDto>(ENDPOINTS.profile.me));
  },

  /** `PATCH /me/` ; l'avatar est d'abord envoyé à Cloudinary puis référencé par `avatar_upload_id`. */
  async updatePersonal(input: UpdatePersonalInput): Promise<Profile> {
    const avatarUploadId = input.avatar ? (await uploadMedia(input.avatar, "avatar")).id : undefined;
    const dto = await api.patch<ProfileDto>(ENDPOINTS.profile.me, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber.trim() || null,
      ...(input.revendeurCode ? { referralCode: input.revendeurCode } : {}),
      ...(avatarUploadId ? { avatarUploadId } : {}),
    });
    return toProfile(dto);
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await api.post(ENDPOINTS.auth.changePassword, {
      oldPassword: input.oldPassword,
      newPassword1: input.newPassword,
      newPassword2: input.newPasswordConfirm,
    });
  },

  /** Suppression (anonymisation) du compte client ; l'API efface aussi les cookies de session. */
  async remove(): Promise<void> {
    await api.delete(ENDPOINTS.profile.me);
  },
};
