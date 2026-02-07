export type ConsoleFormat =
  | { kind: 'node-ansi'; prefix: string; suffix: string }
  | { kind: 'browser-css'; label: string; labelStyle: string; resetStyle: string };

/**
 * Get a deterministic console formatting configuration for a given logger tag.
 *
 * @param tag Logger identifier (typically a filename)
 */
export const getConsoleFormatForTag = (tag: string): ConsoleFormat => {
  const isNode = isNodeRuntime();
  const colorCode = pickDeterministicColorCode(tag);

  if (isNode) {
    return {
      kind: 'node-ansi',
      prefix: `\u001b[38;5;${colorCode}m`,
      suffix: '\u001b[0m'
    };
  }

  const hue = (colorCode * 37) % 360;
  return {
    kind: 'browser-css',
    label: tag,
    labelStyle: `color: hsl(${hue} 70% 45%); font-weight: 600;`,
    resetStyle: 'color: inherit; font-weight: inherit;'
  };
};

const isNodeRuntime = (): boolean => {
  const nodeProcess = (globalThis as unknown as { process?: unknown }).process as
    | { versions?: { node?: string } }
    | undefined;

  return Boolean(nodeProcess?.versions?.node);
};

const pickDeterministicColorCode = (tag: string): number => {
  // A palette of 256-color ANSI foreground codes (similar in spirit to debug's colors).
  const palette: number[] = [
    20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77,
    78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164,
    165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201,
    202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221
  ];

  const hash = hashString(tag);
  return palette[hash % palette.length] ?? 33;
};

const hashString = (value: string): number => {
  // djb2
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }

  return Math.abs(hash);
};
