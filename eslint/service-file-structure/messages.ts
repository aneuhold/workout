/**
 * The single source of truth for this rule's report messages. The rule's `meta`
 * consumes this object, and `ServiceMessageId` types every `context.report`
 * call across the individual validation modules.
 */
export const messages = {
  fileNaming: 'A service file must be named `<name>.service.ts` or `<name>.service.svelte.ts`.',
  classRequired: 'A service file must define exactly one class; none was found.',
  singleClassOnly: 'A service file must define exactly one class.',
  classMustBeNamed: 'A service class must have a name.',
  noTopLevelFunction:
    'A service file must not define functions outside its class; move this into the class as a private method.',
  noTopLevelVariable:
    'A service file must not declare variables outside its class; use a private instance or static field instead. The only exception is the singleton `const {{instance}} = new {{className}}();`.',
  instanceName:
    'The service singleton must be named `{{expected}}` (camelCase of `{{className}}`), not `{{actual}}`.',
  trailingInstanceExport:
    'Export the singleton via `const {{instance}} = new {{className}}();` then `export default {{instance}};`, not `export default new {{className}}();`.'
};

/**
 * Union of every message id this rule can report.
 */
export type ServiceMessageId = keyof typeof messages;
