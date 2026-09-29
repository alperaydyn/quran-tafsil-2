/**
 * tafsil.net — ElevenLabs Test & Finetune Studio Server
 * Sıfır harici bağımlılık (Node.js Native HTTP)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  synthesizeVerseWithTimestamps,
  getVoices,
  getVoiceDetail,
  getAyahData,
  getApiKey
} from './service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3030;
const PUBLIC_DIR = path.join(__dirname, 'public');
const OUTPUT_DIR = path.join(__dirname, 'output');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { success: false, error: message });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  try {
    // API: Voices
    if (req.method === 'GET' && pathname === '/api/voices') {
      try {
        const voices = await getVoices();
        return sendJson(res, 200, { success: true, voices });
      } catch (err) {
        return sendError(res, 500, err.message);
      }
    }

    // API: Voice Detail
    if (req.method === 'GET' && pathname === '/api/voice-detail') {
      const voiceId = parsedUrl.searchParams.get('voiceId');
      if (!voiceId) return sendError(res, 400, 'voiceId parametresi zorunludur.');
      try {
        const voice = await getVoiceDetail(voiceId);
        return sendJson(res, 200, { success: true, voice });
      } catch (err) {
        return sendError(res, 404, err.message);
      }
    }

    // API: Verse text
    if (req.method === 'GET' && pathname === '/api/verse') {
      const surah = Number(parsedUrl.searchParams.get('surah') || 1);
      const ayah = Number(parsedUrl.searchParams.get('ayah') || 1);
      const data = getAyahData(surah, ayah);
      return sendJson(res, 200, { success: true, verse: data });
    }

    // API: Synthesize
    if (req.method === 'POST' && pathname === '/api/synthesize') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const {
            text,
            voiceId,
            modelId,
            voiceSettings,
            saveToFile,
            surah,
            ayah
          } = body;

          if (!text) {
            return sendError(res, 400, 'Metin (text) parametresi zorunludur.');
          }

          let audioOutputPath = null;
          let jsonOutputPath = null;

          if (saveToFile) {
            const filePrefix = (surah && ayah) ? `${surah}_${ayah}` : `custom_${Date.now()}`;
            audioOutputPath = path.join(OUTPUT_DIR, 'audio', `${filePrefix}.mp3`);
            jsonOutputPath = path.join(OUTPUT_DIR, 'timestamps', `${filePrefix}.json`);
          }

          const result = await synthesizeVerseWithTimestamps({
            text,
            voiceId,
            modelId,
            voiceSettings,
            audioOutputPath,
            jsonOutputPath
          });

          return sendJson(res, 200, result);
        } catch (err) {
          console.error('Synthesis error:', err);
          return sendError(res, 500, err.message);
        }
      });
      return;
    }

    // Static Audio serving
    if (req.method === 'GET' && pathname.startsWith('/audio/')) {
      const audioFileName = path.basename(pathname);
      const audioPath = path.join(OUTPUT_DIR, 'audio', audioFileName);
      if (fs.existsSync(audioPath)) {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        fs.createReadStream(audioPath).pipe(res);
        return;
      }
      return sendError(res, 404, 'Ses dosyası bulunamadı.');
    }

    // Static Frontend files
    let safePath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(PUBLIC_DIR, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 404
    sendError(res, 404, 'Sayfa veya kaynak bulunamadı.');
  } catch (error) {
    console.error('Server error:', error);
    sendError(res, 500, error.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`✨ tafsil.net — ElevenLabs Ayet Stüdyosu Hazır!`);
  console.log(`🌐 Arayüz: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
