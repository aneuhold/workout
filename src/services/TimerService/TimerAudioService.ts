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

  /** "Beep beep beeeeeeep" pattern when the timer completes. */
  playCompletionTone(): void {
    this.playTone(1320, 0.12, 0);
    this.playTone(1320, 0.12, 0.2);
    this.playTone(1320, 0.45, 0.4);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  /**
   * Note from Anton: I don't understand how this works necessarily, because I don't know how sound
   * works in general, or this particular API. So I didn't write the comments / code below.
   * The robot did. The amount of code written is small, so it doesn't seem like that big of a deal
   * at the moment.
   *
   * @param frequency in Hz
   * @param duration in seconds
   * @param delay in seconds to wait before starting the tone (used for sequencing multiple tones
   * in a pattern)
   */
  private playTone(frequency: number, duration: number, delay = 0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Resume in case the browser suspended it (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0;

    // Ramp in, then fade out to avoid clicks
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + 0.01);
    gain.gain.setValueAtTime(0.3, start + duration - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}

export default new TimerAudioService();
