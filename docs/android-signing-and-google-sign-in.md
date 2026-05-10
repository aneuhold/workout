# Android Signing & Google Sign-In

How signing keys, SHA-1 / SHA-256 fingerprints, and Google OAuth clients fit together for this app on Android.

## TL;DR

Google Sign-In on Android works only when the **SHA-1 of the key that signed the APK on the device** is registered against an Android OAuth 2.0 Client ID (with `package_name = com.tonyneuhold.mesopro`) in Google Cloud Console — same project as our Web `GOOGLE_CLIENT_ID`. Different distribution paths use different keys, so we have to register each one as its own Android OAuth client (Cloud Console allows only one SHA-1 per client).

## The SHA-1 / SHA-256 Keys in play

| Distribution path                           | Key that signs the APK on device                                               | Where to get the SHA-1 / SHA-256                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:android` (per developer)          | That developer's local debug keystore (`~/.android/debug.keystore`)            | `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` |
| `adb install` of locally signed release AAB | Local upload keystore                                                          | `keytool -list -v -keystore ~/.android/keystores/mesopro-upload.jks -alias mesopro`                               |
| Play Store install (any track)              | **Google's app signing key** — Play App Signing re-signs your AAB after upload | Play Console → Test and release → Setup → App Integrity → "App signing key certificate"                           |

Each of those gets its **own Android OAuth 2.0 client** in Google Cloud, all sharing `package_name = com.tonyneuhold.mesopro`. Name each client descriptively so it's obvious which physical key/machine it belongs to — e.g. `Android Debug Client - Anton Macbook Pro M2`, `Android Play App Signing`, etc. The Cloud Console client list is the registry.

The Web client ID is separate from all of these and is what we pass at runtime to `SocialLogin.initialize({ google: { webClientId } })`.

## Google Play Console Keys

The Google Play Console keys correspond to the local signing key, and are used to actually do an upload. For MesoPro, that is located [here](https://play.google.com/console/u/0/developers/7096606584485556849/android-developer-verification/packages/com.tonyneuhold.mesopro). Note that as of 5/10/2026, the local debug key is also on there, in addition to the real signing key, because Google somehow already had it, and required verification of it + didn't provide a way to remove one. Shouldn't need to add any more keys here though, unless another dev really needs to do uploads there.

## Local upload keystore

Generated once and kept outside the repo. Lives at:

```
~/.android/keystores/mesopro-upload.jks
```

Naming: `<app>-upload.jks`. The `-upload` suffix makes it clear this signs uploads to Play, not the bytes on user devices (Google's app signing key does that).

Generate it (if not done):

```bash
mkdir -p ~/.android/keystores
keytool -genkey -v \
  -keystore ~/.android/keystores/mesopro-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mesopro
```

**Back up the file + passwords to a password manager immediately.** Losing the upload key requires Google support to reset.

Password is currently held in password manager for the existing one created 5/3/2026.

## Adding a new developer

1. They run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1` on their machine.
2. In Google Cloud Console → Credentials → Create credentials → OAuth client → Android ([link to the right location here](https://console.cloud.google.com/auth/clients?project=backend-463900)).
3. Name: `Android Debug Client - <Their Name / Machine>`.
4. Package name: `com.tonyneuhold.mesopro`. SHA-1: theirs. Save.
5. They can now run `pnpm dev:android` and Google Sign-In works.

## Diagnosing failures

The error you'll see when SHA-1 is wrong/missing:

```
GetCredentialCancellationException: [16] Account reauth failed
```

`[16]` is the canonical code for "package + SHA-1 doesn't match a registered Android OAuth client". The `@capgo/capacitor-social-login` plugin re-throws this as `code: 'USER_CANCELLED'` with message `"Google Sign-In cancelled by user"`, which is misleading — the user didn't cancel.

To see the underlying exception: Android Studio → Logcat → filter `package:com.tonyneuhold.mesopro` and search `Google` while tapping the sign-in button.

## References

- [Client Authentication for Google Play services](https://developers.google.com/android/guides/client-auth) — official statement that SHA-1 is required for Google Sign-In
- [Sign in with Google via Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg) — the API we use under the hood
- [Credential Manager troubleshooting](https://developer.android.com/identity/sign-in/credential-manager-troubleshooting-guide) — exception types (does not document `[16]` directly)
- [Play App Signing overview](https://support.google.com/googleplay/android-developer/answer/9842756) — why Google holds the signing key
- [@capgo/capacitor-social-login Android setup](https://capgo.app/docs/plugins/social-login/google/android/) — plugin-specific notes
