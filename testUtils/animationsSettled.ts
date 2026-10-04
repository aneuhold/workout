/**
 * Resolves once no finite animation is running in the document. CSS
 * animations, CSS transitions, and Svelte transitions all run through the Web
 * Animations API, so `document.getAnimations()` sees every one. It checks
 * again after each round, because a finishing animation can start another,
 * such as a Svelte transition's delay handing off to the transition itself.
 * Infinite animations, such as spinners, never finish and are skipped.
 */
const animationsSettled = async (): Promise<void> => {
  // Lets animations queued by the last change start before checking
  await new Promise(requestAnimationFrame);
  const running = document
    .getAnimations()
    .filter(
      (animation) =>
        animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity
    );
  if (running.length === 0) return;
  await Promise.allSettled(running.map((animation) => animation.finished));
  await animationsSettled();
};

export default animationsSettled;
