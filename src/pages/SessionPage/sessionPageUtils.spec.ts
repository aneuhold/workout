import { DocumentService, type WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import sessionExerciseMapServiceMock from '$services/documentMapServices/SessionExerciseMap.service.mock';
import { SessionPageExerciseCardState, SessionPageMode } from './sessionPageTypes';
import { deriveCardState } from './sessionPageUtils';

describe('deriveCardState', () => {
  /**
   * Creates `count` session exercises in one session, in order.
   *
   * @param count Number of session exercises to create
   */
  const createSessionExercises = (count: number): WorkoutSessionExercise[] => {
    const workoutSessionId = DocumentService.generateID();
    return Array.from({ length: count }, () =>
      sessionExerciseMapServiceMock.addSessionExercise({
        workoutSessionId,
        workoutExerciseId: DocumentService.generateID()
      })
    );
  };

  /**
   * Derives every card's state for an active free-form session.
   *
   * @param sessionExercises The ordered session exercises
   * @param doneIds IDs of the session exercises marked as done
   */
  const freeFormCardStates = (
    sessionExercises: WorkoutSessionExercise[],
    doneIds: UUID[]
  ): SessionPageExerciseCardState[] =>
    sessionExercises.map((_, index) =>
      deriveCardState(index, SessionPageMode.Active, true, sessionExercises, 0, (seId) =>
        doneIds.includes(seId)
      )
    );

  describe('free-form active session', () => {
    it('marks only the first not-done exercise as current', () => {
      const sessionExercises = createSessionExercises(3);

      expect(freeFormCardStates(sessionExercises, [])).toEqual([
        SessionPageExerciseCardState.Current,
        SessionPageExerciseCardState.Future,
        SessionPageExerciseCardState.Future
      ]);
    });

    it('moves current to the first not-done exercise when an earlier one is done out of order', () => {
      const sessionExercises = createSessionExercises(3);

      expect(freeFormCardStates(sessionExercises, [sessionExercises[1]._id])).toEqual([
        SessionPageExerciseCardState.Current,
        SessionPageExerciseCardState.Completed,
        SessionPageExerciseCardState.Future
      ]);
      expect(freeFormCardStates(sessionExercises, [sessionExercises[0]._id])).toEqual([
        SessionPageExerciseCardState.Completed,
        SessionPageExerciseCardState.Current,
        SessionPageExerciseCardState.Future
      ]);
    });

    it('marks every exercise completed when all are done', () => {
      const sessionExercises = createSessionExercises(2);

      expect(
        freeFormCardStates(
          sessionExercises,
          sessionExercises.map((se) => se._id)
        )
      ).toEqual([SessionPageExerciseCardState.Completed, SessionPageExerciseCardState.Completed]);
    });
  });
});
