# 🏋️‍♀️ MesoPro 🏋️‍♀️

A workout tracking app.

### Logging

Logging is done via Sentry. Configuration is setup in `hooks.client.ts` primarily.

## Developing

To start working on the project simply run:

- `pnpm dev` then navigate to the URL it shows in the terminal

### To use the backend locally

Modify the [localOverride.ts](src/util/localOverride.ts) file so that it is set to true.

### Adding new Components

Checkout the [shadcn-svelte site for what is available](https://shadcn-svelte.com/docs/components), and then run some variation of:

```
pnpm dlx shadcn-svelte@latest add COMPONENT-NAME
```

### Icons

Icons are from [Tabler here](https://tabler.io/icons). Just import them from the `@tabler/icons-svelte` package.

### Adding new Routes

- Copy an existing route folder and modify

The reason that the `pageInfo.ts` files are separate and not done in the module context is that the module context is only available once the component is loaded for the first time. Because pageInfo is needed everywhere, it needs to be a separate file.

### Building

To create a production version of the app:

```bash
pnpm build
```
