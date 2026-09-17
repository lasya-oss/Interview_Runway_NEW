# Google OAuth and Gmail secret rotation

Scope: replace the exposed Google OAuth client secret and Gmail refresh token without committing either value. The public OAuth client ID is not a secret.

## Exact references

| Credential | GitHub staging environment secret | Worker binding | Code consumer |
| --- | --- | --- | --- |
| OAuth client secret | `STAGING_GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | `app/lib/meeting-copilot-profile-gmail.ts` |
| Gmail refresh token | `STAGING_GOOGLE_GMAIL_REFRESH_TOKEN` | `GOOGLE_GMAIL_REFRESH_TOKEN` | `app/lib/meeting-copilot-profile-gmail.ts` |

The staging deployment workflow reads both GitHub secrets twice: validation and the atomic Wrangler `--secrets-file` deployment in `.github/workflows/deploy.yml`. `.env.example` documents only empty local names. Tests use non-secret fixture strings.

`GOOGLE_CLIENT_ID` is currently `773066800394-e7t7o8l73nbja6srkrqil4ktj449dc7o.apps.googleusercontent.com` in `wrangler.staging.jsonc` and `.env.example`. It is used by Google sign-in, the Human Calibration interactive Gmail authorization, and the Meeting Copilot Gmail refresh flow. `GOOGLE_GMAIL_SENDER_EMAIL` and `MEETING_COPILOT_PROFILE_RECIPIENTS` are separate values and do not need rotation unless they were also exposed.

Production is deployed through the existing OpenAI Sites project `appgprj_6a5b14ec3d048191aaa800e92310a833`, whose runtime binding names are also `GOOGLE_CLIENT_SECRET` and `GOOGLE_GMAIL_REFRESH_TOKEN`. The repository has no GitHub `production` environment, and its unused manual Worker job does not currently inject Gmail credentials; do not treat that job as the production rotation path.

## Rotation — under 10 minutes

1. In Google Cloud Console, open **Google Auth Platform → Clients** in the project that owns the client ID above. Confirm `https://interviewrunway.com` and `https://interview-runway-staging.ir-staging-pratheep211088.workers.dev` are authorized JavaScript origins. Because customer sign-in is public, confirm the sign-in audience allows external Google accounts; keep Vivid Labs Gmail sending restricted by Workspace policy and the app's server-side domain checks.
2. Open the OAuth client, create a new client secret, copy it once, and leave the exposed secret active only until both environments have been updated.
3. Open Google OAuth Playground, enable **Use your own OAuth credentials**, enter the same client ID and the new secret, then authorize only `https://www.googleapis.com/auth/gmail.send` as the configured Vivid Labs sender account. Exchange the authorization code and copy the new refresh token.
4. In GitHub → `vividlabsai/InterviewRunway` → Settings → Environments → `staging` → Environment secrets, replace:
   - `STAGING_GOOGLE_CLIENT_SECRET`
   - `STAGING_GOOGLE_GMAIL_REFRESH_TOKEN`
5. In the production Sites project runtime settings for `appgprj_6a5b14ec3d048191aaa800e92310a833`, replace the secret bindings:
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_GMAIL_REFRESH_TOKEN`
6. Rerun the latest successful staging `Deploy Workers` workflow. Verify the workflow's secret validation and deployment steps pass; then save a Meeting Copilot profile and confirm the D1 delivery row becomes `sent` with a Gmail message ID.
7. Release production through the established Sites path, verify one production delivery, then revoke/delete the exposed OAuth client secret and revoke the exposed refresh token in the Google account's third-party access controls.

Never paste either new value into chat, a shell command, a commit, Wrangler vars, or a `NEXT_PUBLIC_*` variable.
