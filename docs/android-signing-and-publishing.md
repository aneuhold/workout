# Android Signing & Publishing

How publishing the android app works.

## Signing

Google Sign-In on Android works only when the **SHA-1 of the key that signed the APK on the device** is registered against an Android OAuth 2.0 Client ID (with `package_name = com.tonyneuhold.mesopro`) in Google Cloud Console ([here is the link to where the keys are entered](https://console.cloud.google.com/auth/clients?project=backend-463900)). Different distribution paths use different keys, so we have to register each one as its own Android OAuth client (Cloud Console allows only one SHA-1 per client).

### The SHA-1 / SHA-256 Keys in play

| Distribution path                           | Key that signs the APK on device                                               | Where to get the SHA-1 / SHA-256                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:android` (per developer)          | That developer's local debug keystore (`~/.android/debug.keystore`)            | `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`                                    |
| `adb install` of locally signed release AAB | Publish keystore                                                               | `keytool -list -v -keystore ~/.android/keystores/mesopro-upload.jks -alias mesopro`                                                                  |
| Play Store install (any track)              | **Google's app signing key** — Play App Signing re-signs your AAB after upload | [Link to the location in the Play Console](https://play.google.com/console/u/0/developers/7096606584485556849/app/4974980926556665079/keymanagement) |

Each of those gets its **own Android OAuth 2.0 client** in Google Cloud, all sharing `package_name = com.tonyneuhold.mesopro`. Name each client descriptively so it's obvious which physical key/machine it belongs to — e.g. `Android Debug Client - Anton Macbook Pro M2`, `Android Play App Signing`, etc. The Cloud Console client list is the registry. The Web client ID is separate from all of these and is what we pass at runtime to `SocialLogin.initialize({ google: { webClientId } })`.

#### Registered Google Play Console Keys

The Google Play Console keys correspond to the local signing key, and are used to actually do an upload. For MesoPro, that is located [here](https://play.google.com/console/u/0/developers/7096606584485556849/android-developer-verification/packages/com.tonyneuhold.mesopro). Note that as of 5/10/2026, the local debug key is also on there, in addition to the real signing key, because Google somehow already had it, and required verification of it + didn't provide a way to remove one. Shouldn't need to add any more keys here though, unless another dev really needs to do uploads there.

### Historical Steps Taken

Generate the publish keystore:

```bash
mkdir -p ~/.android/keystores
keytool -genkey -v \
  -keystore ~/.android/keystores/mesopro-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mesopro
```

Play App Signing enrolls automatically at the first AAB upload, which is what makes Google hold the key that signs installs. Then copy the app signing SHA-1 from Play Console and register it as its own Android OAuth client. Without it, Google Sign-In fails for every Play Store install while working fine locally.

**Back up the file + passwords to a password manager immediately.** Losing it requires Google support to reset. Password is currently held in password manager for the existing one created 5/3/2026.

## Publishing

`pnpm bump`, then merge to `main`. CI builds the signed AAB and uploads it to the track set in `scripts/commands/uploadAndroidRelease/index.ts`. A merge that doesn't change the version deploys the web build only.

### Publishing locally

1. `pnpm bump`
2. `pnpm release:android` (builds, bundles, and uploads in one go)

One-time setup on each machine:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/androidpublisher,https://www.googleapis.com/auth/cloud-platform
```

`--scopes` is required, since the Application Default Credentials defaults cover `cloud-platform` but not `androidpublisher`. `gcloud auth login` does not work in its place, because it writes to a different credential store than ADC reads.

### Historical Steps Taken

CI uploads as a service account on `backend-463900`. These are the commands that produce it, kept in case it ever needs rebuilding.

```bash
gcloud config set project backend-463900
gcloud services enable androidpublisher.googleapis.com

gcloud iam service-accounts create mesopro-play-publisher \
  --display-name="MesoPro Play Publisher"

# Let this repo impersonate it through the existing `github-pool`,
# which is shared with gcloud-backend and was not created for this.
gcloud iam service-accounts add-iam-policy-binding \
  mesopro-play-publisher@backend-463900.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/926119935605/locations/global/workloadIdentityPools/github-pool/attribute.repository/aneuhold/workout"
```

Then invite `mesopro-play-publisher@backend-463900.iam.gserviceaccount.com` in Play Console with release permission for `com.tonyneuhold.mesopro`. That invite is what authorizes uploads, which is why the account needs no GCP project roles. It also has no JSON key, since CI authenticates through Workload Identity Federation. See [docs here](https://docs.cloud.google.com/docs/authentication/application-default-credentials).

Two repository secrets are also set in GitHub, so CI can sign with the publish keystore:

| Secret                      | Source                                              |
| --------------------------- | --------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | `base64 -i ~/.android/keystores/mesopro-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password from the password manager     |

Base64 is only an encoding step, since GitHub secrets hold text and a keystore is binary. Setting one without the other fails the build rather than quietly producing an unsigned bundle.

## Troubleshooting

The error you'll see when SHA-1 is wrong/missing:

```
GetCredentialCancellationException: [16] Account reauth failed
```

`[16]` is the canonical code for "package + SHA-1 doesn't match a registered Android OAuth client". The `@capgo/capacitor-social-login` plugin re-throws this as `code: 'USER_CANCELLED'` with message `"Google Sign-In cancelled by user"`, which is misleading — the user didn't cancel.

To see the underlying exception: Android Studio → Logcat → filter `package:com.tonyneuhold.mesopro` and search `Google` while tapping the sign-in button.

## Adding a new Developer

1. They run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1` on their machine.
2. In Google Cloud Console → Credentials → Create credentials → OAuth client → Android ([link to the right location here](https://console.cloud.google.com/auth/clients?project=backend-463900)).
3. Name: `Android Debug Client - <Their Name / Machine>`.
4. Package name: `com.tonyneuhold.mesopro`. SHA-1: theirs. Save.
5. They can now run `pnpm dev:android` and Google Sign-In works.

## References

- [Client Authentication for Google Play services](https://developers.google.com/android/guides/client-auth) — official statement that SHA-1 is required for Google Sign-In
- [Sign in with Google via Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg) — the API we use under the hood
- [Credential Manager troubleshooting](https://developer.android.com/identity/sign-in/credential-manager-troubleshooting-guide) — exception types (does not document `[16]` directly)
- [Play App Signing overview](https://support.google.com/googleplay/android-developer/answer/9842756) — why Google holds the signing key
- [@capgo/capacitor-social-login Android setup](https://capgo.app/docs/plugins/social-login/google/android/) — plugin-specific notes
