<script lang="ts">
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import AlertTitle from '$ui/Alert/AlertTitle.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Switch from '$ui/Switch/Switch.svelte';

  let switchValue = $state(false);
  let inputValue = $state('');
</script>

<div class="container mx-auto max-w-6xl space-y-8 p-8">
  <div class="space-y-2">
    <h1 class="text-4xl font-bold tracking-tight">shadcn-svelte Component Showcase</h1>
    <p class="text-muted-foreground">
      Preview of installed components with the current Tailwind v4 theme
    </p>
  </div>

  <!-- Buttons Section -->
  <Card>
    <CardHeader>
      <CardTitle>Buttons</CardTitle>
      <CardDescription>Button variants and sizes</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-4">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </CardContent>
  </Card>

  <!-- Badges Section -->
  <Card>
    <CardHeader>
      <CardTitle>Badges</CardTitle>
      <CardDescription>Badge variants for labels and tags</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-3">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </CardContent>
  </Card>

  <!-- Form Elements Section -->
  <Card>
    <CardHeader>
      <CardTitle>Form Elements</CardTitle>
      <CardDescription>Input fields, labels, and switches</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-6">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" bind:value={inputValue} />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter your password" />
        </div>

        <div class="flex items-center space-x-2">
          <Switch id="notifications" bind:checked={switchValue} />
          <Label for="notifications">
            Enable notifications {switchValue ? '(On)' : '(Off)'}
          </Label>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Alerts Section -->
  <Card>
    <CardHeader>
      <CardTitle>Alerts</CardTitle>
      <CardDescription>Alert messages with different styles</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <Alert>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            This is a default alert to display general information.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            This is a destructive alert to display error messages.
          </AlertDescription>
        </Alert>
      </div>
    </CardContent>
  </Card>

  <!-- Cards showcase -->
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>Card 1</CardTitle>
        <CardDescription>A simple card example</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          Cards are great for organizing content into distinct sections.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Card 2</CardTitle>
        <CardDescription>Another card with content</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <Badge>Featured</Badge>
          <p class="text-sm">This card includes a badge and multiple elements.</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Card 3</CardTitle>
        <CardDescription>Card with action</CardDescription>
      </CardHeader>
      <CardContent>
        <Button class="w-full">Click me</Button>
      </CardContent>
    </Card>
  </div>

  <!-- Color Theme Preview -->
  <Card>
    <CardHeader>
      <CardTitle>Theme Colors</CardTitle>
      <CardDescription>Preview of CSS custom properties from global.css</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="space-y-2">
          <div class="h-16 rounded-md bg-primary"></div>
          <p class="text-sm font-medium">Primary</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md bg-secondary"></div>
          <p class="text-sm font-medium">Secondary</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md bg-accent"></div>
          <p class="text-sm font-medium">Accent</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md bg-destructive"></div>
          <p class="text-sm font-medium">Destructive</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md border bg-muted"></div>
          <p class="text-sm font-medium">Muted</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md border bg-card"></div>
          <p class="text-sm font-medium">Card</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md border bg-popover"></div>
          <p class="text-sm font-medium">Popover</p>
        </div>
        <div class="space-y-2">
          <div class="h-16 rounded-md border bg-background"></div>
          <p class="text-sm font-medium">Background</p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
