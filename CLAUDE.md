@AGENTS.md

# GNP Design Portal — project context

A web portal where customers configure a barndominium / post-frame building
(size · roof · foundation · doors · windows · porches · interior · finishes),
get an **instant ballpark quote**, and submit the design as a structured
**engineering submittal package** that gets routed (via n8n webhook) to a
licensed Professional Engineer for site-specific wind-load sealing.

Sibling project: `../southern-barn-builders/` (the public GNP marketing site
+ employee portal on Cloudflare Pages). Separate codebase, separate deploy.

## Non-negotiable principle

The portal **prepares** the engineering submittal package — a licensed PE
**seals** it. Never use the words *"approved"*, *"stamped"*, *"permit-ready"*,
or *"wind-rated"* as a property the portal produces. PE seal is site-specific
and human. All customer-facing wording lives in `lib/config/disclaimer.ts`.

## Where to edit what (config is separated from components)

| Edit | Where |
|------|-------|
| Pricing rates | `lib/config/pricing.config.ts` |
| County wind-speed table | `lib/config/wind-speeds.ts` |
| Disclaimer / legal copy | `lib/config/disclaimer.ts` |
| Brand info + PE contact | `lib/config/brand.ts` (+ `.env`) |
| DB schema | `prisma/schema.prisma` |

## File map (Phase 1)

```
app/                Next.js App Router (wizard / jobs list / confirmation / api)
lib/
  types/            BuildingConfig + JobStatus — single source of truth
  config/           Owner-editable constants (pricing/wind/disclaimer/brand)
  services/         site-hazard.ts (wind lookup) · quote-engine.ts (pure fn)
  db.ts             Prisma singleton (Next.js pattern)
prisma/
  schema.prisma     Job model + SQLite (provider-swap for Postgres)
  dev.db            Local SQLite database (gitignored)
.env / .env.example Env vars (DATABASE_URL, N8N_WEBHOOK_URL, PE_CONTACT_*)
```

## Build / dev (Windows-primary)

```powershell
npm install
npx prisma migrate dev --name init   # create local DB + generate client
npm run dev                          # http://localhost:3000
npx prisma studio                    # inspect the SQLite DB in a browser
```

## Build chunks (Phase 1, building in order)

- **(a)** Foundation — types/schema/config/services *(this layer)*
- **(b)** Wizard shell + Steps 1-3 (Shell / Roof / Foundation) + live-quote sidebar
- **(c)** Wizard Steps 4-7 (Openings / Additions / Interior / Finishes)
- **(d)** Site/hazard step + county wind lookup + review screen
- **(e)** Submit → DB persist + n8n webhook + Jobs list page

**Phase 2 (TODO):** master library of PE-pre-blessed envelopes · PDF spec sheets · customer accounts.
**Phase 3 (TODO):** 3D preview (three.js) · LLM-generated scope narrative.

## Next.js 16 caveat (per AGENTS.md, imported above)

This Next.js may differ from the version in your training data. Before
writing new route / server-component / API patterns, consult
`node_modules/next/dist/docs/`. Heed deprecation notices.
