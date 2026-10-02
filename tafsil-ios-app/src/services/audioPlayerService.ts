import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
  AudioStatus,
  AudioMetadata,
  AudioLockScreenOptions,
} from 'expo-audio';
import type { Word } from '../api/types';

export type { AudioMetadata };

export interface AudioPlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  durationMs: number;
  positionMs: number;
  activeWordIndex: number | null;
  error: string | null;
}

export type PlaybackStateListener = (state: AudioPlaybackState) => void;
export type VerseFinishListener = () => void;

class AudioPlayerService {
  private player: AudioPlayer | null = null;
  private currentUrl: string | null = null;
  private currentMetadata: AudioMetadata | null = null;
  private readonly lockScreenOptions: AudioLockScreenOptions = {
    showSeekForward: true,
    showSeekBackward: true,
    isLiveStream: false,
  };
  private words: Word[] = [];
  private playbackRate: number = 1.0;
  private loadId: number = 0;
  private isConfigured: boolean = false;
  private subscription: { remove: () => void } | null = null;
  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private hasFinishedVerse: boolean = false;
  private stallCounter: number = 0;
  private lastPositionMs: number = -1;
  private isUserPlaying: boolean = false;
  private pendingSeekMs: number = 0;
  private isTransitioningSurah: boolean = false;

  private onStateChange: PlaybackStateListener | null = null;
  private onVerseFinish: VerseFinishListener | null = null;

  private state: AudioPlaybackState = {
    isPlaying: false,
    isBuffering: false,
    durationMs: 0,
    positionMs: 0,
    activeWordIndex: null,
    error: null,
  };

  /**
   * iOS ve Android için kilit ekranı kumandası (MPNowPlayingInfoCenter / MPRemoteCommandCenter)
   * ve arka planda kesintisiz ses çalabilmesi için AudioMode ayarlarını yapar.
   *
   * Not: Kilit ekranı kumandalarının işletim sistemi tarafından tanınması için
   * 'interruptionMode: doNotMix' ve 'shouldPlayInBackground: true' zorunludur.
   */
  async configureAudioMode() {
    if (this.isConfigured) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      this.isConfigured = true;
    } catch (e) {
      console.warn('[AudioPlayerService] configureAudioMode error:', e);
    }
  }

  setListeners(onStateChange?: PlaybackStateListener, onVerseFinish?: VerseFinishListener) {
    this.onStateChange = onStateChange ?? null;
    this.onVerseFinish = onVerseFinish ?? null;
  }

  private notify(partial: Partial<AudioPlaybackState>) {
    this.state = { ...this.state, ...partial };
    this.onStateChange?.(this.state);
  }

  private stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.stallCounter = 0;
    this.lastPositionMs = -1;
  }

  private startTracking() {
    this.stopTracking();
    this.hasFinishedVerse = false;
    const trackedPlayer = this.player;

    this.trackingInterval = setInterval(() => {
      if (!this.isUserPlaying || !this.player || this.player !== trackedPlayer) {
        this.stopTracking();
        return;
      }

      try {
        const curTime = this.player.currentTime || 0;
        const dur = this.player.duration || 0;
        const isBuffering = Boolean(this.player.isBuffering);
        const isPlaying = Boolean(this.player.playing);

        this.processPlaybackTick(curTime, dur, isPlaying, isBuffering);
      } catch (e) {
        // Ticker error guard
      }
    }, 80);
  }

  private processPlaybackTick(
    curTimeSec: number,
    durSec: number,
    isNativePlaying: boolean,
    isBuffering: boolean
  ) {
    if (!this.isUserPlaying) {
      this.stopTracking();
      return;
    }

    const positionMs = Math.round(curTimeSec * 1000);
    const durationMs = Math.round(durSec * 1000);

    // Watchdog / Stall Recovery:
    // Sadece gerçekten takılma (waiting/buffering) durumunda tetiklenmeli, kilit ekranından durdurulduğunda değil
    if (this.isUserPlaying && !this.hasFinishedVerse) {
      const isActuallyPaused = this.player?.paused ?? false;
      if (
        !isNativePlaying &&
        !isBuffering &&
        !isActuallyPaused &&
        durationMs > 0 &&
        positionMs < durationMs - 300
      ) {
        this.stallCounter++;
        // 3 tick (~240ms) boyunca asılı kaldıysa resume sinyali gönder
        if (this.stallCounter >= 3) {
          this.stallCounter = 0;
          try {
            this.player?.play();
          } catch (e) {
            // Guard
          }
        }
      } else {
        this.stallCounter = 0;
      }
    }

    // Kelime senkronizasyon hesabı
    let activeWordIndex: number | null = null;
    if (this.words.length > 0) {
      // 1. startMs / endMs zaman damgası varsa tam eşleşme ara
      const matchedIdx = this.words.findIndex(
        (w) => w.startMs > 0 && positionMs >= w.startMs && positionMs <= (w.endMs || w.startMs + 500)
      );

      if (matchedIdx !== -1) {
        activeWordIndex = matchedIdx;
      } else if (durationMs > 0) {
        // 2. Zaman damgası yoksa süreye orantılı dağıt (karaoke fallback)
        const progress = Math.min(0.999, Math.max(0, positionMs / durationMs));
        activeWordIndex = Math.min(
          this.words.length - 1,
          Math.floor(progress * this.words.length)
        );
      } else {
        activeWordIndex = 0;
      }
    }

    this.notify({
      isPlaying: this.isUserPlaying,
      isBuffering,
      durationMs,
      positionMs,
      activeWordIndex,
    });

    // Ayet bitiş tespiti
    if (
      !this.hasFinishedVerse &&
      durationMs > 1000 &&
      positionMs >= durationMs - 80 &&
      (!isNativePlaying || positionMs === this.lastPositionMs)
    ) {
      this.hasFinishedVerse = true;
      this.stopTracking();
      this.notify({ activeWordIndex: null });
      if (this.isUserPlaying) {
        this.onVerseFinish?.();
      }
    }

    this.lastPositionMs = positionMs;
  }

  private async unloadCurrentPlayer() {
    this.stopTracking();
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch (e) {
        // Guard
      }
      this.subscription = null;
    }
    if (this.player) {
      try {
        const playerToRelease = this.player;
        this.player = null;
        try {
          playerToRelease.clearLockScreenControls();
        } catch (e) {
          // Guard
        }
        playerToRelease.pause();
        playerToRelease.release();
      } catch (e) {
        console.warn('[AudioPlayerService] unloadCurrentPlayer error:', e);
      }
    }
    this.currentUrl = null;
  }

  /**
   * Kilit ekranında (MPNowPlayingInfoCenter) gösterilen sure/ayet ve sanatçı bilgilerini günceller.
   */
  updateMetadata(metadata: AudioMetadata) {
    this.currentMetadata = metadata;
    if (this.player) {
      try {
        this.player.updateLockScreenMetadata(metadata);
      } catch (e) {
        console.warn('[AudioPlayerService] updateLockScreenMetadata error:', e);
      }
    }
  }

  /**
   * Belirtilen URL'den ayet sesini yükler ve çalar.
   * @param initialPositionMs Oynatmaya başlanacak veya sarılacak ilk konum (ms)
   * @param metadata Kilit ekranında gösterilecek başlık, sanatçı ve albüm bilgisi (PBI-2.8)
   */
  async playAyah(
    url: string,
    words: Word[] = [],
    shouldPlay: boolean = true,
    initialPositionMs: number = 0,
    metadata?: AudioMetadata
  ) {
    this.isTransitioningSurah = false;
    await this.configureAudioMode();

    const currentLoadId = ++this.loadId;
    this.words = words;
    this.hasFinishedVerse = false;
    this.isUserPlaying = shouldPlay;

    if (metadata) {
      this.currentMetadata = metadata;
    }

    // Eğer aynı URL zaten yüklüyse tekrar createAudioPlayer yapma
    if (this.player && this.currentUrl === url) {
      if (metadata) {
        this.updateMetadata(metadata);
      }
      if (initialPositionMs > 0) {
        await this.seekToMs(initialPositionMs, shouldPlay);
      } else if (shouldPlay) {
        try {
          if (!this.player.playing) {
            this.player.play();
          }
          this.startTracking();
          this.notify({ isPlaying: true, isBuffering: false });
        } catch (e) {
          console.warn('[AudioPlayerService] resume error:', e);
        }
      } else {
        this.pause();
      }
      return;
    }

    // Önceki player nesnesini temizle (loadId'yi bozmadan)
    await this.unloadCurrentPlayer();

    // Bu süreçte başka bir oynatma isteği geldiyse veya kullanıcı pause'a bastıysa dur
    if (currentLoadId !== this.loadId || !this.isUserPlaying) return;

    this.currentUrl = url;
    this.pendingSeekMs = initialPositionMs;

    let initialWordIdx = 0;
    if (initialPositionMs > 0 && words.length > 0) {
      const matchedIdx = words.findIndex(
        (w) =>
          w.startMs > 0 &&
          initialPositionMs >= w.startMs &&
          initialPositionMs <= (w.endMs || w.startMs + 500)
      );
      if (matchedIdx !== -1) initialWordIdx = matchedIdx;
    }

    this.notify({
      isPlaying: shouldPlay,
      isBuffering: true,
      positionMs: initialPositionMs,
      activeWordIndex: initialWordIdx,
      error: null,
    });

    try {
      const player = createAudioPlayer(url, {
        updateInterval: 100,
        keepAudioSessionActive: true,
      });
      if (this.playbackRate !== 1.0) {
        player.setPlaybackRate(this.playbackRate);
      }

      // PBI-2.8: Kilit ekranı (MPNowPlayingInfoCenter / MPRemoteCommandCenter) aktivasyonu
      try {
        player.setActiveForLockScreen(
          true,
          this.currentMetadata ?? undefined,
          this.lockScreenOptions
        );
      } catch (lockErr) {
        console.warn('[AudioPlayerService] setActiveForLockScreen warning:', lockErr);
      }

      let hasSeekedInitial = false;

      this.subscription = player.addListener('playbackStatusUpdate', async (status: AudioStatus) => {
        // Player değiştiyse işlem yapma
        if (this.player !== player) return;

        // Kilit ekranı / harici kulaklık kumandası senkronizasyonu
        if (status.isLoaded) {
          if (this.currentMetadata) {
            try {
              player.updateLockScreenMetadata(this.currentMetadata);
            } catch (e) {
              // Guard
            }
          }
          if (status.playing && !this.isUserPlaying) {
            this.isUserPlaying = true;
            this.startTracking();
            this.notify({ isPlaying: true });
          } else if (!status.playing && this.isUserPlaying && status.timeControlStatus === 'paused') {
            this.isUserPlaying = false;
            this.notify({ isPlaying: false, activeWordIndex: null });
          }
        }

        // Ağdan ses yüklendiğinde ve kullanıcı çalmak istiyorsa başlat
        if (status.isLoaded && this.isUserPlaying) {
          if (!hasSeekedInitial && this.pendingSeekMs > 0) {
            hasSeekedInitial = true;
            const seekSec = this.pendingSeekMs / 1000;
            this.pendingSeekMs = 0;
            try {
              await player.seekTo(seekSec);
            } catch (e) {
              console.warn('[AudioPlayerService] initial seek error:', e);
            }
          }

          if (
            !status.playing &&
            !status.didJustFinish &&
            !this.hasFinishedVerse &&
            status.timeControlStatus !== 'paused'
          ) {
            try {
              player.play();
            } catch (e) {
              // Guard
            }
          }
        }

        if (status.didJustFinish && !this.hasFinishedVerse) {
          this.hasFinishedVerse = true;
          this.stopTracking();
          this.notify({ activeWordIndex: null });
          if (this.isUserPlaying) {
            this.onVerseFinish?.();
          }
        }
      });

      this.player = player;

      if (this.isUserPlaying) {
        player.play();
        this.startTracking();
      }
    } catch (err: any) {
      console.warn('[AudioPlayerService] Play error:', err);
      if (currentLoadId === this.loadId) {
        this.stopTracking();
        this.isUserPlaying = false;
        this.notify({
          isPlaying: false,
          isBuffering: false,
          error: err?.message || 'Ses çalınamadı',
        });
      }
    }
  }

  /**
   * Oynatıcıyı doğrudan belirtilen milisaniyeye (ms) sarar (PBI-2.7: Seek).
   * @param positionMs Sarılacak hedef zaman (ms)
   * @param resumeIfPaused Eğer duraklatılmışsa oynatmaya devam etsin mi?
   */
  async seekToMs(positionMs: number, resumeIfPaused: boolean = false): Promise<void> {
    const validPos = Math.max(0, positionMs);
    const seekSec = validPos / 1000;

    let targetWordIndex: number | null = null;
    if (this.words.length > 0) {
      const matchedIdx = this.words.findIndex(
        (w) =>
          w.startMs > 0 &&
          validPos >= w.startMs &&
          validPos <= (w.endMs || w.startMs + 500)
      );
      if (matchedIdx !== -1) {
        targetWordIndex = matchedIdx;
      } else {
        // En yakın kelime indeksini tespit et
        let closestIdx = 0;
        let minDiff = Infinity;
        this.words.forEach((w, idx) => {
          const diff = Math.abs((w.startMs || 0) - validPos);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        targetWordIndex = closestIdx;
      }
    }

    this.lastPositionMs = validPos;
    this.stallCounter = 0;

    if (this.player) {
      try {
        await this.player.seekTo(seekSec);
      } catch (e) {
        console.warn('[AudioPlayerService] seekToMs error:', e);
      }

      if (resumeIfPaused && !this.isUserPlaying) {
        this.isUserPlaying = true;
        try {
          this.player.play();
        } catch (e) {
          console.warn('[AudioPlayerService] play after seek error:', e);
        }
        this.startTracking();
        this.notify({
          isPlaying: true,
          positionMs: validPos,
          activeWordIndex: targetWordIndex,
          isBuffering: false,
        });
        return;
      }
    }

    this.notify({
      positionMs: validPos,
      activeWordIndex: targetWordIndex,
    });
  }

  /**
   * Belirtilen kelimenin başlangıç zaman damgasına (startMs) doğrudan sarar (Seek-on-Word-Click).
   */
  async seekToWord(word: Word, resumeIfPaused: boolean = false): Promise<void> {
    const startMs = word.startMs ?? 0;
    await this.seekToMs(startMs, resumeIfPaused);
  }

  getDurationMs(): number {
    return this.state.durationMs;
  }

  getPositionMs(): number {
    return this.state.positionMs;
  }

  getIsPlaying(): boolean {
    return this.isUserPlaying;
  }

  hasLoadedAudio(): boolean {
    return this.player !== null;
  }

  pause() {
    this.loadId++; // Asenkron bekleyen playAyah isteklerini geçersiz kıl
    this.isUserPlaying = false;
    this.stopTracking();
    if (this.player) {
      try {
        this.player.pause();
      } catch (e) {
        console.warn('[AudioPlayerService] pause error:', e);
      }
    }
    this.notify({ isPlaying: false, activeWordIndex: null });
  }

  resume() {
    if (this.player) {
      try {
        this.isUserPlaying = true;
        this.player.play();
        this.startTracking();
        this.notify({ isPlaying: true });
      } catch (e) {
        console.warn('[AudioPlayerService] resume error:', e);
      }
    }
  }

  setRate(rate: number) {
    this.playbackRate = rate;
    if (this.player) {
      try {
        this.player.setPlaybackRate(rate);
      } catch (e) {
        console.warn('[AudioPlayerService] setRate error:', e);
      }
    }
  }

  setTransitioningSurah(val: boolean) {
    this.isTransitioningSurah = val;
  }

  async stopAndUnload() {
    if (this.isTransitioningSurah) {
      // Sureler arası kesintisiz geçiş sırasında arka plan temizliğinde oynatıcıyı kapatma
      return;
    }
    this.loadId++;
    this.isUserPlaying = false;
    await this.unloadCurrentPlayer();
    this.notify({ isPlaying: false, activeWordIndex: null, positionMs: 0 });
  }
}

export const audioPlayerService = new AudioPlayerService();
