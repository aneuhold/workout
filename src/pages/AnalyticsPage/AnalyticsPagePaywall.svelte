<!--
  @component

  Paywall for the MesoPro Supporter subscription. Describes what the
  subscription includes and starts the purchase.
-->
<script lang="ts">
  import SupporterSubscribeButton from '$components/SupporterSubscribeButton/SupporterSubscribeButton.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardFooter from '$ui/Card/CardFooter.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import sharedTextConstants from '$util/sharedTextConstants';
</script>

<Card>
  <CardHeader>
    <CardTitle>MesoPro Supporter</CardTitle>
    <CardDescription>Subscribe to unlock performance analytics.</CardDescription>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <ul class="list-disc pl-5 text-sm">
      <li>Performance analytics across your training history</li>
      <li>Direct support for ongoing MesoPro development</li>
    </ul>
    <p class="text-lg font-semibold">{sharedTextConstants.supporterPrice}</p>
  </CardContent>
  <CardFooter>
    <SupporterSubscribeButton />
  </CardFooter>
</Card>
