export interface MockLike {
  mockImplementation: (fn: (...args: unknown[]) => unknown) => unknown;
}

/**
 * Type definition for a spyOn function that is generalized.
 */
export type SpyOnFn = <T, K extends keyof T>(obj: T, method: K) => MockLike;
