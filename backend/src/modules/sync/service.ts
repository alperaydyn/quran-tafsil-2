import { query } from "../../db/client.js";
import type { SyncPushDto, SyncPullDto } from "./dto.js";

export class SyncService {
  private async getEffectiveUserId(userId?: string): Promise<string> {
    if (userId) return userId;
    const res = await query("SELECT id FROM kullanicilar ORDER BY created_at ASC LIMIT 1");
    if (res.rows.length > 0) {
      return res.rows[0].id;
    }
    const createRes = await query(
      "INSERT INTO kullanicilar (auth_provider, auth_provider_id, tercih_modu) VALUES ('anonymous', gen_random_uuid()::text, 'kesif') RETURNING id"
    );
    return createRes.rows[0].id;
  }

  async pushSyncData(data: SyncPushDto) {
    const userId = await this.getEffectiveUserId(data.user_id);
    let bookmarksProcessed = 0;
    let historyProcessed = 0;
    let memorizationProcessed = 0;

    // 1. Process Bookmarks
    for (const b of data.bookmarks) {
      await query(
        `INSERT INTO yer_imleri (kullanici_id, sure_id, ayet_no, etiket, notlar, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (kullanici_id, sure_id, ayet_no)
         DO UPDATE SET 
           etiket = EXCLUDED.etiket,
           notlar = COALESCE(EXCLUDED.notlar, yer_imleri.notlar),
           updated_at = NOW()`,
        [userId, b.sure_id, b.ayet_no, b.etiket || "Genel", b.notlar || null]
      );
      bookmarksProcessed++;
    }

    // 2. Process Reading History
    for (const h of data.reading_history) {
      await query(
        `INSERT INTO okuma_gecmisi (kullanici_id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi)
         VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()))`,
        [userId, h.sure_id, h.ayet_no, h.okunma_suresi_sn || 0, h.okundu_tarihi || null]
      );
      historyProcessed++;
    }

    // 3. Process Memorization Sessions
    for (const m of data.memorization_sessions) {
      if (m.id) {
        await query(
          `INSERT INTO ezber_oturumlari (id, kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, repetition_number, interval_days, ease_factor, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, NOW()))
           ON CONFLICT (id)
           DO UPDATE SET
             durum = EXCLUDED.durum,
             repetition_number = EXCLUDED.repetition_number,
             interval_days = EXCLUDED.interval_days,
             ease_factor = EXCLUDED.ease_factor,
             next_review_at = EXCLUDED.next_review_at`,
          [m.id, userId, m.sure_id, m.baslangic_ayet, m.bitis_ayet, m.durum, m.repetition_number, m.interval_days, m.ease_factor, m.next_review_at || null]
        );
      } else {
        await query(
          `INSERT INTO ezber_oturumlari (kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, repetition_number, interval_days, ease_factor, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()))`,
          [userId, m.sure_id, m.baslangic_ayet, m.bitis_ayet, m.durum, m.repetition_number, m.interval_days, m.ease_factor, m.next_review_at || null]
        );
      }
      memorizationProcessed++;
    }

    return {
      success: true,
      synced_at: new Date().toISOString(),
      user_id: userId,
      counts: {
        bookmarks: bookmarksProcessed,
        reading_history: historyProcessed,
        memorization_sessions: memorizationProcessed
      }
    };
  }

  async pullSyncData(data: SyncPullDto) {
    const userId = await this.getEffectiveUserId(data.user_id);
    const since = data.last_synced_at ? new Date(data.last_synced_at) : new Date(0);

    const bookmarksRes = await query(
      `SELECT id, sure_id, ayet_no, etiket, notlar, created_at, updated_at
       FROM yer_imleri
       WHERE kullanici_id = $1 AND updated_at >= $2
       ORDER BY updated_at ASC`,
      [userId, since.toISOString()]
    );

    const historyRes = await query(
      `SELECT id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi
       FROM okuma_gecmisi
       WHERE kullanici_id = $1 AND okundu_tarihi >= $2
       ORDER BY okundu_tarihi ASC`,
      [userId, since.toISOString()]
    );

    const memorizationRes = await query(
      `SELECT id, sure_id, baslangic_ayet, bitis_ayet, durum, repetition_number, interval_days, ease_factor, next_review_at, created_at
       FROM ezber_oturumlari
       WHERE kullanici_id = $1 AND created_at >= $2
       ORDER BY created_at ASC`,
      [userId, since.toISOString()]
    );

    return {
      success: true,
      synced_at: new Date().toISOString(),
      user_id: userId,
      data: {
        bookmarks: bookmarksRes.rows,
        reading_history: historyRes.rows,
        memorization_sessions: memorizationRes.rows
      }
    };
  }

  async getSyncStatus(userIdInput?: string) {
    const userId = await this.getEffectiveUserId(userIdInput);

    const bookmarkCount = await query(
      "SELECT COUNT(*)::int as count, MAX(updated_at) as last_updated FROM yer_imleri WHERE kullanici_id = $1",
      [userId]
    );

    const historyCount = await query(
      "SELECT COUNT(*)::int as count, MAX(okundu_tarihi) as last_read FROM okuma_gecmisi WHERE kullanici_id = $1",
      [userId]
    );

    const memorizationCount = await query(
      "SELECT COUNT(*)::int as count, MAX(created_at) as last_created FROM ezber_oturumlari WHERE kullanici_id = $1",
      [userId]
    );

    return {
      user_id: userId,
      status: "synced",
      bookmarks: {
        count: bookmarkCount.rows[0].count,
        last_updated: bookmarkCount.rows[0].last_updated
      },
      reading_history: {
        count: historyCount.rows[0].count,
        last_read: historyCount.rows[0].last_read
      },
      memorization: {
        count: memorizationCount.rows[0].count,
        last_created: memorizationCount.rows[0].last_created
      }
    };
  }
}
