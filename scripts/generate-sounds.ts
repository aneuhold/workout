import { mkdirSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import timerSoundSynthService from '../src/services/TimerService/TimerSoundSynthService';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res', 'raw');
const OUTPUT_FILE = join(OUTPUT_DIR, 'timer_complete.wav');

/** Standard CD-quality sample rate. */
const SAMPLE_RATE = 44100;

/** Mono audio, single channel. */
const NUM_CHANNELS = 1;

/** 16-bit signed PCM — universally supported by Android. */
const BITS_PER_SAMPLE = 16;

const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

/** Standard PCM WAV header size (44 bytes). */
const WAV_HEADER_SIZE = 44;

/**
 * Converts a Float32 sample buffer to a 16-bit signed PCM WAV file and writes
 * it to `android/app/src/main/res/raw/timer_complete.wav`. The file is what
 * the Android local-notification channel uses as its custom sound.
 */
const main = (): void => {
  const samples = timerSoundSynthService.synthesizeFullSequence(SAMPLE_RATE);
  const wav = encodeWav(samples);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, wav);

  const { size } = statSync(OUTPUT_FILE);
  console.log(`Wrote ${OUTPUT_FILE} (${size} bytes, ${samples.length} samples @ ${SAMPLE_RATE}Hz)`);
};

/**
 * Wraps a Float32 sample buffer in a standard 44-byte PCM WAV header. Samples
 * are clamped to [-1, 1] and quantized to 16-bit signed integers.
 *
 * @param samples Float32 sample buffer to encode.
 */
const encodeWav = (samples: Float32Array): Buffer => {
  const dataSize = samples.length * BYTES_PER_SAMPLE;
  const buffer = Buffer.alloc(WAV_HEADER_SIZE + dataSize);
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * BYTES_PER_SAMPLE;
  const blockAlign = NUM_CHANNELS * BYTES_PER_SAMPLE;

  // RIFF chunk descriptor
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');

  // fmt subchunk
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // data subchunk
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    buffer.writeInt16LE(int16, WAV_HEADER_SIZE + i * BYTES_PER_SAMPLE);
  }

  return buffer;
};

main();
