<!--
  @component

  The Play Store listing's feature graphic: the logo, wordmark, and tagline on
  the brand gradient. Sized for a 512×250 viewport, which the asset pipeline
  captures at 2× as the required 1024×500 image.
-->
<script lang="ts">
  import logoUrl from '../../../docs/officialAssets/logo-dark-square.svg';
</script>

<div class="feature-graphic flex h-screen w-screen items-center gap-7 px-10 antialiased">
  <img class="logo size-35 shrink-0" src={logoUrl} alt="MesoPro logo" />
  <div class="flex flex-col gap-2.25">
    <h1 class="wordmark m-0 text-[4.125rem] leading-none font-extrabold tracking-[-0.04em]">
      MesoPro
    </h1>
    <p
      class="tagline m-0 text-[0.9375rem] leading-tight font-medium tracking-[-0.01em] whitespace-nowrap"
    >
      Evidence-based hypertrophy training
    </p>
  </div>
</div>

<style>
  /* Brand gradient colors, matching the logo SVGs in docs/officialAssets. */
  .feature-graphic {
    --brand-dark: #103028;
    --brand-darkest: #06120f;
    --brand-light: #cef0d8;
    --brand-mid: #2bba85;

    background:
      radial-gradient(
        ellipse at 30% 50%,
        rgb(from var(--brand-dark) r g b / 25%) 0%,
        transparent 60%
      ),
      radial-gradient(ellipse at 70% 50%, var(--brand-dark) 0%, var(--brand-darkest) 75%);
  }
  .logo {
    filter: drop-shadow(0 6px 16px rgb(0 0 0 / 45%));
  }
  .wordmark {
    background: linear-gradient(180deg, var(--brand-light) 0%, var(--brand-mid) 100%);
    background-clip: text;
    color: transparent;
  }
  .tagline {
    color: rgb(from var(--brand-light) r g b / 80%);
  }
</style>
