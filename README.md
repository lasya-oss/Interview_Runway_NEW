# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Google Workspace Sign-In

The deployed site is publicly reachable at the hosting layer and protected by
app-owned Google Workspace authentication.

- Google Auth Platform is configured with an Internal audience for the
  `vividlabsai.com` organization.
- The server independently verifies the Google ID token audience, issuer,
  verified email, hosted-domain claim, and `@vividlabsai.com` email suffix.
- A signed, HTTP-only, same-site session cookie protects browser pages and API
  routes. Paddle's signed webhook route remains public.
- `proxy.ts` redirects anonymous page requests to `/sign-in` and rejects
  anonymous API requests.

Required runtime values are documented in `.env.example`. Store the production
session secret in Sites as a secret rather than committing it.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Phase 3 Qualification Notifications

Qualification applications are stored in D1 before any notification is attempted. The provider-neutral notification adapter activates when these runtime values are configured:

- `QUALIFICATION_NOTIFICATION_WEBHOOK_URL`: HTTPS endpoint that accepts the structured application payload.
- `QUALIFICATION_NOTIFICATION_EMAIL`: recipient email included in that payload.
- `QUALIFICATION_NOTIFICATION_WEBHOOK_TOKEN`: optional bearer token for the endpoint.

Without these values, applications remain safely stored with a pending notification status. The adapter can later be replaced with the selected email provider without changing the public form or stored records.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
