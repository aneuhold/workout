import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { type ClassFrame, type FixableMember, type FixTarget, type MessageId } from './types';

/** A member to report, with the message describing why. */
export type MemberReport = { member: FixableMember; messageId: MessageId };

/** The outcome of analyzing a class: what to report, and what an autofix converts. */
export type ClassReports = { reports: MemberReport[]; targets: FixTarget[] };

/**
 * Turns a fully-populated frame into the per-member reports and the set of
 * fixable conversion targets. Each name claims its references once, so a
 * get/set pair sharing a name doesn't rewrite the same reference twice.
 *
 * @param frame The class frame, after traversal has recorded its references
 */
export const collectClassReports = (frame: ClassFrame): ClassReports => {
  const reports: MemberReport[] = [];
  const targets: FixTarget[] = [];
  const claimedNames = new Set<string>();

  for (const member of frame.classNode.body.body) {
    if (
      member.type !== AST_NODE_TYPES.PropertyDefinition &&
      member.type !== AST_NODE_TYPES.MethodDefinition &&
      member.type !== AST_NODE_TYPES.AccessorProperty
    ) {
      continue;
    }
    if (member.accessibility !== 'private') {
      continue;
    }

    if (member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'constructor') {
      reports.push({ member, messageId: 'privateConstructor' });
      continue;
    }

    const messageId: MessageId =
      member.type === AST_NODE_TYPES.MethodDefinition ? 'privateMethod' : 'privateField';
    reports.push({ member, messageId });

    const name =
      !member.computed && member.key.type === AST_NODE_TYPES.Identifier ? member.key.name : null;
    if (name === null || frame.blocked.has(name) || frame.existingPrivateNames.has(name)) {
      continue;
    }

    const refs = claimedNames.has(name)
      ? []
      : [...(frame.thisRefs.get(name) ?? []), ...(frame.staticRefs.get(name) ?? [])];
    claimedNames.add(name);
    targets.push({ member, refs });
  }

  return { reports, targets };
};
