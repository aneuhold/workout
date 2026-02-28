/* This file is setup in this way to handle type-issues with the Storybook decorators. But it also
    makes this a tiny bit cleaner IMO. */

import type { DecoratorFunction } from 'storybook/internal/csf';
import SBAllSingletonsDecorator from '$components/singletons/SBAllSingletonsDecorator.svelte';

/** Mounts all singleton components (dialogs + confetti) for every story. */
export const allSingletonsDecoratorFunction: DecoratorFunction = () => ({
  Component: SBAllSingletonsDecorator
});
