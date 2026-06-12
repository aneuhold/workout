type ToneSpec = {
  frequencyHz: number;
  durationS: number;
  startOffsetS: number;
};

/**
 * Framework-agnostic sound synthesis for the timer. Contains no WebAudio APIs
 * so it can be consumed by the in-browser TimerWebAudioService.
 *
 * THE ROBOT WROTE THIS. I (Anton) HAVE NO CLUE WHAT IS GOING ON HERE. I DON'T KNOW SOUND STUFF
 * 😂😂😂
 */
class TimerSoundSynthService {
  /** Frequency of the short countdown beep, in Hz. */
  readonly #COUNTDOWN_BEEP_FREQUENCY_HZ = 880;

  /** Duration of each countdown beep, in seconds. */
  readonly #COUNTDOWN_BEEP_DURATION_S = 0.15;

  /** Frequency of every completion tone, in Hz. */
  readonly #COMPLETION_TONE_FREQUENCY_HZ = 1320;

  /** Peak gain applied during the sustain portion of every tone. */
  readonly #PEAK_GAIN = 0.3;

  /** Linear ramp-in time, in seconds. */
  readonly #RAMP_IN_S = 0.01;

  /** Exponential decay-out time, in seconds. */
  readonly #RAMP_OUT_S = 0.02;

  /** Floor for the exponential decay to avoid log(0). */
  readonly #RAMP_OUT_FLOOR = 0.001;

  /** Completion-tone pattern: short, short, long — identical to the legacy beep. */
  readonly #COMPLETION_TONE_SCHEDULE: readonly ToneSpec[] = [
    { frequencyHz: this.#COMPLETION_TONE_FREQUENCY_HZ, durationS: 0.12, startOffsetS: 0 },
    { frequencyHz: this.#COMPLETION_TONE_FREQUENCY_HZ, durationS: 0.12, startOffsetS: 0.2 },
    { frequencyHz: this.#COMPLETION_TONE_FREQUENCY_HZ, durationS: 0.45, startOffsetS: 0.4 }
  ];

  /** Total wall-clock duration of the completion tone schedule, in seconds. */
  readonly #COMPLETION_TONE_TOTAL_S = 0.85;

  /** Interval between the five countdown beeps in the full sequence, in seconds. */
  readonly #COUNTDOWN_INTERVAL_S = 1;

  /** Number of countdown beeps in the full sequence (5, 4, 3, 2, 1). */
  readonly #COUNTDOWN_COUNT = 5;

  /**
   * Synthesizes a single countdown beep — what the web audio service plays for
   * each of the last 5 seconds of the timer.
   *
   * @param sampleRate Sample rate of the target audio context, in Hz.
   */
  synthesizeBeep(sampleRate: number): Float32Array<ArrayBuffer> {
    const buffer = new Float32Array(Math.ceil(this.#COUNTDOWN_BEEP_DURATION_S * sampleRate));
    this.#writeTone(
      buffer,
      sampleRate,
      0,
      this.#COUNTDOWN_BEEP_FREQUENCY_HZ,
      this.#COUNTDOWN_BEEP_DURATION_S
    );
    return buffer;
  }

  /**
   * Synthesizes the three-tone completion pattern.
   *
   * @param sampleRate Sample rate of the target audio context, in Hz.
   */
  synthesizeCompletionTone(sampleRate: number): Float32Array<ArrayBuffer> {
    const buffer = new Float32Array(Math.ceil(this.#COMPLETION_TONE_TOTAL_S * sampleRate));
    for (const tone of this.#COMPLETION_TONE_SCHEDULE) {
      this.#writeTone(buffer, sampleRate, tone.startOffsetS, tone.frequencyHz, tone.durationS);
    }
    return buffer;
  }

  /**
   * Synthesizes the full pre-completion sequence used for the native Android
   * notification sound: five countdown beeps spaced one second apart, followed
   * by the completion tone. Total duration is ~5.85s.
   *
   * The sequence starts at t=0 (first beep), so when the OS plays it at
   * `endTime - 5s` the first beep aligns with the 5-second-remaining mark and
   * the completion tone fires when the timer naturally elapses.
   *
   * @param sampleRate Sample rate to render at, in Hz.
   */
  synthesizeFullSequence(sampleRate: number): Float32Array<ArrayBuffer> {
    const totalDurationS =
      (this.#COUNTDOWN_COUNT - 1) * this.#COUNTDOWN_INTERVAL_S + this.#COMPLETION_TONE_TOTAL_S + 1;
    const buffer = new Float32Array(Math.ceil(totalDurationS * sampleRate));

    for (let i = 0; i < this.#COUNTDOWN_COUNT; i++) {
      this.#writeTone(
        buffer,
        sampleRate,
        i * this.#COUNTDOWN_INTERVAL_S,
        this.#COUNTDOWN_BEEP_FREQUENCY_HZ,
        this.#COUNTDOWN_BEEP_DURATION_S
      );
    }

    const completionStartS = this.#COUNTDOWN_COUNT * this.#COUNTDOWN_INTERVAL_S;
    for (const tone of this.#COMPLETION_TONE_SCHEDULE) {
      this.#writeTone(
        buffer,
        sampleRate,
        completionStartS + tone.startOffsetS,
        tone.frequencyHz,
        tone.durationS
      );
    }

    return buffer;
  }

  /**
   * Renders a single sine tone with the standard envelope (linear ramp-in, flat
   * sustain at PEAK_GAIN, exponential ramp-out) directly into `buffer` at the
   * given start offset. Mutates `buffer` in place; samples are summed so
   * overlapping tones combine.
   *
   * @param buffer Destination sample buffer; mutated in place.
   * @param sampleRate Sample rate of the buffer, in Hz.
   * @param startOffsetS Position in the buffer to begin writing, in seconds.
   * @param frequencyHz Tone frequency, in Hz.
   * @param durationS Tone duration, in seconds.
   */
  #writeTone(
    buffer: Float32Array<ArrayBuffer>,
    sampleRate: number,
    startOffsetS: number,
    frequencyHz: number,
    durationS: number
  ): void {
    const startSample = Math.floor(startOffsetS * sampleRate);
    const sampleCount = Math.floor(durationS * sampleRate);
    const angularFreq = 2 * Math.PI * frequencyHz;

    for (let i = 0; i < sampleCount; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= buffer.length) break;

      const t = i / sampleRate;
      const envelope = this.#computeEnvelope(t, durationS);
      buffer[sampleIndex] += Math.sin(angularFreq * t) * envelope;
    }
  }

  /**
   * Envelope shape: linear ramp up to PEAK_GAIN over RAMP_IN_S, hold, then
   * exponential decay from PEAK_GAIN to RAMP_OUT_FLOOR over RAMP_OUT_S.
   *
   * @param t Time within the tone, in seconds.
   * @param durationS Total tone duration, in seconds.
   */
  #computeEnvelope(t: number, durationS: number): number {
    if (t < this.#RAMP_IN_S) {
      return (t / this.#RAMP_IN_S) * this.#PEAK_GAIN;
    }

    const decayStart = durationS - this.#RAMP_OUT_S;
    if (t < decayStart) {
      return this.#PEAK_GAIN;
    }

    const decayProgress = (t - decayStart) / this.#RAMP_OUT_S;
    // Exponential ramp matching WebAudio's exponentialRampToValueAtTime shape.
    return this.#PEAK_GAIN * Math.pow(this.#RAMP_OUT_FLOOR / this.#PEAK_GAIN, decayProgress);
  }
}

const timerSoundSynthService = new TimerSoundSynthService();
export default timerSoundSynthService;
