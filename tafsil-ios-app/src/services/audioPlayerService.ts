import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import type { Word } from '../api/types';

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
   * iOS ve Android için arka planda ve sessiz modda dahi ses çalabilmesi için AudioMode ayarlarını yapar.
   */
  async configureAudioMode() {
    if (this.isConfigured) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
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
    if (this.isUserPlaying && !this.hasFinishedVerse) {
      if (!isNativePlaying && !isBuffering && durationMs > 0 && positionMs < durationMs - 300) {
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
        playerToRelease.pause();
        playerToRelease.release();
      } catch (e) {
        console.warn('[AudioPlayerService] unloadCurrentPlayer error:', e);
      }
    }
    this.currentUrl = null;
  }

  /**
   * Belirtilen URL'den ayet sesini yükler ve çalar.
   */
  async playAyah(url: string, words: Word[] = [], shouldPlay: boolean = true) {
    await this.configureAudioMode();

    const currentLoadId = ++this.loadId;
    this.words = words;
    this.hasFinishedVerse = false;
    this.isUserPlaying = shouldPlay;

    // Eğer aynı URL zaten yüklüyse tekrar createAudioPlayer yapma
    if (this.player && this.currentUrl === url) {
      if (shouldPlay) {
        try {
          this.player.play();
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
    this.notify({
      isPlaying: shouldPlay,
      isBuffering: true,
      positionMs: 0,
      activeWordIndex: 0,
      error: null,
    });

    try {
      const player = createAudioPlayer(url, { updateInterval: 100 });
      if (this.playbackRate !== 1.0) {
        player.setPlaybackRate(this.playbackRate);
      }

      this.subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        // Player değiştiyse veya kullanıcı durdurduysa işlem yapma
        if (this.player !== player || !this.isUserPlaying) return;

        // Ağdan ses yüklendiğinde ve kullanıcı çalmak istiyorsa başlat
        if (
          status.isLoaded &&
          !status.playing &&
          !status.didJustFinish &&
          !this.hasFinishedVerse
        ) {
          try {
            player.play();
          } catch (e) {
            // Guard
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

  async stopAndUnload() {
    this.loadId++;
    this.isUserPlaying = false;
    await this.unloadCurrentPlayer();
    this.notify({ isPlaying: false, activeWordIndex: null });
  }
}

export const audioPlayerService = new AudioPlayerService();
