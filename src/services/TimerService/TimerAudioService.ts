/**
 * Web Audio API beep logic for the timer. Uses oscillator nodes so no audio
 * files are needed. The AudioContext is lazily created on first use.
 */
class TimerAudioService {
  private audioCtx: AudioContext | null = null;

  /** Short beep for the last 5 seconds of countdown. */
  playCountdownBeep(): void {
    this.playTone(880, 0.15);
  }

  /** Longer tone when the timer completes. */
  playCompletionTone(): void {
    this.playTone(1320, 0.4);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  private playTone(frequency: number, duration: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Resume in case the browser suspended it (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.3;

    // Quick fade-out to avoid click
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }
}

export default new TimerAudioService();
