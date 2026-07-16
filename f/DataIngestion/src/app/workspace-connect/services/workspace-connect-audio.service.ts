import { Injectable } from '@angular/core';

type WorkspaceConnectSound = 'step' | 'complete' | 'test-start' | 'success' | 'error';

const STORAGE_KEY = 'wc-guided-audio-enabled';

@Injectable({ providedIn: 'root' })
export class WorkspaceConnectAudioService {
  readonly reducedMotionPreferred =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private enabledValue = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.enabledValue = this.loadPreference();
    this.refreshVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.refreshVoice();
    }
  }

  get enabled(): boolean {
    return this.enabledValue;
  }

  setEnabled(enabled: boolean): void {
    this.enabledValue = enabled;
    if (!enabled) this.stop();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabledValue);
    return this.enabledValue;
  }

  prime(): void {
    this.refreshVoice();
  }

  play(_sound: WorkspaceConnectSound): void {
    // Guided Registration uses spoken guidance instead of click sound effects.
  }

  speak(text: string): void {
    if (!this.enabledValue || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = this.selectedVoice;
    utterance.volume = 0.82;
    utterance.rate = 0.9;
    utterance.pitch = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private loadPreference(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return !this.reducedMotionPreferred;
  }

  private refreshVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    this.selectedVoice =
      voices.find((voice) => /natural|jenny|aria|sonia|zira|google us english/i.test(voice.name)) ??
      voices.find((voice) => /^en[-_]/i.test(voice.lang)) ??
      voices[0] ??
      null;
  }
}
