import { ArchitectureComponentType } from './architectureComponents';
import type { ArchitectureContext, ArchitectureContextName } from './architectureContextInfo';
import architectureContextInfo from './architectureContextInfo';

/**
 * A class that provides information about different architectures for personal
 * projects.
 */
export default class ArchitectureInfo {
  static getContextFromSearchParams(searchParams: URLSearchParams): ArchitectureContext | null {
    if (searchParams.has('context')) {
      const contextString = searchParams.get('context');
      if (contextString && Object.hasOwn(architectureContextInfo, contextString)) {
        return architectureContextInfo[contextString as ArchitectureContextName];
      }
    }
    return null;
  }

  static getComponentTypeIconName(type: ArchitectureComponentType) {
    switch (type) {
      case ArchitectureComponentType.language:
        return 'code';
      case ArchitectureComponentType.framework:
        return 'foundation';
      case ArchitectureComponentType.tool:
        return 'construction';
      default:
        return null;
    }
  }

  static getComponentTypeTooltip(type: ArchitectureComponentType) {
    switch (type) {
      case ArchitectureComponentType.language:
        return 'Language';
      case ArchitectureComponentType.framework:
        return 'Framework';
      case ArchitectureComponentType.tool:
        return 'Tool';
      default:
        return null;
    }
  }
}
