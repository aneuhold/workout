import type { UUID } from 'crypto';

const UUID_LENGTH = 36;

/**
 * Type guard that checks whether a value is a UUID-shaped string. Used at
 * system boundaries (URL parameters, parsed JSON, etc.) where TypeScript
 * cannot narrow a `string` to the `UUID` template literal type on its own.
 *
 * @param value The value to check.
 */
export const isUUID = (value: string | null | undefined): value is UUID => {
  return typeof value === 'string' && value.length === UUID_LENGTH;
};
