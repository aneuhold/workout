import timerSoundSynthService from './TimerSoundSynth.service';

/**
 * In-browser audio cues for the timer. Builds AudioBuffers from the shared
 * synth module on first use and plays them via AudioBufferSourceNode. The
 * AudioContext is lazily created so it survives the browser's autoplay policy
 * until the first user gesture.
 */
class TimerWebAudioService {
  #audioCtx: AudioContext | null = null;
  #countdownBeepBuffer: AudioBuffer | null = null;
  #completionToneBuffer: AudioBuffer | null = null;

  /** Short beep for the last 5 seconds of countdown. */
  playCountdownBeep(): void {
    const ctx = this.#getAudioContext();
    if (!ctx) return;
    if (!this.#countdownBeepBuffer) {
      this.#countdownBeepBuffer = this.#createBuffer(
        ctx,
        timerSoundSynthService.synthesizeBeep(ctx.sampleRate)
      );
    }
    this.#playBuffer(ctx, this.#countdownBeepBuffer);
  }

  /** "Beep beep beeeeeeep" pattern when the timer completes. */
  playCompletionTone(): void {
    const ctx = this.#getAudioContext();
    if (!ctx) return;
    if (!this.#completionToneBuffer) {
      this.#completionToneBuffer = this.#createBuffer(
        ctx,
        timerSoundSynthService.synthesizeCompletionTone(ctx.sampleRate)
      );
    }
    this.#playBuffer(ctx, this.#completionToneBuffer);
  }

  #getAudioContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!this.#audioCtx) {
      this.#audioCtx = new AudioContext();
    }
    return this.#audioCtx;
  }

  #createBuffer(ctx: AudioContext, samples: Float32Array<ArrayBuffer>): AudioBuffer {
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    return buffer;
  }

  #playBuffer(ctx: AudioContext, buffer: AudioBuffer): void {
    // Resume in case the browser suspended the context (autoplay policy).
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }
}

const timerWebAudioService = new TimerWebAudioService();
export default timerWebAudioService;
