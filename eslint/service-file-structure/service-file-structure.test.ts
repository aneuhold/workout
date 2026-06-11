import { RuleTester } from '@typescript-eslint/rule-tester';
import { setupEslintRuleTester } from '../eslintTestSetup';
import { serviceFileStructure } from './service-file-structure';

setupEslintRuleTester();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
  }
});

/**
 * A well-formed service body, parameterized by class name so valid cases stay
 * DRY.
 *
 * @param className The service class name
 */
const validService = (className: string): string => {
  const instance = `${className.charAt(0).toLowerCase()}${className.slice(1)}`;
  return [
    `class ${className} {`,
    `  private helper(): void {}`,
    `}`,
    `const ${instance} = new ${className}();`,
    `export default ${instance};`
  ].join('\n');
};

ruleTester.run('service-file-structure', serviceFileStructure, {
  valid: [
    // Canonical singleton service.
    { filename: 'WakeLock.service.ts', code: validService('WakeLockService') },
    // Rune-based `.service.svelte.ts` service is in scope and well-formed.
    { filename: 'Timer.service.svelte.ts', code: validService('TimerService') },
    // Exporting the class itself as default is allowed (extensible base).
    {
      filename: 'Foo.service.ts',
      code: `export default class FooService {}`
    },
    // Exporting the named class as default is also allowed.
    {
      filename: 'Foo.service.ts',
      code: [`class FooService {}`, `export default FooService;`].join('\n')
    },
    // Out-of-scope file: not a service name, so anything goes.
    { filename: 'helpers.ts', code: `export function stray() {}` },
    // Test files are excluded from the gate.
    { filename: 'Foo.service.test.ts', code: `export function stray() {}` },
    // Mock files are excluded from the gate.
    { filename: 'SetMap.service.mock.ts', code: `export const thing = () => {};` }
  ],
  invalid: [
    // A service file not following the `<Name>.service.ts` naming convention.
    {
      filename: 'FooService.ts',
      code: validService('FooService'),
      errors: [{ messageId: 'fileNaming' }]
    },
    // A `.service.ts` file whose name is not PascalCase (lowercase first letter).
    {
      filename: 'foo.service.ts',
      code: validService('FooService'),
      errors: [{ messageId: 'fileNaming' }]
    },
    // Inline `export default new X()` is rewritten to the two-line form.
    {
      filename: 'Foo.service.ts',
      code: [`class FooService {}`, `export default new FooService();`].join('\n'),
      errors: [{ messageId: 'trailingInstanceExport' }],
      output: [
        `class FooService {}`,
        `const fooService = new FooService();`,
        `export default fooService;`
      ].join('\n')
    },
    // Constructor arguments are preserved by the fix.
    {
      filename: 'Foo.service.ts',
      code: [`class FooService {}`, `export default new FooService(1, 2);`].join('\n'),
      errors: [{ messageId: 'trailingInstanceExport' }],
      output: [
        `class FooService {}`,
        `const fooService = new FooService(1, 2);`,
        `export default fooService;`
      ].join('\n')
    },
    // Wrong instance name is reported with no safe fix.
    {
      filename: 'Foo.service.ts',
      code: [`class FooService {}`, `const svc = new FooService();`, `export default svc;`].join(
        '\n'
      ),
      errors: [{ messageId: 'instanceName' }],
      output: null
    },
    // A top-level function declaration is forbidden.
    {
      filename: 'Foo.service.ts',
      code: [
        `class FooService {}`,
        `function helper() {}`,
        `const fooService = new FooService();`,
        `export default fooService;`
      ].join('\n'),
      errors: [{ messageId: 'noTopLevelFunction' }]
    },
    // A top-level value `const` is forbidden.
    {
      filename: 'Foo.service.ts',
      code: [
        `class FooService {}`,
        `const MAX = 5;`,
        `const fooService = new FooService();`,
        `export default fooService;`
      ].join('\n'),
      errors: [{ messageId: 'noTopLevelVariable' }]
    },
    // A top-level arrow-function `const` is forbidden.
    {
      filename: 'Foo.service.ts',
      code: [
        `class FooService {}`,
        `const helper = () => {};`,
        `const fooService = new FooService();`,
        `export default fooService;`
      ].join('\n'),
      errors: [{ messageId: 'noTopLevelVariable' }]
    },
    // A top-level named `export const` is forbidden.
    {
      filename: 'Foo.service.ts',
      code: [
        `class FooService {}`,
        `export const value = 1;`,
        `const fooService = new FooService();`,
        `export default fooService;`
      ].join('\n'),
      errors: [{ messageId: 'noTopLevelVariable' }]
    },
    // More than one class is not allowed.
    {
      filename: 'Foo.service.ts',
      code: [
        `class AService {}`,
        `class BService {}`,
        `const aService = new AService();`,
        `export default aService;`
      ].join('\n'),
      errors: [{ messageId: 'singleClassOnly' }]
    },
    // No class at all.
    {
      filename: 'Foo.service.ts',
      code: `export const value = 1;`,
      errors: [{ messageId: 'classRequired' }]
    }
  ]
});
