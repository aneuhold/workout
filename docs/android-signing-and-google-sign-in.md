# Android Signing & Google Sign-In

How signing keys, SHA-1 fingerprints, and Google OAuth clients fit together for this app on Android.

## TL;DR

Google Sign-In on Android works only when the **SHA-1 of the key that signed the APK on the device** is registered against an Android OAuth 2.0 Client ID (with `package_name = com.tonyneuhold.mesopro`) in Google Cloud Console — same project as our Web `GOOGLE_CLIENT_ID`. Different distribution paths use different keys, so we have to register each one as its own Android OAuth client (Cloud Console allows only one SHA-1 per client).

## The SHA-1s in play

| Distribution path                           | Key that signs the APK on device                                               | Where to get the SHA-1                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:android` (per developer)          | That developer's local debug keystore (`~/.android/debug.keystore`)            | `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` |
| `adb install` of locally signed release AAB | Local upload keystore                                                          | `keytool -list -v -keystore ~/.android/keystores/mesopro-upload.jks -alias mesopro`                               |
| Play Store install (any track)              | **Google's app signing key** — Play App Signing re-signs your AAB after upload | Play Console → Test and release → Setup → App Integrity → "App signing key certificate"                           |

Each of those gets its **own Android OAuth 2.0 client** in Google Cloud, all sharing `package_name = com.tonyneuhold.mesopro`. Name each client descriptively so it's obvious which physical key/machine it belongs to — e.g. `Android Debug Client - Anton Macbook Pro M2`, `Android Play App Signing`, etc. The Cloud Console client list is the registry.

The Web client ID is separate from all of these and is what we pass at runtime to `SocialLogin.initialize({ google: { webClientId } })`.

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

## End-to-end sequence for shipping

1. **Local dev**: create an Android OAuth client (e.g. `Android Debug Client - <your machine>`) with your debug keystore SHA-1. Sign-In works in `pnpm dev:android`.
2. **Create the Play Console app** and enroll in Play App Signing (let Google generate the app signing key — easiest path).
3. Copy the **App signing key SHA-1** from Play Console → App Integrity. Create another Android OAuth client (e.g. `Android Play App Signing`) with that SHA-1.
4. Build a signed release AAB locally with the upload keystore.
5. Upload the AAB to the **internal testing track**. Google re-signs with the app signing key.
6. Install from the internal track on a test device. Sign-In works because step 3 registered the right SHA-1.
7. Promote to production when ready.

## Gotchas

- **AAB requires Play App Signing.** You can't opt out, so the SHA-1 that matters for end users will always be Google's app signing key, not yours.
- **Upload key SHA-1 ≠ App signing key SHA-1.** Registering only the upload key SHA-1 lets `adb install` of your local AAB work, but **all Play Store installs will fail Sign-In with `[16] Account reauth failed`**.
- **One Android OAuth client = one SHA-1.** Cloud Console doesn't let you list multiple fingerprints inside a single client. Create a separate client for each SHA-1, all with the same package name. (Firebase Console allows multiple SHA-1s per app, but that's a different surface — we use Cloud Console direct.)
- **Wrong client type.** The `webClientId` we pass at runtime must be a **Web application** OAuth client. The Android clients only exist for Google's package + SHA-1 lookup; we never reference them in code.
- **OAuth consent screen "Testing" mode** caps sign-ins at 100 users (test users you explicitly add). Switch the consent screen to **In production** to lift this — basic Sign-In scopes (`openid email profile`) don't need OAuth verification.
- **Propagation delay.** After adding a SHA-1 in Google Cloud, give it a minute or two before testing. No rebuild needed.

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
