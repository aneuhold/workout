import type {
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import { CycleType } from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import type { HomePageSessionBundle } from './homePageUtils';

export enum HeroCardAction {
  ContinueSession = 'ContinueSession',
  StartSession = 'StartSession',
  CompleteMicrocycle = 'CompleteMicrocycle',
  StartMesocycle = 'StartMesocycle',
  EditMesocycle = 'EditMesocycle',
  CompleteMesocycle = 'CompleteMesocycle'
}

export type HeroCardState =
  | {
      action: HeroCardAction.ContinueSession;
      session: WorkoutSession;
      sessionExercises: WorkoutSessionExercise[];
      sets: WorkoutSet[];
    }
  | {
      action: HeroCardAction.StartSession;
      session: WorkoutSession;
      sessionExercises: WorkoutSessionExercise[];
      sets: WorkoutSet[];
      daysLate: number;
      scheduledDate: Date | null;
    }
  | {
      action: HeroCardAction.CompleteMicrocycle;
      completedMicrocycleNumber: number;
      blockedByPendingReviews: boolean;
    }
  | {
      action: HeroCardAction.StartMesocycle;
      mesocycleTitle: string;
    }
  | {
      action: HeroCardAction.EditMesocycle;
      mesocycleId: string;
      mesocycleTitle: string;
      startDate: Date;
    }
  | {
      action: HeroCardAction.CompleteMesocycle;
      blockedByPendingReviews: boolean;
    };

/**
 * Determines which hero card action to show based on the current data.
 *
 * @param activeMesocycle The active mesocycle, or null if none
 * @param microcycles Ordered microcycles for the active mesocycle
 * @param sessions All sessions for the active mesocycle
 * @param inProgressSession The currently in-progress session, if any
 * @param nextUpSession The next-up session, if any
 * @param pendingReviewBundles Sessions that still need review
 * @param heroSessionExercises Session exercises for the hero session
 * @param heroSessionSets Sets for the hero session
 */
export function getHeroCardState(
  activeMesocycle: WorkoutMesocycle | null,
  microcycles: WorkoutMicrocycle[],
  sessions: WorkoutSession[],
  inProgressSession: WorkoutSession | null,
  nextUpSession: WorkoutSession | null,
  pendingReviewBundles: HomePageSessionBundle[],
  heroSessionExercises: WorkoutSessionExercise[],
  heroSessionSets: WorkoutSet[]
): HeroCardState | null {
  // 1. If inProgressSession → ContinueSession
  if (inProgressSession) {
    return {
      action: HeroCardAction.ContinueSession,
      session: inProgressSession,
      sessionExercises: heroSessionExercises,
      sets: heroSessionSets
    };
  }

  // 2. If no activeMesocycle → null (show empty state)
  if (!activeMesocycle) return null;

  // 3. If activeMesocycle is FreeForm → StartSession (if nextUpSession) or null
  if (activeMesocycle.cycleType === CycleType.FreeForm) {
    if (nextUpSession) {
      return {
        action: HeroCardAction.StartSession,
        session: nextUpSession,
        sessionExercises: heroSessionExercises,
        sets: heroSessionSets,
        daysLate: 0,
        scheduledDate: null
      };
    }
    return null;
  }

  // 4. If no microcycles exist or mesocycle hasn't been explicitly started
  if (microcycles.length === 0 || !activeMesocycle.startDate) {
    // If microcycles exist, check if the first one's start date is in the future
    if (microcycles.length > 0) {
      const firstMicrocycleStart = new Date(microcycles[0].startDate);
      firstMicrocycleStart.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (firstMicrocycleStart > today) {
        return {
          action: HeroCardAction.EditMesocycle,
          mesocycleId: activeMesocycle._id,
          mesocycleTitle: activeMesocycle.title ?? 'Mesocycle',
          startDate: microcycles[0].startDate
        };
      }
    }

    return {
      action: HeroCardAction.StartMesocycle,
      mesocycleTitle: activeMesocycle.title ?? 'Mesocycle'
    };
  }

  // 5. If all microcycles complete → CompleteMesocycle
  const allMicrocyclesComplete = microcycles.every((mc) => {
    const mcSessions = sessions.filter((s) => s.workoutMicrocycleId === mc._id);
    return mcSessions.length > 0 && mcSessions.every((s) => s.complete);
  });
  if (allMicrocyclesComplete) {
    return {
      action: HeroCardAction.CompleteMesocycle,
      blockedByPendingReviews: pendingReviewBundles.length > 0
    };
  }

  // 6. If the PREVIOUS microcycle is fully complete but not yet marked →
  //    CompleteMicrocycle. Show this when the user hasn't started the next
  //    microcycle yet, OR when there are pending reviews that block advancement even if the user
  //    is late to a future session.
  if (nextUpSession?.workoutMicrocycleId) {
    const nextUpMicrocycleIndex = microcycles.findIndex(
      (mc) => mc._id === nextUpSession.workoutMicrocycleId
    );
    if (nextUpMicrocycleIndex > 0) {
      const prevMicrocycle = microcycles[nextUpMicrocycleIndex - 1];

      if (!prevMicrocycle.completedDate) {
        const prevSessions = sessions.filter((s) => s.workoutMicrocycleId === prevMicrocycle._id);
        const prevComplete = prevSessions.length > 0 && prevSessions.every((s) => s.complete);

        if (prevComplete) {
          const currentMcSessions = sessions.filter(
            (s) => s.workoutMicrocycleId === nextUpSession.workoutMicrocycleId
          );
          const isFirstInMicrocycle =
            currentMcSessions.length > 0 && currentMcSessions.every((s) => !s.complete);
          const hasPendingReviews = pendingReviewBundles.length > 0;

          if (isFirstInMicrocycle || hasPendingReviews) {
            return {
              action: HeroCardAction.CompleteMicrocycle,
              completedMicrocycleNumber: nextUpMicrocycleIndex, // previous microcycle number (1-indexed)
              blockedByPendingReviews: hasPendingReviews
            };
          }
        }
      }
    }
  }

  // 7. If nextUpSession exists → StartSession
  if (nextUpSession) {
    const isPastSchedule = nextUpSession.startTime.getTime() < Date.now();
    const daysLate = isPastSchedule
      ? DateService.getCalendarDaysBetween(nextUpSession.startTime, new Date())
      : 0;
    const scheduledDate = daysLate > 0 ? nextUpSession.startTime : null;

    return {
      action: HeroCardAction.StartSession,
      session: nextUpSession,
      sessionExercises: heroSessionExercises,
      sets: heroSessionSets,
      daysLate,
      scheduledDate
    };
  }

  // 8. null (nothing to show)
  return null;
}
