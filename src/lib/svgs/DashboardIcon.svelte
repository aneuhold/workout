<script lang="ts">
  let { size = 48 }: { size?: number } = $props();
  let sizePx = $derived(`${size}px`);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  style:width={sizePx}
  style:height={sizePx}
  id="svg"
  version="1.1"
  viewBox="0 0 100 100"
  x="0px"
  y="0px"
>
  <defs>
    <clipPath id="circleClip">
      <circle cx="50" cy="50" r="50" />
    </clipPath>
  </defs><circle
    clip-path="url(#circleClip)"
    cx="50"
    cy="50"
    fill="#00000"
    r="50"
    stroke="#098e1f"
    stroke-width="14"
  />
  <text fill="#098e1f" font-size="50" font-weight="600" text-anchor="middle" x="50" y="68">
    <tspan dy="0" x="50">⚙️</tspan>
  </text>
</svg>
