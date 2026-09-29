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

    // 3. Process Concept History
    let conceptProcessed = 0;
    if (data.concept_history && data.concept_history.length > 0) {
      for (const c of data.concept_history) {
        await query(
          `INSERT INTO kavram_gecmisi (kullanici_id, kavram_slug, kavram_adi, incelenme_suresi_sn, created_at)
           VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()))`,
          [userId, c.kavram_slug, c.kavram_adi, c.incelenme_suresi_sn || 0, c.created_at || null]
        );
        conceptProcessed++;
      }
    }

    // 4. Process Memorization Sessions
    for (const m of data.memorization_sessions) {
      if (m.id) {
        await query(
          `INSERT INTO ezber_oturumlari (id, kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, baslik, repetition_number, interval_days, ease_factor, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, NOW()))
           ON CONFLICT (id)
           DO UPDATE SET
             durum = EXCLUDED.durum,
             baslik = COALESCE(EXCLUDED.baslik, ezber_oturumlari.baslik),
             repetition_number = EXCLUDED.repetition_number,
             interval_days = EXCLUDED.interval_days,
             ease_factor = EXCLUDED.ease_factor,
             next_review_at = EXCLUDED.next_review_at`,
          [m.id, userId, m.sure_id, m.baslangic_ayet, m.bitis_ayet, m.durum, m.baslik || null, m.repetition_number, m.interval_days, m.ease_factor, m.next_review_at || null]
        );
      } else {
        await query(
          `INSERT INTO ezber_oturumlari (kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, baslik, repetition_number, interval_days, ease_factor, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, NOW()))`,
          [userId, m.sure_id, m.baslangic_ayet, m.bitis_ayet, m.durum, m.baslik || null, m.repetition_number, m.interval_days, m.ease_factor, m.next_review_at || null]
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
        concept_history: conceptProcessed,
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

    const conceptRes = await query(
      `SELECT id, kavram_slug, kavram_adi, incelenme_suresi_sn, created_at
       FROM kavram_gecmisi
       WHERE kullanici_id = $1 AND created_at >= $2
       ORDER BY created_at ASC`,
      [userId, since.toISOString()]
    );

    const memorizationRes = await query(
      `SELECT id, sure_id, baslangic_ayet, bitis_ayet, durum, baslik, repetition_number, interval_days, ease_factor, next_review_at, created_at
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
        concept_history: conceptRes.rows,
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

    const conceptCount = await query(
      "SELECT COUNT(*)::int as count, MAX(created_at) as last_created FROM kavram_gecmisi WHERE kullanici_id = $1",
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
      concept_history: {
        count: conceptCount.rows[0].count,
        last_created: conceptCount.rows[0].last_created
      },
      memorization: {
        count: memorizationCount.rows[0].count,
        last_created: memorizationCount.rows[0].last_created
      }
    };
  }

  /**
   * Kullanıcının gün gün kronolojik okuma, kavram ve ezber geçmişini gruplayarak döner.
   * Format:
   * - Sure ve okunan ayet aralıkları: "Fatiha (1-7)", "Bakara (12-25, 45-67)"
   * - Kavramlar münferit: "Kavram: Rab"
   * - Ezber: "Ezber: Oturum Adı"
   */
  async getReadingTimeline(userIdInput?: string) {
    const userId = await this.getEffectiveUserId(userIdInput);

    // 1. Okuma geçmişi (Sure adları ile birleştirilmiş)
    const historyRes = await query<{
      sure_id: number;
      ayet_no: number;
      sure_adi: string;
      okunma_suresi_sn: number;
      okundu_tarihi: string;
    }>(
      `SELECT h.sure_id, h.ayet_no, s.ad_tr as sure_adi, h.okunma_suresi_sn, h.okundu_tarihi
       FROM okuma_gecmisi h
       JOIN sureler s ON s.id = h.sure_id
       WHERE h.kullanici_id = $1
       ORDER BY h.okundu_tarihi DESC, h.sure_id ASC, h.ayet_no ASC`,
      [userId]
    );

    // 2. Kavram geçmişi
    const conceptRes = await query<{
      kavram_slug: string;
      kavram_adi: string;
      incelenme_suresi_sn: number;
      created_at: string;
    }>(
      `SELECT kavram_slug, kavram_adi, incelenme_suresi_sn, created_at
       FROM kavram_gecmisi
       WHERE kullanici_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // 3. Ezber oturumları
    const memorizationRes = await query<{
      id: string;
      sure_id: number;
      baslangic_ayet: number;
      bitis_ayet: number;
      durum: string;
      baslik: string | null;
      sure_adi: string;
      created_at: string;
    }>(
      `SELECT m.id, m.sure_id, m.baslangic_ayet, m.bitis_ayet, m.durum, m.baslik, s.ad_tr as sure_adi, m.created_at
       FROM ezber_oturumlari m
       JOIN sureler s ON s.id = m.sure_id
       WHERE m.kullanici_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    // Tarihe göre gruplama (YYYY-MM-DD)
    const dayGroups: Record<string, {
      date: string;
      versesBySurah: Record<number, { sure_adi: string; ayahs: number[]; duration: number }>;
      concepts: Array<{ slug: string; name: string; duration: number; time: string }>;
      memorizations: Array<{ id: string; title: string; surah: string; range: string; status: string; time: string }>;
    }> = {};

    const getDayBucket = (dateStr: string) => {
      const d = new Date(dateStr).toISOString().slice(0, 10);
      if (!dayGroups[d]) {
        dayGroups[d] = {
          date: d,
          versesBySurah: {},
          concepts: [],
          memorizations: []
        };
      }
      return dayGroups[d];
    };

    // Ayetleri grupla
    for (const h of historyRes.rows) {
      const bucket = getDayBucket(h.okundu_tarihi);
      if (!bucket.versesBySurah[h.sure_id]) {
        bucket.versesBySurah[h.sure_id] = {
          sure_adi: h.sure_adi,
          ayahs: [],
          duration: 0
        };
      }
      bucket.versesBySurah[h.sure_id].ayahs.push(h.ayet_no);
      bucket.versesBySurah[h.sure_id].duration += h.okunma_suresi_sn || 0;
    }

    // Kavramları grupla
    for (const c of conceptRes.rows) {
      const bucket = getDayBucket(c.created_at);
      const timeStr = new Date(c.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      bucket.concepts.push({
        slug: c.kavram_slug,
        name: c.kavram_adi,
        duration: c.incelenme_suresi_sn,
        time: timeStr
      });
    }

    // Ezberleri grupla
    for (const m of memorizationRes.rows) {
      const bucket = getDayBucket(m.created_at);
      const timeStr = new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      const sessionTitle = m.baslik || `${m.sure_adi} (${m.baslangic_ayet}-${m.bitis_ayet}) Ezber Oturumu`;
      bucket.memorizations.push({
        id: m.id,
        title: sessionTitle,
        surah: m.sure_adi,
        range: `${m.baslangic_ayet}-${m.bitis_ayet}`,
        status: m.durum,
        time: timeStr
      });
    }

    // Günlük grupları liste haline dönüştür (tarihe göre sıralı DESC)
    const sortedDays = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const timeline = sortedDays.map((d) => {
      const group = dayGroups[d];
      let dayTitle = d;
      if (d === todayStr) {
        dayTitle = "Bugün";
      } else if (d === yesterdayStr) {
        dayTitle = "Dün";
      } else {
        const parsed = new Date(d);
        dayTitle = parsed.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
      }

      // Sureler ve ayet aralıkları
      const surahItems = Object.entries(group.versesBySurah).map(([sureIdStr, s]) => {
        const rangeText = formatVerseRanges(s.ayahs);
        return {
          type: "surah_reading" as const,
          sure_id: Number(sureIdStr),
          sure_adi: s.sure_adi,
          ayet_araliklari: rangeText,
          etiket: `${s.sure_adi} (${rangeText})`,
          toplam_ayet: s.ayahs.length,
          toplam_sure_sn: s.duration
        };
      });

      // Kavramlar (münferit)
      const conceptItems = group.concepts.map((c) => ({
        type: "concept" as const,
        kavram_slug: c.slug,
        kavram_adi: c.name,
        etiket: `Kavram: ${c.name}`,
        toplam_sure_sn: c.duration,
        time: c.time
      }));

      // Ezber oturumları
      const memorizationItems = group.memorizations.map((m) => ({
        type: "memorization" as const,
        oturum_id: m.id,
        oturum_adi: m.title,
        etiket: `Ezber: ${m.title}`,
        sure_adi: m.surah,
        aralik: m.range,
        durum: m.status,
        time: m.time
      }));

      return {
        date: d,
        title: dayTitle,
        total_items: surahItems.length + conceptItems.length + memorizationItems.length,
        surah_readings: surahItems,
        concepts: conceptItems,
        memorizations: memorizationItems
      };
    });

    const totalVersesInDays = timeline.reduce(
      (acc, day) => acc + day.surah_readings.reduce((sAcc, s) => sAcc + s.toplam_ayet, 0),
      0
    );

    return {
      user_id: userId,
      days: timeline,
      summary: {
        total_days: sortedDays.length,
        total_verses: totalVersesInDays,
        total_concepts: conceptRes.rows.length,
        total_memorizations: memorizationRes.rows.length
      }
    };
  }
}

export function formatVerseRanges(ayahs: number[]): string {
  if (!ayahs || ayahs.length === 0) return "";
  const sorted = Array.from(new Set(ayahs)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(", ");
}
