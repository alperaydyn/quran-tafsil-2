import { mmkvStorage } from '../store/mmkvStorage';

const BOOKMARKS_KEY = 'tafsil_offline_bookmarks';
const HISTORY_KEY = 'tafsil_offline_history';
const LAST_SYNC_KEY = 'tafsil_last_sync_timestamp';

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
      const raw = await mmkvStorage.getItem(HISTORY_KEY);
      const list: OfflineHistoryItem[] = raw ? JSON.parse(raw) : [];
      list.push({
        sure_id: sureId,
        ayet_no: ayetNo,
        okunma_suresi_sn: durationSeconds,
        okundu_tarihi: new Date().toISOString(),
      });
      await mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-50)));
    } catch {
      // ignore
    }
  }

  static async syncWithServer(apiBaseUrl: string = 'http://localhost:4000/api/v1'): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const rawHistory = await mmkvStorage.getItem(HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];

      if (bookmarks.length > 0 || history.length > 0) {
        await fetch(`${apiBaseUrl}/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookmarks, reading_history: history }),
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
