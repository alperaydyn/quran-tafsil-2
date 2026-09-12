import sureSnapshot from "@/data/sureler.snapshot.json";
import ayetSnapshot from "@/data/ayetler.snapshot.json";
import { mockKavramlar } from "@/data/kavramlar.mock";
import type { Surah, Verse, Kavram } from "./types";

/**
 * Veri erişim katmanı. USE_MOCK=true iken data-pipeline kaynaklı statik anlık
 * görüntüler (src/data/*.snapshot.json — bkz. scripts/build-quran-snapshot.mjs)
 * kullanılır. Agent-02'nin docs/agent-signals/agent-02.status.json dosyasında
 * BE-004 (sure listesi) ve BE-006 (ayet ucu) "completed" olarak işaretlendiğinde
 * bu bayrak false yapılır ve fetchApi() gerçek Fastify ucuna yönlendirilir.
 */
const USE_MOCK = true;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.tafsil.net";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function fetchApi<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const body = (await res.json()) as ApiResponse<T>;
  return body.success ? (body.data ?? null) : null;
}

const surahs = sureSnapshot as Surah[];
type RawAyet = { s: number; a: number; ar: string; tr: string; translit: string };
const ayetler = ayetSnapshot as RawAyet[];
const surahById = new Map(surahs.map((s) => [s.id, s]));

export async function listSureler(): Promise<Surah[]> {
  if (!USE_MOCK) {
    const data = await fetchApi<Surah[]>("/v1/surahs");
    if (data) return data;
  }
  return surahs;
}

export async function getSure(sureId: number): Promise<Surah | null> {
  if (!USE_MOCK) {
    const data = await fetchApi<Surah>(`/v1/surahs/${sureId}`);
    if (data) return data;
  }
  return surahById.get(sureId) ?? null;
}

export async function getAyet(sureId: number, ayetNo: number): Promise<Verse | null> {
  if (!USE_MOCK) {
    const data = await fetchApi<Verse>(`/v1/ayet/${sureId}/${ayetNo}`);
    if (data) return data;
  }
  const raw = ayetler.find((a) => a.s === sureId && a.a === ayetNo);
  const sure = surahById.get(sureId);
  if (!raw || !sure) return null;
  return {
    sureId,
    ayetNo,
    sureNameTr: sure.nameTr,
    sureNameAr: sure.nameAr,
    metinAr: raw.ar,
    transliterasyon: raw.translit,
    mealTr: raw.tr,
  };
}

/** WEB-004: kavram/[slug] için. Gerçek uç (Agent-01/02 kavram API'si) hazır
 * olana kadar src/data/kavramlar.mock.ts kullanılır — bkz. o dosyanın başlık notu. */
export async function getKavram(slug: string): Promise<Kavram | null> {
  if (!USE_MOCK) {
    const data = await fetchApi<Kavram>(`/v1/kavramlar/${slug}`);
    if (data) return data;
  }
  return mockKavramlar.find((k) => k.slug === slug) ?? null;
}
