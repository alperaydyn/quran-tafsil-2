import { query } from "../../db/client.js";

export interface Kullanici {
  id: string;
  auth_provider: string;
  auth_provider_id: string;
  tercih_modu: string;
  dil: string;
  is_premium: boolean;
  created_at: string;
}

export async function findOrCreateUser(authProvider: string, authProviderId: string): Promise<Kullanici> {
  const existing = await query<Kullanici>(
    `SELECT * FROM kullanicilar WHERE auth_provider = $1 AND auth_provider_id = $2`,
    [authProvider, authProviderId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await query<Kullanici>(
    `INSERT INTO kullanicilar (auth_provider, auth_provider_id) VALUES ($1, $2) RETURNING *`,
    [authProvider, authProviderId],
  );
  return inserted.rows[0];
}

export async function getUserById(id: string): Promise<Kullanici | null> {
  const res = await query<Kullanici>(`SELECT * FROM kullanicilar WHERE id = $1`, [id]);
  return res.rows[0] ?? null;
}

export interface UserPrefUpdate {
  tercih_modu?: "kesif" | "ogrenme" | "odak";
  dil?: string;
}

export async function updateUserPrefs(id: string, updates: UserPrefUpdate): Promise<Kullanici | null> {
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
    values,
  );
  return res.rows[0] ?? null;
}
