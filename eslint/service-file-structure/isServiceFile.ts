/**
 * Matches a service source file: a basename ending in `service.ts` or
 * `service.svelte.ts`, where only the leading `S` is case-insensitive (so
 * `WakeLockService.ts`, `setMapService.svelte.ts`, and `service.ts` all match).
 * Intentionally broad so mis-named services are still caught and reported.
 */
const SERVICE_FILE = /[sS]ervice\.(svelte\.)?ts$/;

/**
 * Matches the required service file naming convention: a PascalCase name
 * (capital first letter) followed by `.service.ts` or `.service.svelte.ts`
 * (e.g. `WakeLock.service.ts`).
 */
const SERVICE_FILE_NAMING = /^[A-Z][A-Za-z0-9]*\.service\.(svelte\.)?ts$/;

/**
 * Excludes test, spec, and mock variants from the gate even when their name
 * would otherwise look like a service file.
 */
const NON_SOURCE = /\.(test|spec|mock)\./;

/**
 * Returns the final path segment of a file path, handling both POSIX and
 * Windows separators.
 *
 * @param filePath Absolute or relative file path from the lint context
 */
const baseName = (filePath: string): string => {
  const segments = filePath.split(/[\\/]/);
  return segments[segments.length - 1];
};

/**
 * Decides whether a file is in scope for this rule.
 *
 * @param filePath The file path being linted
 */
export const isServiceFile = (filePath: string): boolean => {
  const name = baseName(filePath);
  return SERVICE_FILE.test(name) && !NON_SOURCE.test(name);
};

/**
 * Decides whether an in-scope service file follows the required
 * `<Name>.service.ts` / `<Name>.service.svelte.ts` naming convention, where
 * `<Name>` is PascalCase (starts with a capital letter).
 *
 * @param filePath The file path being linted
 */
export const usesServiceFileNaming = (filePath: string): boolean =>
  SERVICE_FILE_NAMING.test(baseName(filePath));
