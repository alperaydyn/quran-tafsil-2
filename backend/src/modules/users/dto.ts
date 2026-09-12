import type { Kullanici } from "./service.js";

export interface PublicUser {
  id: string;
  tercihModu: string;
  dil: string;
  isPremium: boolean;
  createdAt: string;
}

export function toPublicUser(user: Kullanici): PublicUser {
  return {
    id: user.id,
    tercihModu: user.tercih_modu,
    dil: user.dil,
    isPremium: user.is_premium,
    createdAt: user.created_at,
  };
}
