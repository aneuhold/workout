/**
 * Creates a function which lazily imports a module and returns it when called. This can
 * be provided an import function that returns undefined conditionally though if desired.
 *
 * This is a clean way to avoid top-level await while still allowing lazy loading of modules.
 *
 * This function is 🤌🎨 if I do say so myself 😅. It should probably be in the core-ts-lib.
 *
 * @param importer - The dynamic import promise for the module. For example `import('module-name')`.
 */
export function createLazyModuleGetter<T>(importer?: Promise<T>) {
  let module: T | undefined;

  importer?.then((mod) => {
    module = mod;
  });

  return () => module;
}
