/**
 * tafsil.net — ElevenLabs Kur'an Ayet Seslendirme ve Kelime Zaman Damgası Servisi
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root ve lokal .env dosyasından API anahtarını yükle
export function getApiKey() {
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY.trim();
  }

  const envPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/ELEVENLABS_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  throw new Error('ELEVENLABS_API_KEY bulunamadı! Lütfen .env dosyasını kontrol edin.');
}

/**
 * Karakter seviyesindeki hizalamayı kelime seviyesinde zaman damgalarına dönüştürür.
 * @param {Array<string>} characters - Karakter dizisi
 * @param {Array<number>} startTimes - Başlangıç zamanları (saniye)
 * @param {Array<number>} endTimes - Bitiş zamanları (saniye)
 * @returns {Array<{ index: number, word: string, start: number, end: number, duration: number }>}
 */
export function buildWordsFromAlignment(characters, startTimes, endTimes) {
  if (!characters || !startTimes || !endTimes) return [];

  const words = [];
  let currentWordChars = [];
  let wordStart = null;
  let wordEnd = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const isWhitespace = /\s/.test(char);

    if (!isWhitespace) {
      if (wordStart === null) {
        wordStart = startTimes[i];
      }
      wordEnd = endTimes[i];
      currentWordChars.push(char);
    } else {
      if (currentWordChars.length > 0) {
        const wordText = currentWordChars.join('');
        words.push({
          index: words.length,
          word: wordText,
          start: Number(wordStart.toFixed(3)),
          end: Number(wordEnd.toFixed(3)),
          duration: Number((wordEnd - wordStart).toFixed(3))
        });
        currentWordChars = [];
        wordStart = null;
        wordEnd = null;
      }
    }
  }

  // Son kelime
  if (currentWordChars.length > 0) {
    const wordText = currentWordChars.join('');
    words.push({
      index: words.length,
      word: wordText,
      start: Number(wordStart.toFixed(3)),
      end: Number(wordEnd.toFixed(3)),
      duration: Number((wordEnd - wordStart).toFixed(3))
    });
  }

  return words;
}

/**
 * ElevenLabs API üzerinden ayet metnini seslendirir ve kelime zaman damgalarını döner.
 * @param {Object} options
 * @param {string} options.text - Seslendirilecek metin (Arapça ayet veya Türkçe meal)
 * @param {string} [options.voiceId] - ElevenLabs ses ID (varsayılan George veya George/Daniel)
 * @param {string} [options.modelId] - Model ID ('eleven_v4', 'eleven_v3', 'eleven_multilingual_v2', 'eleven_turbo_v2_5' vb.)
 * @param {Object} [options.voiceSettings] - Stability, similarity_boost vb.
 * @param {string} [options.audioOutputPath] - Sesin kaydedileceği opsiyonel dosya yolu (.mp3)
 * @param {string} [options.jsonOutputPath] - Timestamp verisinin kaydedileceği opsiyonel yol (.json)
 */
export async function synthesizeVerseWithTimestamps(options) {
  const {
    text,
    voiceId = 'JBFqnCBsd6RMkjVDRZzb', // George (Warm, Captivating Storyteller)
    modelId = 'eleven_multilingual_v2',
    voiceSettings = {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.0,
      use_speaker_boost: true
    },
    audioOutputPath = null,
    jsonOutputPath = null
  } = options;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Seslendirilecek metin boş olamaz.');
  }

  const apiKey = getApiKey();
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;

  const payload = {
    text: text.trim(),
    model_id: modelId,
    voice_settings: {
      stability: voiceSettings.stability ?? 0.75,
      similarity_boost: voiceSettings.similarity_boost ?? 0.85,
      style: voiceSettings.style ?? 0.0,
      use_speaker_boost: voiceSettings.use_speaker_boost ?? true
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`ElevenLabs API Hatası (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const alignment = data.alignment || { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] };

  const words = buildWordsFromAlignment(
    alignment.characters,
    alignment.character_start_times_seconds,
    alignment.character_end_times_seconds
  );

  const totalDuration = words.length > 0 ? words[words.length - 1].end : 0;

  const result = {
    success: true,
    text: text.trim(),
    voiceId,
    modelId,
    voiceSettings: payload.voice_settings,
    totalDuration,
    wordCount: words.length,
    words,
    rawAlignment: alignment,
    audioBase64: data.audio_base64
  };

  // İsteğe bağlı diske kaydetme
  if (audioOutputPath && data.audio_base64) {
    const dir = path.dirname(audioOutputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(data.audio_base64, 'base64');
    fs.writeFileSync(audioOutputPath, buffer);
    result.audioFilePath = audioOutputPath;
  }

  if (jsonOutputPath) {
    const dir = path.dirname(jsonOutputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const exportData = {
      text: result.text,
      voiceId: result.voiceId,
      modelId: result.modelId,
      voiceSettings: result.voiceSettings,
      totalDuration: result.totalDuration,
      wordCount: result.wordCount,
      words: result.words,
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(jsonOutputPath, JSON.stringify(exportData, null, 2), 'utf8');
    result.jsonFilePath = jsonOutputPath;
  }

  return result;
}

/**
 * Belirli bir Voice ID'nin detaylarını ElevenLabs API'den sorgular.
 */
export async function getVoiceDetail(voiceId) {
  const apiKey = getApiKey();
  const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
    headers: { 'xi-api-key': apiKey }
  });

  if (!response.ok) {
    let msg = '';
    try {
      const j = await response.json();
      msg = j.detail?.message || JSON.stringify(j);
    } catch {
      msg = await response.text();
    }
    throw new Error(`Ses bulunamadı (${response.status}): ${msg}`);
  }

  const v = await response.json();
  return {
    id: v.voice_id,
    name: v.name,
    category: v.category,
    previewUrl: v.preview_url,
    description: v.description,
    labels: v.labels
  };
}

/**
 * Kullanıcının ElevenLabs hesabındaki kullanılabilir sesleri listeler.
 */
export async function getVoices() {
  const apiKey = getApiKey();
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sesler listelenemedi (${response.status}): ${text}`);
  }

  const data = await response.json();
  return (data.voices || []).map(v => ({
    id: v.voice_id,
    name: v.name,
    category: v.category,
    previewUrl: v.preview_url,
    description: v.description,
    labels: v.labels
  }));
}

// Ayet verilerini bellek önbelleğinde tutalım
let uthmaniCache = null;
let mealCache = null;

function loadUthmani() {
  if (uthmaniCache) return uthmaniCache;
  const filePath = path.resolve(__dirname, '../uthmani.txt');
  if (!fs.existsSync(filePath)) return {};

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length >= 4) {
      const key = `${parts[1]}:${parts[2]}`;
      map[key] = parts[3];
    }
  }
  uthmaniCache = map;
  return map;
}

function loadMeals() {
  if (mealCache) return mealCache;
  const filePath = path.resolve(__dirname, '../kuran-meal-llm.json');
  if (!fs.existsSync(filePath)) return {};

  try {
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const map = {};
    for (const item of list) {
      const key = `${item.surah_number}:${item.ayah_number}`;
      map[key] = {
        surahName: item.surah_name,
        translation: item.ayah_translation,
        transliteration: item.sentence_blocks?.[0]?.display_text || ''
      };
    }
    mealCache = map;
    return map;
  } catch {
    return {};
  }
}

/**
 * Belirli bir sure ve ayet numarasının metinlerini döndürür.
 */
export function getAyahData(surah, ayah) {
  const uthmani = loadUthmani();
  const meals = loadMeals();
  const key = `${surah}:${ayah}`;

  const arabic = uthmani[key] || '';
  const mealInfo = meals[key] || {
    surahName: `Sure ${surah}`,
    translation: '',
    transliteration: ''
  };

  return {
    surah: Number(surah),
    ayah: Number(ayah),
    surahName: mealInfo.surahName,
    arabicText: arabic,
    turkishTranslation: mealInfo.translation,
    transliteration: mealInfo.transliteration
  };
}
