<!--
  @component

  Invitation to open demo mode, sized to sit beneath the login card. Keeps the
  demo out of the credential flow so it reads as an alternative to signing in
  rather than another way to do it.
-->
<script lang="ts">
  import demoModeService from '$services/DemoMode.service';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
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
    <Button variant="outline" class="w-full" onclick={() => demoModeService.enter()}>
      Open the demo
    </Button>
  </CardContent>
</Card>
