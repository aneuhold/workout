/**
 * Named sets of example workout data that `MockScenarioService.setupScenario`
 * builds.
 */
export enum FullAppScenario {
  MidTrainingWithHistory = 'midTrainingWithHistory',
  CompletelyFresh = 'completelyFresh',
  FreshStart = 'freshStart',
  FreeFormWorkout = 'freeFormWorkout',
  AllComplete = 'allComplete',
  ReviewPending = 'reviewPending',
  MesocycleStart = 'mesocycleStart',
  VeryLateSession = 'veryLateSession',
  DeloadTrigger = 'deloadTrigger',
  HistoricalData = 'historicalData'
}
