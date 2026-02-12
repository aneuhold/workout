<script lang="ts">
  import { type DateValue, isEqualMonth } from '@internationalized/date';
  import { Calendar as CalendarPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { cn, type WithoutChildrenOrChild } from '$util/svelte-shadcn-util.js';
  import type { ButtonVariant } from '../Button/Button.svelte';
  import CalendarCaption from './CalendarCaption.svelte';
  import CalendarCell from './CalendarCell.svelte';
  import CalendarDay from './CalendarDay.svelte';
  import CalendarGrid from './CalendarGrid.svelte';
  import CalendarGridBody from './CalendarGridBody.svelte';
  import CalendarGridHead from './CalendarGridHead.svelte';
  import CalendarGridRow from './CalendarGridRow.svelte';
  import CalendarHeadCell from './CalendarHeadCell.svelte';
  import CalendarHeader from './CalendarHeader.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import CalendarMonths from './CalendarMonths.svelte';
  import CalendarNav from './CalendarNav.svelte';
  import CalendarNextButton from './CalendarNextButton.svelte';
  import CalendarPrevButton from './CalendarPrevButton.svelte';

  let {
    ref = $bindable(null),
    value = $bindable(),
    placeholder = $bindable(),
    class: className,
    weekdayFormat = 'short',
    buttonVariant = 'ghost',
    captionLayout = 'label',
    locale = 'en-US',
    months: monthsProp,
    years,
    monthFormat: monthFormatProp,
    yearFormat = 'numeric',
    day,
    disableDaysOutsideMonth = false,
    ...restProps
  }: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
    buttonVariant?: ButtonVariant;
    captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
    months?: CalendarPrimitive.MonthSelectProps['months'];
    years?: CalendarPrimitive.YearSelectProps['years'];
    monthFormat?: CalendarPrimitive.MonthSelectProps['monthFormat'];
    yearFormat?: CalendarPrimitive.YearSelectProps['yearFormat'];
    day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
  } = $props();

  const monthFormat = $derived.by(() => {
    if (monthFormatProp) return monthFormatProp;
    if (captionLayout.startsWith('dropdown')) return 'short';
    return 'long';
  });
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along at the moment. So this is casted to never.
-->
<CalendarPrimitive.Root
  bind:value={value as never}
  bind:ref
  bind:placeholder
  {weekdayFormat}
  {disableDaysOutsideMonth}
  class={cn(
    'bg-background group/calendar p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
    className
  )}
  {locale}
  {monthFormat}
  {yearFormat}
  {...restProps}
>
  {#snippet children({ months, weekdays })}
    <CalendarMonths>
      <CalendarNav>
        <CalendarPrevButton variant={buttonVariant} />
        <CalendarNextButton variant={buttonVariant} />
      </CalendarNav>
      {#each months as month, monthIndex (month)}
        <CalendarMonth>
          <CalendarHeader>
            <CalendarCaption
              {captionLayout}
              months={monthsProp}
              {monthFormat}
              {years}
              {yearFormat}
              month={month.value}
              bind:placeholder
              {locale}
              {monthIndex}
            />
          </CalendarHeader>
          <CalendarGrid>
            <CalendarGridHead>
              <CalendarGridRow class="select-none">
                {#each weekdays as weekday (weekday)}
                  <CalendarHeadCell>
                    {weekday.slice(0, 2)}
                  </CalendarHeadCell>
                {/each}
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              {#each month.weeks as weekDates (weekDates)}
                <CalendarGridRow class="mt-2 w-full">
                  {#each weekDates as date (date)}
                    <CalendarCell {date} month={month.value}>
                      {#if day}
                        {@render day({
                          day: date,
                          outsideMonth: !isEqualMonth(date, month.value as DateValue)
                        })}
                      {:else}
                        <CalendarDay />
                      {/if}
                    </CalendarCell>
                  {/each}
                </CalendarGridRow>
              {/each}
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarMonth>
      {/each}
    </CalendarMonths>
  {/snippet}
</CalendarPrimitive.Root>
