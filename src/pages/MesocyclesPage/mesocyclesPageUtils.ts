import { CycleType } from '@aneuhold/core-ts-db-lib';

const cycleTypeLabels: Record<CycleType, string> = {
  [CycleType.MuscleGain]: 'Muscle Gain',
  [CycleType.Resensitization]: 'Resensitization',
  [CycleType.Cut]: 'Cut',
  [CycleType.FreeForm]: 'Free Form'
};

export function formatCycleType(ct: CycleType): string {
  return cycleTypeLabels[ct];
}
