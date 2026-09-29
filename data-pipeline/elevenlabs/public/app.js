// tafsil.net — ElevenLabs Ayet Stüdyosu İstemci Scripti

// Sure isimleri (1-114)
const SURAH_NAMES = [
  "1. Fatiha", "2. Bakara", "3. Âl-i İmrân", "4. Nisâ", "5. Mâide", "6. En'âm",
  "7. A'râf", "8. Enfâl", "9. Tevbe", "10. Yûnus", "11. Hûd", "12. Yûsuf",
  "13. Ra'd", "14. İbrâhîm", "15. Hicr", "16. Nahl", "17. İsrâ", "18. Kehf",
  "19. Meryem", "20. Tâhâ", "21. Enbiyâ", "22. Hac", "23. Mü'minûn", "24. Nûr",
  "25. Furkân", "26. Şuarâ", "27. Neml", "28. Kasas", "29. Ankebût", "30. Rûm",
  "31. Lokmân", "32. Secde", "33. Ahzâb", "34. Sebe'", "35. Fâtır", "36. Yâsîn",
  "37. Sâffât", "38. Sâd", "39. Zümer", "40. Mü'min (Gâfir)", "41. Fussilet", "42. Şûrâ",
  "43. Zuhruf", "44. Dühân", "45. Câsiye", "46. Ahkâf", "47. Muhammed", "48. Fetih",
  "49. Hucurât", "50. Kâf", "51. Zâriyât", "52. Tûr", "53. Necm", "54. Kamer",
  "55. Rahmân", "56. Vâkı'a", "57. Hadîd", "58. Mücâdele", "59. Haşr", "60. Mümtehine",
  "61. Saff", "62. Cuma", "63. Münâfikûn", "64. Tegâbün", "65. Talâk", "66. Tahrîm",
  "67. Mülk", "68. Kalem", "69. Hâkka", "70. Meâric", "71. Nûh", "72. Cin",
  "73. Müzzemmil", "74. Müddessir", "75. Kıyâmet", "76. İnsân", "77. Mürselât", "78. Nebe'",
  "79. Nâzi'ât", "80. Abese", "81. Tekvîr", "82. İnfitâr", "83. Mutaffifîn", "84. İnşikâk",
  "85. Bürûc", "86. Târık", "87. A'lâ", "88. Gâşiye", "89. Fecr", "90. Beled",
  "91. Şems", "92. Leyl", "93. Duhâ", "94. İnşirâh", "95. Tîn", "96. Alak",
  "97. Kadir", "98. Beyyine", "99. Zilzâl", "100. Âdiyât", "101. Kâria", "102. Tekâsür",
  "103. Asr", "104. Hümeze", "105. Fîl", "106. Kureyş", "107. Mâûn", "108. Kevser",
  "109. Kâfirûn", "110. Nasr", "111. Tebbet", "112. İhlâs", "113. Felak", "114. Nâs"
];

// Uygulama Durumu
const state = {
  currentSurah: 1,
  currentAyah: 1,
  mode: 'arabic', // 'arabic' | 'turkish'
  verseData: null,
  voices: [],
  currentResult: null,
  activeWordIndex: -1
};

// DOM Elemanları
const el = {
  surahSelect: document.getElementById('surahSelect'),
  ayahInput: document.getElementById('ayahInput'),
  btnLoadVerse: document.getElementById('btnLoadVerse'),
  btnModeArabic: document.getElementById('btnModeArabic'),
  btnModeTurkish: document.getElementById('btnModeTurkish'),
  verseTextInput: document.getElementById('verseTextInput'),
  charCount: document.getElementById('charCount'),
  
  voiceSelect: document.getElementById('voiceSelect'),
  voiceIdInput: document.getElementById('voiceIdInput'),
  btnVerifyVoice: document.getElementById('btnVerifyVoice'),
  btnPlayVoicePreview: document.getElementById('btnPlayVoicePreview'),
  verifiedVoiceBadge: document.getElementById('verifiedVoiceBadge'),
  verifiedVoiceName: document.getElementById('verifiedVoiceName'),
  verifiedVoiceCategory: document.getElementById('verifiedVoiceCategory'),
  btnPresetQuran: document.getElementById('btnPresetQuran'),
  btnPresetMeal: document.getElementById('btnPresetMeal'),
  modelSelect: document.getElementById('modelSelect'),
  sliderStability: document.getElementById('sliderStability'),
  valStability: document.getElementById('valStability'),
  sliderSimilarity: document.getElementById('sliderSimilarity'),
  valSimilarity: document.getElementById('valSimilarity'),
  sliderStyle: document.getElementById('sliderStyle'),
  valStyle: document.getElementById('valStyle'),
  chkSpeakerBoost: document.getElementById('chkSpeakerBoost'),
  chkSaveToFile: document.getElementById('chkSaveToFile'),
  btnSynthesize: document.getElementById('btnSynthesize'),

  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  resultContainer: document.getElementById('resultContainer'),
  timingBadge: document.getElementById('timingBadge'),

  audioElement: document.getElementById('audioElement'),
  btnPlayPause: document.getElementById('btnPlayPause'),
  audioTimeline: document.getElementById('audioTimeline'),
  currentTimeLabel: document.getElementById('currentTimeLabel'),
  totalDurationLabel: document.getElementById('totalDurationLabel'),
  playbackSpeed: document.getElementById('playbackSpeed'),

  karaokeBox: document.getElementById('karaokeBox'),
  timestampsTableBody: document.getElementById('timestampsTableBody'),
  jsonViewer: document.getElementById('jsonViewer'),
  btnCopyJson: document.getElementById('btnCopyJson'),
  btnDownloadJson: document.getElementById('btnDownloadJson'),
  btnDownloadMp3: document.getElementById('btnDownloadMp3'),
  batchCommandCode: document.getElementById('batchCommandCode'),
  btnCopyBatch: document.getElementById('btnCopyBatch')
};

// Başlangıç Kurulumu
document.addEventListener('DOMContentLoaded', async () => {
  initSurahDropdown();
  setupEventListeners();
  setupSliders();
  await loadVoices();
  await loadVerse(1, 1);
});

function initSurahDropdown() {
  el.surahSelect.innerHTML = SURAH_NAMES.map((name, i) => 
    `<option value="${i + 1}">${name}</option>`
  ).join('');
}

function setupSliders() {
  el.sliderStability.addEventListener('input', e => {
    el.valStability.textContent = Number(e.target.value).toFixed(2);
    updateBatchCommand();
  });
  el.sliderSimilarity.addEventListener('input', e => {
    el.valSimilarity.textContent = Number(e.target.value).toFixed(2);
    updateBatchCommand();
  });
  el.sliderStyle.addEventListener('input', e => {
    el.valStyle.textContent = Number(e.target.value).toFixed(2);
    updateBatchCommand();
  });
  el.voiceSelect.addEventListener('change', updateBatchCommand);
  el.modelSelect.addEventListener('change', updateBatchCommand);
}

function setupEventListeners() {
  // Hızlı Seçim Chip'leri
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const s = Number(chip.dataset.surah);
      const a = Number(chip.dataset.ayah);
      el.surahSelect.value = s;
      el.ayahInput.value = a;
      loadVerse(s, a);
    });
  });

  // Ayet Yükle Butonu
  el.btnLoadVerse.addEventListener('click', () => {
    loadVerse(Number(el.surahSelect.value), Number(el.ayahInput.value));
  });

  // Mod Değişimi: Arapça / Türkçe
  el.btnModeArabic.addEventListener('click', () => {
    state.mode = 'arabic';
    el.btnModeArabic.classList.add('active');
    el.btnModeTurkish.classList.remove('active');
    el.verseTextInput.classList.add('arabic-font');
    el.karaokeBox.classList.add('arabic-mode');
    if (state.verseData) {
      el.verseTextInput.value = state.verseData.arabicText;
      updateCharCount();
    }
  });

  el.btnModeTurkish.addEventListener('click', () => {
    state.mode = 'turkish';
    el.btnModeTurkish.classList.add('active');
    el.btnModeArabic.classList.remove('active');
    el.verseTextInput.classList.remove('arabic-font');
    el.karaokeBox.classList.remove('arabic-mode');
    if (state.verseData) {
      el.verseTextInput.value = state.verseData.turkishTranslation;
      updateCharCount();
    }
  });

  el.verseTextInput.addEventListener('input', updateCharCount);

  // Voice ID Input Dinleyicisi
  el.voiceIdInput.addEventListener('input', () => {
    updateBatchCommand();
  });

  // Voice ID Doğrulama Butonu
  el.btnVerifyVoice.addEventListener('click', async () => {
    const id = el.voiceIdInput.value.trim();
    if (!id) {
      alert('Lütfen doğrulamak için bir Voice ID girin.');
      return;
    }
    await verifyAndShowVoice(id);
  });

  // Voice ID Önizleme Dinleme
  el.btnPlayVoicePreview.addEventListener('click', async () => {
    const id = el.voiceIdInput.value.trim();
    if (!id) return;
    playVoicePreview(id);
  });

  // Dropdown'dan Ses Seçilince Voice ID'ye Doldur
  el.voiceSelect.addEventListener('change', async e => {
    const id = e.target.value;
    if (id) {
      el.voiceIdInput.value = id;
      await verifyAndShowVoice(id);
      updateBatchCommand();
    }
  });

  // Hızlı Voice ID Chip'leri
  document.querySelectorAll('.chip-voice').forEach(chip => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.chip-voice').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const id = chip.dataset.id;
      el.voiceIdInput.value = id;
      await verifyAndShowVoice(id);
      updateBatchCommand();
    });
  });

  // Seslendir Butonu
  el.btnSynthesize.addEventListener('click', handleSynthesize);

  // Ses Oynatıcı Kontrolleri
  el.btnPlayPause.addEventListener('click', toggleAudio);
  el.audioTimeline.addEventListener('input', onTimelineSeek);
  el.playbackSpeed.addEventListener('change', e => {
    el.audioElement.playbackRate = parseFloat(e.target.value);
  });

  el.audioElement.addEventListener('timeupdate', onAudioTimeUpdate);
  el.audioElement.addEventListener('ended', onAudioEnded);
  el.audioElement.addEventListener('play', () => {
    el.btnPlayPause.querySelector('.play-icon').textContent = '⏸';
  });
  el.audioElement.addEventListener('pause', () => {
    el.btnPlayPause.querySelector('.play-icon').textContent = '▶';
  });

  // Sekmeler
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.classList.add('active');
    });
  });

  // JSON İşlemleri
  el.btnCopyJson.addEventListener('click', () => {
    if (!state.currentResult) return;
    navigator.clipboard.writeText(JSON.stringify(state.currentResult, null, 2));
    alert('JSON panoya kopyalandı!');
  });

  el.btnDownloadJson.addEventListener('click', () => {
    if (!state.currentResult) return;
    const blob = new Blob([JSON.stringify(state.currentResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timestamps_${state.currentSurah}_${state.currentAyah}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  el.btnDownloadMp3.addEventListener('click', () => {
    if (!state.currentResult || !state.currentResult.audioBase64) return;
    const a = document.createElement('a');
    a.href = `data:audio/mp3;base64,${state.currentResult.audioBase64}`;
    a.download = `verse_${state.currentSurah}_${state.currentAyah}.mp3`;
    a.click();
  });

  // Preset: Kur'ani Tertiyl / Tecvid
  el.btnPresetQuran.addEventListener('click', () => {
    el.btnPresetQuran.classList.add('active');
    el.btnPresetMeal.classList.remove('active');
    el.sliderStability.value = 0.95;
    el.valStability.textContent = '0.95';
    el.sliderSimilarity.value = 0.90;
    el.valSimilarity.textContent = '0.90';
    el.sliderStyle.value = 0.00;
    el.valStyle.textContent = '0.00';
    el.chkSpeakerBoost.checked = true;
    el.btnModeArabic.click();
    updateBatchCommand();
  });

  // Preset: Türkçe Meal
  el.btnPresetMeal.addEventListener('click', () => {
    el.btnPresetMeal.classList.add('active');
    el.btnPresetQuran.classList.remove('active');
    el.sliderStability.value = 0.75;
    el.valStability.textContent = '0.75';
    el.sliderSimilarity.value = 0.85;
    el.valSimilarity.textContent = '0.85';
    el.sliderStyle.value = 0.05;
    el.valStyle.textContent = '0.05';
    el.btnModeTurkish.click();
    updateBatchCommand();
  });

  el.btnCopyBatch.addEventListener('click', () => {
    navigator.clipboard.writeText(el.batchCommandCode.textContent);
    alert('Komut panoya kopyalandı!');
  });
}

function updateCharCount() {
  const len = el.verseTextInput.value.length;
  el.charCount.textContent = `${len} karakter`;
}

// Ses Doğrulama ve Bilgilerini Gösterme
let currentVoicePreviewUrl = null;

async function verifyAndShowVoice(voiceId) {
  if (!voiceId) return;
  try {
    el.btnVerifyVoice.textContent = '⏳ ...';
    const res = await fetch(`/api/voice-detail?voiceId=${encodeURIComponent(voiceId)}`);
    const data = await res.json();

    if (data.success && data.voice) {
      const v = data.voice;
      currentVoicePreviewUrl = v.previewUrl;
      el.verifiedVoiceName.textContent = v.name;
      el.verifiedVoiceCategory.textContent = v.category || 'özel ses';
      el.verifiedVoiceBadge.classList.remove('hidden');
      el.voiceSelect.value = v.id;
    } else {
      el.verifiedVoiceName.textContent = 'Ses bulundu (önizleme bilgisi yok)';
      el.verifiedVoiceCategory.textContent = 'özel';
      el.verifiedVoiceBadge.classList.remove('hidden');
    }
  } catch (err) {
    console.warn('Voice doğrulanamadı:', err);
    el.verifiedVoiceBadge.classList.add('hidden');
  } finally {
    el.btnVerifyVoice.textContent = '🔍 Kontrol Et';
  }
}

function playVoicePreview(voiceId) {
  // Önce hazır önizleme URL'ine bak
  const cached = state.voices.find(v => v.id === voiceId);
  const url = cached?.previewUrl || currentVoicePreviewUrl;

  if (url) {
    const audio = new Audio(url);
    audio.play();
  } else {
    alert(`Bu ses (${voiceId}) için önizleme sesi bulunamadı. "Seslendir" butonuyla doğrudan deneyebilirsiniz.`);
  }
}

// Sesleri Yükle
async function loadVoices() {
  try {
    const res = await fetch('/api/voices');
    const data = await res.json();
    if (data.success && data.voices) {
      state.voices = data.voices;
      el.voiceSelect.innerHTML = '<option value="">-- Listeden bir ses seçin --</option>' + 
        data.voices.map(v => {
          const cat = v.category ? ` [${v.category}]` : '';
          return `<option value="${v.id}">${v.name}${cat}</option>`;
        }).join('');

      // Başlangıç için George veya ilk sesi seç ve Voice ID kutusuna doldur
      const preferred = data.voices.find(v => v.name.toLowerCase().includes('george')) || data.voices[0];
      if (preferred) {
        el.voiceIdInput.value = preferred.id;
        el.voiceSelect.value = preferred.id;
        currentVoicePreviewUrl = preferred.previewUrl;
        el.verifiedVoiceName.textContent = preferred.name;
        el.verifiedVoiceCategory.textContent = preferred.category || 'premade';
        el.verifiedVoiceBadge.classList.remove('hidden');
      }
      updateBatchCommand();
    }
  } catch (err) {
    console.error('Sesler yüklenirken hata:', err);
    el.voiceSelect.innerHTML = '<option value="">Sesler yüklenemedi</option>';
  }
}

// Ayet Metnini Yükle
async function loadVerse(surah, ayah) {
  try {
    state.currentSurah = surah;
    state.currentAyah = ayah;
    const res = await fetch(`/api/verse?surah=${surah}&ayah=${ayah}`);
    const data = await res.json();

    if (data.success && data.verse) {
      state.verseData = data.verse;
      if (state.mode === 'arabic') {
        el.verseTextInput.value = data.verse.arabicText;
      } else {
        el.verseTextInput.value = data.verse.turkishTranslation;
      }
      updateCharCount();
    }
  } catch (err) {
    console.error('Ayet yüklenirken hata:', err);
  }
}

// Seslendir ve Kelime Zaman Damgalarını Çıkar
async function handleSynthesize() {
  const text = el.verseTextInput.value.trim();
  if (!text) {
    alert('Lütfen seslendirilecek bir metin girin.');
    return;
  }

  const voiceId = el.voiceIdInput.value.trim() || el.voiceSelect.value || 'JBFqnCBsd6RMkjVDRZzb';
  const modelId = el.modelSelect.value;
  const voiceSettings = {
    stability: parseFloat(el.sliderStability.value),
    similarity_boost: parseFloat(el.sliderSimilarity.value),
    style: parseFloat(el.sliderStyle.value),
    use_speaker_boost: el.chkSpeakerBoost.checked
  };
  const saveToFile = el.chkSaveToFile.checked;

  // UI Durumu
  el.btnSynthesize.disabled = true;
  el.emptyState.classList.add('hidden');
  el.resultContainer.classList.add('hidden');
  el.loadingState.classList.remove('hidden');

  try {
    const response = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId,
        modelId,
        voiceSettings,
        saveToFile,
        surah: state.currentSurah,
        ayah: state.currentAyah
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Seslendirme başarısız oldu.');
    }

    state.currentResult = result;
    displayResult(result);
  } catch (err) {
    alert(`Hata: ${err.message}`);
    el.emptyState.classList.remove('hidden');
  } finally {
    el.btnSynthesize.disabled = false;
    el.loadingState.classList.add('hidden');
  }
}

// Sonuçları Ekrana Bas
function displayResult(result) {
  el.resultContainer.classList.remove('hidden');

  // Süre rozeti
  el.timingBadge.textContent = `Süre: ${result.totalDuration.toFixed(2)}s | ${result.wordCount} Kelime`;
  el.totalDurationLabel.textContent = formatTime(result.totalDuration);

  // Audio elementine sesi bağla
  const audioSrc = `data:audio/mp3;base64,${result.audioBase64}`;
  el.audioElement.src = audioSrc;
  el.audioTimeline.value = 0;
  el.audioTimeline.max = result.totalDuration;
  state.activeWordIndex = -1;

  // 1. Karaoke Kelimeleri Üret
  renderKaraokeStage(result.words);

  // 2. Tabloyu Doldur
  renderTimestampsTable(result.words);

  // 3. JSON Görüntüleyici
  const jsonDisplay = {
    surah: state.currentSurah,
    ayah: state.currentAyah,
    text: result.text,
    voiceId: result.voiceId,
    modelId: result.modelId,
    voiceSettings: result.voiceSettings,
    totalDuration: result.totalDuration,
    wordCount: result.wordCount,
    words: result.words
  };
  el.jsonViewer.textContent = JSON.stringify(jsonDisplay, null, 2);

  // 4. Batch komutunu güncelle
  updateBatchCommand();
}

function renderKaraokeStage(words) {
  el.karaokeBox.innerHTML = '';
  words.forEach((item, index) => {
    const wordEl = document.createElement('div');
    wordEl.className = 'karaoke-word';
    wordEl.id = `word-${index}`;
    wordEl.dataset.index = index;
    wordEl.dataset.start = item.start;
    wordEl.dataset.end = item.end;

    wordEl.innerHTML = `
      <span class="word-text">${escapeHtml(item.word)}</span>
      <span class="word-time">${item.start.toFixed(2)}s</span>
    `;

    // Kelimeye tıklayınca o saniyeye git
    wordEl.addEventListener('click', () => {
      jumpToTime(item.start);
    });

    el.karaokeBox.appendChild(wordEl);
  });
}

function renderTimestampsTable(words) {
  el.timestampsTableBody.innerHTML = words.map(item => `
    <tr id="row-${item.index}">
      <td>${item.index + 1}</td>
      <td style="font-weight:600; font-size: 1.1rem;">${escapeHtml(item.word)}</td>
      <td>${item.start.toFixed(3)}s</td>
      <td>${item.end.toFixed(3)}s</td>
      <td>${item.duration.toFixed(3)}s</td>
      <td>
        <button type="button" class="btn btn-sm btn-secondary" onclick="jumpToTime(${item.start})">▶ Dinle</button>
      </td>
    </tr>
  `).join('');
}

// Ses Oynatma ve Karaoke Senkronizasyonu
function toggleAudio() {
  if (el.audioElement.paused) {
    el.audioElement.play();
  } else {
    el.audioElement.pause();
  }
}

window.jumpToTime = function(seconds) {
  el.audioElement.currentTime = seconds;
  el.audioElement.play();
};

function onTimelineSeek(e) {
  el.audioElement.currentTime = parseFloat(e.target.value);
}

function onAudioTimeUpdate() {
  const current = el.audioElement.currentTime;
  el.audioTimeline.value = current;
  el.currentTimeLabel.textContent = formatTime(current);

  if (!state.currentResult || !state.currentResult.words) return;

  // O anki kelimeyi bul
  const words = state.currentResult.words;
  let activeIndex = -1;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // Küçük bir tolerans penceresi (kelimeler arası boşlukta son kelimeyi koru)
    if (current >= w.start && current <= w.end + 0.05) {
      activeIndex = i;
      break;
    }
  }

  if (activeIndex !== state.activeWordIndex) {
    state.activeWordIndex = activeIndex;

    // Tüm kelimelerden active sınıfını temizle
    document.querySelectorAll('.karaoke-word').forEach(kw => kw.classList.remove('active'));
    document.querySelectorAll('.timestamps-table tr').forEach(tr => tr.classList.remove('active-row'));

    // Aktif kelimeyi parlat
    if (activeIndex !== -1) {
      const activeEl = document.getElementById(`word-${activeIndex}`);
      if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      const activeRow = document.getElementById(`row-${activeIndex}`);
      if (activeRow) {
        activeRow.classList.add('active-row');
      }
    }
  }
}

function onAudioEnded() {
  document.querySelectorAll('.karaoke-word').forEach(kw => kw.classList.remove('active'));
  document.querySelectorAll('.timestamps-table tr').forEach(tr => tr.classList.remove('active-row'));
  state.activeWordIndex = -1;
  el.audioTimeline.value = 0;
  el.currentTimeLabel.textContent = '0:00.0';
}

function updateBatchCommand() {
  const voice = el.voiceIdInput?.value.trim() || el.voiceSelect?.value || 'JBFqnCBsd6RMkjVDRZzb';
  const model = el.modelSelect.value;
  const stab = el.sliderStability.value;
  const sim = el.sliderSimilarity.value;
  const style = el.sliderStyle.value;

  const cmd = `node data-pipeline/elevenlabs/batch.js --voice "${voice}" --model "${model}" --stability ${stab} --similarity ${sim} --style ${style} --surah 1`;
  el.batchCommandCode.textContent = cmd;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00.0';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
