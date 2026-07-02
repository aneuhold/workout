const sharedTextConstants = {
  mindMuscleDescriptions: [
    'You felt barely aware of your target muscles during the exercise',
    'You felt like your target muscles worked, but mildly',
    'You felt a good amount of tension and/or burn in the target muscles',
    'You felt tension and burn close to the limit in your target muscles'
  ],
  pumpDescriptions: [
    'You got no pump at all in the target muscles',
    'You got a very mild pump in the target muscles',
    'You got a decent pump in the target muscles',
    'You got close to maximal pump in the target muscles'
  ],
  disruptionDescriptions: [
    'You had no fatigue, perturbation, or soreness in the target muscles',
    'You had some weakness and stiffness after the session but recovered by the next day',
    'You had weakness and stiffness after the session and experienced soreness the following day',
    'You got much weaker and felt perturbation right after the session and had soreness for days or more'
  ],
  jointDescriptions: [
    'You had minimal to no pain or perturbation in your joints or connective tissues',
    'You had some pain or perturbation in your joints and connective tissues but recovered by the next day',
    'You had some persistent pain or tightness in your connective tissues that lasted through the following day or several days',
    'You develop chronic pain in the joints and connective tissues that persists across days to weeks or longer'
  ],
  effortDescriptions: [
    'Training felt very easy and hardly taxed you psychologically',
    'You put effort into the training, but felt recovered by the end of the day',
    'You put a large effort into the training and felt drained through the next day',
    'You put an all-out effort into the training and felt drained for days'
  ],
  unusedMuscleDescriptions: [
    'Performance on subsequent exercises targeting unused muscles was better than expected',
    'Performance on subsequent exercises targeting unused muscles was as expected',
    'Performance on subsequent exercises targeting unused muscles was worse than expected',
    'Your performance on subsequent exercises targeting unused muscles was hugely deteriorated'
  ],
  performanceDescriptions: [
    'You stopped at target RIR and beat your planned reps by 2 or more',
    'You stopped at target RIR within 1 rep of your planned reps',
    'You reached your planned reps only by pushing past target RIR',
    'You could not reach your planned reps at any RIR'
  ],
  sorenessDescriptions: [
    'You did not get at all sore in the target muscle group',
    'You got stiff for a few hours after training and had mild soreness in the target muscle group that resolved by next session targeting the same muscle group',
    'You got DOMS in the target muscle group that resolved just in time for the next session targeting the same muscle group',
    'You got DOMS in the target muscle group that remained for the next session targeting the same muscle group'
  ]
} as const;

export default sharedTextConstants;
