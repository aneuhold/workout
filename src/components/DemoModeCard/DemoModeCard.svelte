<!--
  @component

  Invitation to open demo mode, sized to sit beneath the login card. Keeps the
  demo out of the credential flow so it reads as an alternative to signing in
  rather than another way to do it.
-->
<script lang="ts">
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import navInfo from '$util/navInfo';
</script>

<Card class="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Just looking?</CardTitle>
    <CardDescription>
      Explore the full app with a sample training history. Nothing is saved. Reloading keeps your
      place, and the demo ends when you close the tab.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <!--
      The page is already loaded, so LocalData has chosen its backend. Reloading into ?demo makes
      it choose demo storage at startup and load the seed data.
    -->
    <Button
      variant="outline"
      class="w-full"
      href={`${navInfo.home.url}?demo`}
      data-sveltekit-reload
    >
      Open the demo
    </Button>
  </CardContent>
</Card>
