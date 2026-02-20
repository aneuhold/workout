/* This file is setup in this way to handle type-issues with the Storybook decorators. But it also
    makes this a tiny bit cleaner IMO. */

import type { DecoratorFunction } from 'storybook/internal/csf';
import SbConfettiDecorator from '$components/singletons/Confetti/SBConfettiDecorator.svelte';

export const confettiDecoratorFunction: DecoratorFunction = () => ({
  Component: SbConfettiDecorator
});
