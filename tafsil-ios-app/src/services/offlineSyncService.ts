import { mmkvStorage } from '../store/mmkvStorage';
import { mockSurahs } from '../api/mock/surahs.mock';

const BOOKMARKS_KEY = 'tafsil_offline_bookmarks';
const HISTORY_KEY = 'tafsil_offline_history';
const CONCEPT_HISTORY_KEY = 'tafsil_offline_concept_history';
const MEMORIZATION_HISTORY_KEY = 'tafsil_offline_memorization_history';
const LAST_SYNC_KEY = 'tafsil_last_sync_timestamp';
const DAILY_COUNTS_KEY = 'tafsil_daily_verse_counts';

export interface OfflineBookmark {
  sure_id: number;
  ayet_no: number;
  etiket?: string;
  notlar?: string;
  updated_at: string;
}

export interface OfflineHistoryItem {
  sure_id: number;
  ayet_no: number;
  okunma_suresi_sn: number;
  okundu_tarihi: string;
}

export interface OfflineConceptItem {
  kavram_slug: string;
  kavram_adi: string;
  incelenme_suresi_sn: number;
  created_at: string;
}

export interface OfflineMemorizationItem {
  id: string;
  sure_id: number;
  baslangic_ayet: number;
  bitis_ayet: number;
  durum: string;
  baslik?: string;
  created_at: string;
}

export interface TimelineSurahItem {
  type: 'surah_reading';
  sure_id: number;
  sure_adi: string;
  ayet_araliklari: string;
  etiket: string; // Örnek: "Fatiha (1-7)", "Bakara (12-25, 45-67)"
  toplam_ayet: number;
  toplam_sure_sn: number;
}

export interface TimelineConceptItem {
  type: 'concept';
  kavram_slug: string;
  kavram_adi: string;
  etiket: string; // Örnek: "Kavram: Rab"
  toplam_sure_sn: number;
  time: string;
}

export interface TimelineMemorizationItem {
  type: 'memorization';
  oturum_id: string;
  oturum_adi: string;
  etiket: string; // Örnek: "Ezber: Oturum Adı"
  sure_adi: string;
  aralik: string;
  durum: string;
  time: string;
}

export interface TimelineDayGroup {
  date: string;
  title: string;
  total_items: number;
  surah_readings: TimelineSurahItem[];
  concepts: TimelineConceptItem[];
  memorizations: TimelineMemorizationItem[];
}

export interface ReadingTimelineResult {
  days: TimelineDayGroup[];
  summary: {
    total_days: number;
    total_verses: number;
    total_concepts: number;
    total_memorizations: number;
  };
}

export function formatVerseRanges(ayahs: number[]): string {
  if (!ayahs || ayahs.length === 0) return '';
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
  return ranges.join(', ');
}

export class OfflineSyncService {
  static async getBookmarks(): Promise<OfflineBookmark[]> {
    try {
      const raw = await mmkvStorage.getItem(BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async addBookmark(sureId: number, ayetNo: number, etiket: string = 'Genel', notlar?: string): Promise<void> {
    const list = await this.getBookmarks();
    const existingIndex = list.findIndex((b) => b.sure_id === sureId && b.ayet_no === ayetNo);
    const item: OfflineBookmark = {
      sure_id: sureId,
      ayet_no: ayetNo,
      etiket,
      notlar,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
    await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  }

  static async removeBookmark(sureId: number, ayetNo: number): Promise<void> {
    let list = await this.getBookmarks();
    list = list.filter((b) => !(b.sure_id === sureId && b.ayet_no === ayetNo));
    await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  }

  static async isBookmarked(sureId: number, ayetNo: number): Promise<boolean> {
    const list = await this.getBookmarks();
    return list.some((b) => b.sure_id === sureId && b.ayet_no === ayetNo);
  }

  static async recordReading(sureId: number, ayetNo: number, durationSeconds: number = 30): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      // 1. Günlük ayet sayacı güncellemesi
      const rawDaily = await mmkvStorage.getItem(DAILY_COUNTS_KEY);
      const dailyMap: Record<string, number> = rawDaily ? JSON.parse(rawDaily) : {};
      dailyMap[today] = (dailyMap[today] ?? 0) + 1;
      await mmkvStorage.setItem(DAILY_COUNTS_KEY, JSON.stringify(dailyMap));

      // 2. Ayrıntılı geçmiş listesi
      const raw = await mmkvStorage.getItem(HISTORY_KEY);
      const list: OfflineHistoryItem[] = raw ? JSON.parse(raw) : [];
      list.push({
        sure_id: sureId,
        ayet_no: ayetNo,
        okunma_suresi_sn: durationSeconds,
        okundu_tarihi: new Date().toISOString(),
      });
      await mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-500)));
    } catch {
      // ignore
    }
  }

  static async recordConceptStudy(slug: string, name: string, durationSeconds: number = 60): Promise<void> {
    try {
      const raw = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const list: OfflineConceptItem[] = raw ? JSON.parse(raw) : [];
      list.push({
        kavram_slug: slug,
        kavram_adi: name,
        incelenme_suresi_sn: durationSeconds,
        created_at: new Date().toISOString(),
      });
      await mmkvStorage.setItem(CONCEPT_HISTORY_KEY, JSON.stringify(list.slice(-200)));
    } catch {
      // ignore
    }
  }

  static async recordMemorizationSession(item: OfflineMemorizationItem): Promise<void> {
    try {
      const raw = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const list: OfflineMemorizationItem[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((m) => m.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      await mmkvStorage.setItem(MEMORIZATION_HISTORY_KEY, JSON.stringify(list.slice(-100)));
    } catch {
      // ignore
    }
  }

  static async getDailyCounts(): Promise<Record<string, number>> {
    try {
      const rawDaily = await mmkvStorage.getItem(DAILY_COUNTS_KEY);
      const dailyMap: Record<string, number> = rawDaily ? JSON.parse(rawDaily) : {};

      // HISTORY_KEY ile birleştir
      const raw = await mmkvStorage.getItem(HISTORY_KEY);
      const list: OfflineHistoryItem[] = raw ? JSON.parse(raw) : [];
      list.forEach((item) => {
        if (item.okundu_tarihi) {
          const d = item.okundu_tarihi.slice(0, 10);
          if (!dailyMap[d]) dailyMap[d] = 0;
        }
      });
      return dailyMap;
    } catch {
      return {};
    }
  }

  static async getWateredWeeksCount(): Promise<number> {
    try {
      const dailyCounts = await this.getDailyCounts();
      const weeksSet = new Set<string>();
      Object.entries(dailyCounts).forEach(([dateStr, count]) => {
        if (count > 0) {
          const date = new Date(dateStr);
          const oneJan = new Date(date.getFullYear(), 0, 1);
          const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
          const weekNo = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
          weeksSet.add(`${date.getFullYear()}-W${weekNo}`);
        }
      });
      return weeksSet.size;
    } catch {
      return 0;
    }
  }

  static async getTodayReadCount(): Promise<number> {
    try {
      const dailyCounts = await this.getDailyCounts();
      const todayPrefix = new Date().toISOString().slice(0, 10);
      return dailyCounts[todayPrefix] ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Hem çevrimiçi backend hem de çevrimdışı yerel MMKV verilerini harmanlayarak
   * gün gün gruplanmış kusursuz okuma geçmişi döner.
   */
  static async getReadingTimeline(apiBaseUrl: string = 'http://localhost:4000/api/v1'): Promise<ReadingTimelineResult> {
    // 1. Backend'den çekmeyi dene
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${apiBaseUrl}/sync/reading-history`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.data?.days && json.data.days.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Backend kapalı veya erişilemezse yerel hesaplamaya devam
    }

    // 2. Yerel MMKV verilerini derle
    try {
      const rawHistory = await mmkvStorage.getItem(HISTORY_KEY);
      const historyList: OfflineHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];

      const rawConcepts = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const conceptList: OfflineConceptItem[] = rawConcepts ? JSON.parse(rawConcepts) : [];

      const rawMemorization = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const memorizationList: OfflineMemorizationItem[] = rawMemorization ? JSON.parse(rawMemorization) : [];

      // Eğer cihazda henüz hiç okuma yoksa zengin örnek veri hazırla
      if (historyList.length === 0 && conceptList.length === 0 && memorizationList.length === 0) {
        return this.getSampleTimeline();
      }

      // Tarih gruplaması
      const dayGroups: Record<
        string,
        {
          date: string;
          versesBySurah: Record<number, { sure_adi: string; ayahs: number[]; duration: number }>;
          concepts: Array<{ slug: string; name: string; duration: number; time: string }>;
          memorizations: Array<{ id: string; title: string; surah: string; range: string; status: string; time: string }>;
        }
      > = {};

      const getDayBucket = (dateStr: string) => {
        const d = new Date(dateStr).toISOString().slice(0, 10);
        if (!dayGroups[d]) {
          dayGroups[d] = {
            date: d,
            versesBySurah: {},
            concepts: [],
            memorizations: [],
          };
        }
        return dayGroups[d];
      };

      // Ayetleri grupla
      for (const h of historyList) {
        const bucket = getDayBucket(h.okundu_tarihi);
        if (!bucket.versesBySurah[h.sure_id]) {
          const surahObj = mockSurahs.find((s) => s.id === h.sure_id);
          bucket.versesBySurah[h.sure_id] = {
            sure_adi: surahObj?.nameTr || `${h.sure_id}. Sure`,
            ayahs: [],
            duration: 0,
          };
        }
        bucket.versesBySurah[h.sure_id].ayahs.push(h.ayet_no);
        bucket.versesBySurah[h.sure_id].duration += h.okunma_suresi_sn || 0;
      }

      // Kavramları grupla
      for (const c of conceptList) {
        const bucket = getDayBucket(c.created_at);
        const timeStr = new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        bucket.concepts.push({
          slug: c.kavram_slug,
          name: c.kavram_adi,
          duration: c.incelenme_suresi_sn,
          time: timeStr,
        });
      }

      // Ezberleri grupla
      for (const m of memorizationList) {
        const bucket = getDayBucket(m.created_at);
        const timeStr = new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const surahObj = mockSurahs.find((s) => s.id === m.sure_id);
        const surahName = surahObj?.nameTr || `${m.sure_id}. Sure`;
        const sessionTitle = m.baslik || `${surahName} (${m.baslangic_ayet}-${m.bitis_ayet}) Ezber Oturumu`;
        bucket.memorizations.push({
          id: m.id,
          title: sessionTitle,
          surah: surahName,
          range: `${m.baslangic_ayet}-${m.bitis_ayet}`,
          status: m.durum,
          time: timeStr,
        });
      }

      const sortedDays = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

      const timeline: TimelineDayGroup[] = sortedDays.map((d) => {
        const group = dayGroups[d];
        let dayTitle = d;
        if (d === todayStr) {
          dayTitle = 'Bugün';
        } else if (d === yesterdayStr) {
          dayTitle = 'Dün';
        } else {
          const parsed = new Date(d);
          dayTitle = parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
        }

        const surahItems: TimelineSurahItem[] = Object.entries(group.versesBySurah).map(([sureIdStr, s]) => {
          const rangeText = formatVerseRanges(s.ayahs);
          return {
            type: 'surah_reading',
            sure_id: Number(sureIdStr),
            sure_adi: s.sure_adi,
            ayet_araliklari: rangeText,
            etiket: `${s.sure_adi} (${rangeText})`,
            toplam_ayet: s.ayahs.length,
            toplam_sure_sn: s.duration,
          };
        });

        const conceptItems: TimelineConceptItem[] = group.concepts.map((c) => ({
          type: 'concept',
          kavram_slug: c.slug,
          kavram_adi: c.name,
          etiket: `Kavram: ${c.name}`,
          toplam_sure_sn: c.duration,
          time: c.time,
        }));

        const memorizationItems: TimelineMemorizationItem[] = group.memorizations.map((m) => ({
          type: 'memorization',
          oturum_id: m.id,
          oturum_adi: m.title,
          etiket: `Ezber: ${m.title}`,
          sure_adi: m.surah,
          aralik: m.range,
          durum: m.status,
          time: m.time,
        }));

        return {
          date: d,
          title: dayTitle,
          total_items: surahItems.length + conceptItems.length + memorizationItems.length,
          surah_readings: surahItems,
          concepts: conceptItems,
          memorizations: memorizationItems,
        };
      });

      return {
        days: timeline,
        summary: {
          total_days: sortedDays.length,
          total_verses: historyList.length,
          total_concepts: conceptList.length,
          total_memorizations: memorizationList.length,
        },
      };
    } catch {
      return this.getSampleTimeline();
    }
  }

  /**
   * Kullanıcının talebindeki tam örneği yansıtan editoryal tohum veri
   */
  static getSampleTimeline(): ReadingTimelineResult {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
    const twoDaysAgoDate = new Date(Date.now() - 2 * 86400000);
    const twoDaysAgoStr = twoDaysAgoDate.toISOString().slice(0, 10);

    return {
      days: [
        {
          date: todayStr,
          title: 'Bugün',
          total_items: 4,
          surah_readings: [
            {
              type: 'surah_reading',
              sure_id: 1,
              sure_adi: 'Fâtiha',
              ayet_araliklari: '1-7',
              etiket: 'Fâtiha (1-7)',
              toplam_ayet: 7,
              toplam_sure_sn: 180,
            },
            {
              type: 'surah_reading',
              sure_id: 2,
              sure_adi: 'Bakara',
              ayet_araliklari: '12-25, 45-67',
              etiket: 'Bakara (12-25, 45-67)',
              toplam_ayet: 37,
              toplam_sure_sn: 520,
            },
          ],
          concepts: [
            {
              type: 'concept',
              kavram_slug: 'rabb',
              kavram_adi: 'Rab',
              etiket: 'Kavram: Rab',
              toplam_sure_sn: 120,
              time: '14:20',
            },
          ],
          memorizations: [
            {
              type: 'memorization',
              oturum_id: 'm-1',
              oturum_adi: 'Fâtiha (1-7) Ezber Oturumu',
              etiket: 'Ezber: Fâtiha (1-7) Ezber Oturumu',
              sure_adi: 'Fâtiha',
              aralik: '1-7',
              durum: 'pekistirildi',
              time: '11:45',
            },
          ],
        },
        {
          date: yesterdayStr,
          title: 'Dün',
          total_items: 3,
          surah_readings: [
            {
              type: 'surah_reading',
              sure_id: 96,
              sure_adi: 'Alak',
              ayet_araliklari: '1-5',
              etiket: 'Alak (1-5)',
              toplam_ayet: 5,
              toplam_sure_sn: 120,
            },
          ],
          concepts: [
            {
              type: 'concept',
              kavram_slug: 'hamd',
              kavram_adi: 'Hamd',
              etiket: 'Kavram: Hamd',
              toplam_sure_sn: 90,
              time: '16:10',
            },
          ],
          memorizations: [
            {
              type: 'memorization',
              oturum_id: 'm-2',
              oturum_adi: 'İlk Vahiy (Alak 1-5) Ezber Oturumu',
              etiket: 'Ezber: İlk Vahiy (Alak 1-5) Ezber Oturumu',
              sure_adi: 'Alak',
              aralik: '1-5',
              durum: 'ogreniliyor',
              time: '10:30',
            },
          ],
        },
        {
          date: twoDaysAgoStr,
          title: twoDaysAgoDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
          total_items: 2,
          surah_readings: [
            {
              type: 'surah_reading',
              sure_id: 2,
              sure_adi: 'Bakara',
              ayet_araliklari: '255',
              etiket: 'Bakara (255)',
              toplam_ayet: 1,
              toplam_sure_sn: 85,
            },
          ],
          concepts: [
            {
              type: 'concept',
              kavram_slug: 'rahmet',
              kavram_adi: 'Rahmet',
              etiket: 'Kavram: Rahmet',
              toplam_sure_sn: 140,
              time: '18:50',
            },
          ],
          memorizations: [],
        },
      ],
      summary: {
        total_days: 3,
        total_verses: 50,
        total_concepts: 3,
        total_memorizations: 2,
      },
    };
  }

  static async syncWithServer(apiBaseUrl: string = 'http://localhost:4000/api/v1'): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const rawHistory = await mmkvStorage.getItem(HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];

      const rawConcepts = await mmkvStorage.getItem(CONCEPT_HISTORY_KEY);
      const concepts = rawConcepts ? JSON.parse(rawConcepts) : [];

      const rawMemorization = await mmkvStorage.getItem(MEMORIZATION_HISTORY_KEY);
      const memorization = rawMemorization ? JSON.parse(rawMemorization) : [];

      if (bookmarks.length > 0 || history.length > 0 || concepts.length > 0 || memorization.length > 0) {
        await fetch(`${apiBaseUrl}/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookmarks,
            reading_history: history,
            concept_history: concepts,
            memorization_sessions: memorization,
          }),
        });
      }

      const lastSync = await mmkvStorage.getItem(LAST_SYNC_KEY);
      const pullRes = await fetch(`${apiBaseUrl}/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_synced_at: lastSync || undefined }),
      });

      if (pullRes.ok) {
        const pulled = await pullRes.json();
        if (pulled?.data?.bookmarks) {
          const map = new Map<string, OfflineBookmark>();
          bookmarks.forEach((b) => map.set(`${b.sure_id}:${b.ayet_no}`, b));
          pulled.data.bookmarks.forEach((b: OfflineBookmark) => map.set(`${b.sure_id}:${b.ayet_no}`, b));
          await mmkvStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(map.values())));
        }
      }

      await mmkvStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      return true;
    } catch {
      return false;
    }
  }
}

