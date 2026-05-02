# 🏋️‍♀️ MesoPro 🏋️‍♀️

A workout tracking app.

## Architecture

### Styling

This was done originally with [this variant of shadcn](https://ui.shadcn.com/create?base=base&baseColor=zinc&theme=emerald&iconLibrary=tabler&template=start).

### Logging

Logging is done via Sentry. Configuration is setup in `hooks.client.ts` primarily.

### Auth

Sign-in with Google is configured via the [backend project and the OAuth configuration here in Google Cloud](https://console.cloud.google.com/auth/overview?project=backend-463900).

## Development

To start working on the project simply run:

- `pnpm dev` then navigate to the URL it shows in the terminal

### To use the backend locally

Modify the [localOverride.ts](src/util/localOverride.ts) file so that it is set to true.

### Adding new Components

Checkout the [shadcn-svelte site for what is available](https://shadcn-svelte.com/docs/components), and then run some variation of:

```
pnpm dlx shadcn-svelte@latest add COMPONENT-NAME
```

For the actual reference to the shadcn components, see them [here](https://ui.shadcn.com/docs/components).

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

<details>
<summary><h3 style="display: inline">Android Development</h3></summary>

#### Commands

- `pnpm dev:android` — runs `pnpm build`, syncs the build into the Android project (`cap sync android`), then launches it on a running emulator or connected device (`cap run android`).
- `pnpm open:android` — opens the Android project in Android Studio for native-side work (Gradle, manifest, signing, plugin config).

#### Testing on an emulator / debugging

1. From the repo root, run `pnpm dev:android` and wait for the app to appear on the emulator.
2. On your Mac, open Chrome and navigate to `chrome://inspect/#devices` This will bring up a view like so:

![alt text](docs/images/chrome-inspect-devices.png)

3. Interact with the app on the emulator while watching DevTools — JS errors, failed requests, and `console.*` output all surface there.
4. After making code changes, run `pnpm reload:android` to rebuild and reinstall

</details>
