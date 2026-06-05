# GNP Design Portal

A web portal where customers configure a barndominium / post-frame building
(size, roof, doors, windows, porches, interior, finishes), get an instant
ballpark quote, and have the design submitted as a structured **engineering
package** routed to a licensed Professional Engineer for site-specific
wind-load sealing.

> **Non-negotiable:** the portal *prepares* the submittal package; a licensed
> PE *seals* it. The portal **never** produces stamped or permit-ready plans
> on its own.

## Quick start (Windows)

```powershell
# install dependencies
npm install

# create local DB + generate Prisma client
npx prisma migrate dev --name init

# copy env template, fill in anything you want set locally
copy .env.example .env

# run the dev server
npm run dev
```

Open <http://localhost:3000> in a browser.

## Where to edit what

The owner edits configuration, not components. Three files cover ~everything:

| Edit | File |
|------|------|
| Pricing rates | `lib/config/pricing.config.ts` |
| County wind-speed table | `lib/config/wind-speeds.ts` |
| Disclaimer / legal text | `lib/config/disclaimer.ts` |
| Brand info + PE contact | `lib/config/brand.ts` (+ `.env`) |
| DB schema | `prisma/schema.prisma` |

## Environment variables

Set in `.env` (gitignored). Template lives in `.env.example`.

| Variable             | Purpose                                          |
|----------------------|--------------------------------------------------|
| `DATABASE_URL`       | SQLite (dev) or Postgres (prod) connection      |
| `N8N_WEBHOOK_URL`    | Where the submit flow POSTs the engineering package |
| `PE_CONTACT_NAME`    | Display name of the licensed PE                  |
| `PE_CONTACT_EMAIL`   | PE email (included in the submittal payload)     |
| `PE_CONTACT_PHONE`   | PE phone                                          |
| `PE_LICENSE_NUMBER`  | PE license number                                |

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Prisma** + **SQLite** (Postgres-ready: change provider + URL)

## Architecture

```
app/                    Next.js routes (wizard, jobs list, confirmation, api)
lib/
  types/                BuildingConfig (single source of truth)
  config/               Owner-editable constants
  services/             site-hazard, quote-engine
  db.ts                 Prisma singleton
prisma/
  schema.prisma         Job model
  dev.db                Local SQLite (gitignored)
```

## Phase roadmap

- **Phase 1 (MVP)** — wizard, quote engine, submit flow, jobs list. *Currently building.*
- **Phase 2** — master library of PE-pre-blessed envelopes · PDF spec sheets · customer accounts.
- **Phase 3** — 3D preview (three.js) · LLM-generated scope narrative.

## Related projects

- `../southern-barn-builders/` — the public GNP marketing site + employee
  portal (Cloudflare Pages, static + functions). Separate codebase + deploy.

## Legal / engineering boundary

GNP Steel Trusses supplies engineered + sealed plan packages and the steel
truss / kit components. **Erection of habitable structures must be performed
by a licensed builder/contractor in the project state.** The PE seal is
site-specific and human; the portal's automation does **not** perform the
engineering.
