import { BumpKind } from './types';

/**
 * Applies semver bumps to a version string.
 */
class SemverBumpService {
  /**
   * Returns `version` bumped according to `kind`. Expects standard
   * `major.minor.patch` semver; throws on anything else so a bump fails fast
   * rather than producing a garbage version.
   *
   * @param version - The current semver string (e.g. `1.2.3`).
   * @param kind - Which segment to bump.
   */
  next(version: string, kind: BumpKind): string {
    const parts = version.split('.').map((part) => parseInt(part, 10));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      throw new Error(`Cannot bump non-semver version "${version}"`);
    }

    let [major, minor, patch] = parts;
    switch (kind) {
      case BumpKind.Major:
        major += 1;
        minor = 0;
        patch = 0;
        break;
      case BumpKind.Minor:
        minor += 1;
        patch = 0;
        break;
      case BumpKind.Patch:
        patch += 1;
        break;
    }
    return `${major}.${minor}.${patch}`;
  }
}

const semverBumpService = new SemverBumpService();
export default semverBumpService;
