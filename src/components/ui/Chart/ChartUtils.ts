// This file comes directly from svelte-shadcn

import type { Tooltip } from 'layerchart';
import { type Component, type ComponentProps, getContext, setContext, type Snippet } from 'svelte';

export enum ChartTheme {
  Light = 'Light',
  Dark = 'Dark'
}

export const CHART_THEME_SELECTORS: Record<ChartTheme, string> = {
  [ChartTheme.Light]: '',
  [ChartTheme.Dark]: '.dark'
};

export type ChartConfig = {
  [k in string]: {
    label?: string;
    icon?: Component;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<ChartTheme, string> });
};

export type ExtractSnippetParams<T> = T extends Snippet<[infer P]> ? P : never;

export type TooltipPayload = ExtractSnippetParams<
  ComponentProps<typeof Tooltip.Root>['children']
>['payload'][number];

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === 'object' && value !== null;
}

function getStringProp(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: TooltipPayload,
  key: string
) {
  if (typeof payload !== 'object') return undefined;

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (payload.key === key) {
    configLabelKey = payload.key;
  } else if (payload.name === key) {
    configLabelKey = payload.name;
  } else {
    const nested = getStringProp(payload, key) ?? getStringProp(payloadPayload ?? {}, key);
    if (nested !== undefined) {
      configLabelKey = nested;
    }
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

type ChartContextValue = {
  config: ChartConfig;
};

const chartContextKey = Symbol('chart-context');

export function setChartContext(value: ChartContextValue) {
  return setContext(chartContextKey, value);
}

export function useChart() {
  return getContext<ChartContextValue>(chartContextKey);
}
