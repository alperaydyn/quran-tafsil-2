import { z } from "zod";

export const BookmarkSyncItemSchema = z.object({
  id: z.string().uuid().optional(),
  sure_id: z.number().int().min(1).max(114),
  ayet_no: z.number().int().min(1),
  etiket: z.string().max(64).default("Genel"),
  notlar: z.string().optional().nullable(),
  updated_at: z.string().optional()
});

export const ReadingHistorySyncItemSchema = z.object({
  sure_id: z.number().int().min(1).max(114),
  ayet_no: z.number().int().min(1),
  okunma_suresi_sn: z.number().int().min(0).default(0),
  okundu_tarihi: z.string().optional()
});

export const MemorizationSessionSyncItemSchema = z.object({
  id: z.string().uuid().optional(),
  sure_id: z.number().int().min(1).max(114),
  baslangic_ayet: z.number().int().min(1),
  bitis_ayet: z.number().int().min(1),
  durum: z.string().default("ogreniliyor"),
  repetition_number: z.number().int().default(0),
  interval_days: z.number().int().default(1),
  ease_factor: z.number().default(2.5),
  next_review_at: z.string().optional()
});

export const SyncPushSchema = z.object({
  user_id: z.string().uuid().optional(),
  client_timestamp: z.string().optional(),
  bookmarks: z.array(BookmarkSyncItemSchema).default([]),
  reading_history: z.array(ReadingHistorySyncItemSchema).default([]),
  memorization_sessions: z.array(MemorizationSessionSyncItemSchema).default([])
});

export const SyncPullSchema = z.object({
  user_id: z.string().uuid().optional(),
  last_synced_at: z.string().optional()
});

export type BookmarkSyncItem = z.infer<typeof BookmarkSyncItemSchema>;
export type ReadingHistorySyncItem = z.infer<typeof ReadingHistorySyncItemSchema>;
export type MemorizationSessionSyncItem = z.infer<typeof MemorizationSessionSyncItemSchema>;
export type SyncPushDto = z.infer<typeof SyncPushSchema>;
export type SyncPullDto = z.infer<typeof SyncPullSchema>;
