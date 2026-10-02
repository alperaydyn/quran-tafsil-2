import { query } from "../../db/client.js";
import crypto from "crypto";

export interface Kullanici {
  id: string;
  auth_provider: string;
  auth_provider_id: string;
  tercih_modu: string;
  dil: string;
  is_premium: boolean;
  created_at: string;
}

const memoryUsers = new Map<string, Kullanici>();

export async function findOrCreateUser(authProvider: string, authProviderId: string): Promise<Kullanici> {
  try {
    const existing = await query<Kullanici>(
      `SELECT * FROM kullanicilar WHERE auth_provider = $1 AND auth_provider_id = $2`,
      [authProvider, authProviderId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const inserted = await query<Kullanici>(
      `INSERT INTO kullanicilar (auth_provider, auth_provider_id) VALUES ($1, $2) RETURNING *`,
      [authProvider, authProviderId]
    );
    return inserted.rows[0];
  } catch (err: any) {
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect ECONNREFUSED")) {
      const key = `${authProvider}:${authProviderId}`;
      const existing = memoryUsers.get(key);
      if (existing) return existing;

      const newUser: Kullanici = {
        id: crypto.randomUUID(),
        auth_provider: authProvider,
        auth_provider_id: authProviderId,
        tercih_modu: "ogrenme",
        dil: "tr",
        is_premium: false,
        created_at: new Date().toISOString(),
      };
      memoryUsers.set(key, newUser);
      memoryUsers.set(newUser.id, newUser);
      return newUser;
    }
    throw err;
  }
}

export async function createGuestUser(): Promise<Kullanici> {
  try {
    const inserted = await query<Kullanici>(
      `INSERT INTO kullanicilar (auth_provider, auth_provider_id, tercih_modu)
       VALUES ('guest', gen_random_uuid()::text, 'ogrenme')
       RETURNING *`
    );
    return inserted.rows[0];
  } catch (err: any) {
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect ECONNREFUSED")) {
      const guestId = crypto.randomUUID();
      const newUser: Kullanici = {
        id: guestId,
        auth_provider: "guest",
        auth_provider_id: `guest_${guestId}`,
        tercih_modu: "ogrenme",
        dil: "tr",
        is_premium: false,
        created_at: new Date().toISOString(),
      };
      memoryUsers.set(guestId, newUser);
      memoryUsers.set(`guest:${newUser.auth_provider_id}`, newUser);
      return newUser;
    }
    throw err;
  }
}

export async function linkGuestUser(
  guestUserId: string,
  authProvider: string,
  authProviderId: string
): Promise<Kullanici> {
  try {
    // 1. Bu provider ve providerId ile daha önce açılmış hesap var mı?
    const existing = await query<Kullanici>(
      `SELECT * FROM kullanicilar WHERE auth_provider = $1 AND auth_provider_id = $2`,
      [authProvider, authProviderId]
    );

    if (existing.rows[0]) {
      const targetUserId = existing.rows[0].id;
      if (targetUserId !== guestUserId) {
        // Misafir kullanıcının verilerini mevcut hesaba aktar
        await query(
          `UPDATE yer_imleri SET kullanici_id = $1 WHERE kullanici_id = $2
           ON CONFLICT (kullanici_id, sure_id, ayet_no) DO NOTHING`,
          [targetUserId, guestUserId]
        );
        await query(
          `UPDATE okuma_gecmisi SET kullanici_id = $1 WHERE kullanici_id = $2`,
          [targetUserId, guestUserId]
        );
        await query(
          `UPDATE ezber_oturumlari SET kullanici_id = $1 WHERE kullanici_id = $2`,
          [targetUserId, guestUserId]
        );
        // Eski geçici misafir kaydını temizle
        await query(`DELETE FROM kullanicilar WHERE id = $1 AND auth_provider IN ('guest', 'anonymous')`, [
          guestUserId,
        ]);
      }
      return existing.rows[0];
    }

    // 2. Eğer henüz bu Apple/Google ID'sine bağlı hesap yoksa, misafir kaydını kalıcı hesaba dönüştür
    const updated = await query<Kullanici>(
      `UPDATE kullanicilar
       SET auth_provider = $1, auth_provider_id = $2
       WHERE id = $3
       RETURNING *`,
      [authProvider, authProviderId, guestUserId]
    );

    if (updated.rows[0]) {
      return updated.rows[0];
    }

    // Fallback: Eğer guestUserId bulunamadıysa doğrudan yeni kullanıcı oluştur
    return findOrCreateUser(authProvider, authProviderId);
  } catch (err: any) {
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect ECONNREFUSED")) {
      const guestUser = memoryUsers.get(guestUserId);
      if (guestUser) {
        guestUser.auth_provider = authProvider;
        guestUser.auth_provider_id = authProviderId;
        memoryUsers.set(`${authProvider}:${authProviderId}`, guestUser);
        return guestUser;
      }
      return findOrCreateUser(authProvider, authProviderId);
    }
    throw err;
  }
}

export async function getUserById(id: string): Promise<Kullanici | null> {
  try {
    const res = await query<Kullanici>(`SELECT * FROM kullanicilar WHERE id = $1`, [id]);
    return res.rows[0] ?? null;
  } catch (err: any) {
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect ECONNREFUSED")) {
      return memoryUsers.get(id) ?? null;
    }
    throw err;
  }
}

export interface UserPrefUpdate {
  tercih_modu?: "kesif" | "ogrenme" | "odak";
  dil?: string;
}

export async function updateUserPrefs(id: string, updates: UserPrefUpdate): Promise<Kullanici | null> {
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (updates.tercih_modu !== undefined) {
      fields.push(`tercih_modu = $${i++}`);
      values.push(updates.tercih_modu);
    }
    if (updates.dil !== undefined) {
      fields.push(`dil = $${i++}`);
      values.push(updates.dil);
    }

    if (fields.length === 0) return getUserById(id);

    values.push(id);
    const res = await query<Kullanici>(
      `UPDATE kullanicilar SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return res.rows[0] ?? null;
  } catch (err: any) {
    if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect ECONNREFUSED")) {
      const user = memoryUsers.get(id);
      if (user) {
        if (updates.tercih_modu) user.tercih_modu = updates.tercih_modu;
        if (updates.dil) user.dil = updates.dil;
        return user;
      }
    }
    throw err;
  }
}
