<!--
  @component

  Public privacy policy page. Linked from the Play Console listing and
  rendered without app chrome inside the `(marketing)` route group.
-->
<script lang="ts">
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import { mode } from 'mode-watcher';
  import Button from '$ui/Button/Button.svelte';

  const lastUpdated = 'May 10, 2026';
  const contactEmail = 'aneuholddev@gmail.com';

  const logoSrc = $derived(mode.current === 'dark' ? '/logo-dark.svg' : '/logo-light.svg');
</script>

<article class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
  <Button variant="ghost" size="sm" class="self-start" onclick={() => history.back()}>
    <IconArrowLeft size={16} />
    Back
  </Button>

  <header class="flex items-center gap-3">
    <img src={logoSrc} alt="" class="h-10 w-10" />
    <div class="flex flex-col">
      <span class="text-lg font-semibold">MesoPro</span>
      <span class="text-sm text-muted-foreground">Privacy Policy</span>
    </div>
  </header>

  <p class="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

  <section class="flex flex-col gap-2">
    <p>
      MesoPro is a workout planning and tracking app. This policy describes what we collect, why,
      and how to remove it. We do not sell your data and we do not use it for advertising.
    </p>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Data we collect</h2>
    <ul class="ml-6 list-disc flex flex-col gap-1">
      <li>
        <strong>Account identifiers.</strong> When you sign in with Google we receive your Google account
        ID and the username you choose for the app.
      </li>
      <li>
        <strong>Workout data.</strong> Sessions, exercises, sets, mesocycles, microcycles, equipment,
        and calibration values you create inside the app.
      </li>
      <li>
        <strong>Device and crash data.</strong> Diagnostic information (e.g. error stack traces, OS/browser,
        app version) collected when the app crashes or hits an error.
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">How it's used</h2>
    <p>
      Your data is used solely to provide the service: signing you in, syncing your workouts across
      devices, and showing you your training history. We do not use it for advertising and we do not
      sell it to anyone.
    </p>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Where it's stored</h2>
    <ul class="ml-6 list-disc flex flex-col gap-1">
      <li>
        <strong>MongoDB Atlas.</strong> Account and workout documents are stored in MongoDB Atlas and
        accessed through our backend service.
      </li>
      <li>
        <strong>Sentry.</strong> Crash and error reports are sent to Sentry to help diagnose bugs.
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Third parties</h2>
    <ul class="ml-6 list-disc flex flex-col gap-1">
      <li>
        Google Sign-In —
        <a class="underline" href="https://policies.google.com/privacy" rel="noreferrer">
          Google Privacy Policy
        </a>
      </li>
      <li>
        Sentry —
        <a class="underline" href="https://sentry.io/privacy/" rel="noreferrer">
          Sentry Privacy Policy
        </a>
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Retention</h2>
    <p>Your data is kept for as long as your account exists. Deleting your account removes it.</p>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Account deletion</h2>
    <p>
      You can delete your account from <strong>Settings</strong> inside the app. A web-based
      deletion flow at <code>/account/delete</code> is also planned and will be linked here once live.
      Deletion removes your account record and associated workout data from our database. Diagnostic data
      submitted to Sentry is retained per Sentry's own retention policy.
    </p>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Children</h2>
    <p>MesoPro is not directed to children under 13 and we do not knowingly collect their data.</p>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-xl font-semibold">Contact</h2>
    <p>
      Questions or requests:
      <a class="underline" href="mailto:{contactEmail}">{contactEmail}</a>
    </p>
  </section>
</article>
