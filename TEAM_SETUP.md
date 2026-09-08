# AstroGuide team setup

## What is in this repository

This is the React/Vinext frontend, Three.js explorer, observing planner, and a small Cloudflare Worker API for two demo accounts and their separate D1 catalogs. The Java Spring Boot backend planned for the course has not been implemented.

The repository includes the source, astronomy catalogs, credited image assets, tests, database schema and migrations, and project history. It excludes dependencies, builds, local database contents, passwords, and local secret files.

## Run locally

1. Install Node.js 24 LTS and pnpm. Clone this repository and open its root folder.
2. Run `pnpm install --frozen-lockfile`.
3. Obtain the development `DEMO_PASSWORD_HASHES` value from the project owner through a private channel. Copy the shape in `.env.example` to a local `.dev.vars` file, using real generated values. These are salted password verifiers, not plain passwords. Never commit `.dev.vars`.
4. Before signing into a fresh local installation, initialize its local D1 database. Create an ignored file `outputs/db-local.json` containing:

```json
{
  "name": "astroguide-local",
  "compatibility_date": "2026-05-15",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "site-creator-d1",
    "database_id": "00000000-0000-4000-8000-000000000000"
  }]
}
```

Run this **once for a fresh local database**:

```sh
pnpm exec wrangler d1 execute DB --local --config outputs/db-local.json --persist-to .wrangler/state --file drizzle/0000_cheerful_ben_grimm.sql
```

The all-zero ID is the existing local development placeholder, not a Cloudflare production database ID. Do not use `--remote` with it. Do not repeat the initial table-creation script against an initialized database.

5. Run `pnpm dev` and open the Local URL it prints. Each developer has their own local database; these are not the eventual shared hosted account catalogs.

## Checks before a pull request

```sh
pnpm exec tsc --noEmit
node research/verify.mjs
pnpm build
```

The account integration test requires a running local app and the demo password supplied through the `ASTRO_DEMO_PASSWORD` environment variable. Then run `node research/verify-accounts.mjs`. It creates disposable records in the local test database. Never put the password in a commit or an issue.

For observing tests:

```sh
pnpm exec esbuild lib/astro/observing.ts --bundle --platform=node --format=esm --external:astronomy-engine --outfile=outputs/observing-test.mjs
node research/verify-observing.mjs
```

## Work together

- Make a branch for each change and open a pull request into `main`.
- Keep one reviewer on changes before merging and describe how you checked the behavior.
- Use GitHub Issues to assign features and bugs. Avoid committing runtime secrets, account records, or database files.
- Coordinate database changes: applied migrations are immutable; generate a new migration for later changes.

## Cloudflare hosting

The app uses the account's Workers Free plan with an included D1 database. Do not upgrade the plan or enable paid add-ons. Free quotas can limit availability; they do not require a paid upgrade to keep the project configured.

The Cloudflare configuration is `wrangler.cloudflare.jsonc`. Build with `pnpm build:cloudflare`; deploy the generated output with `pnpm exec wrangler deploy --config dist/server/wrangler.json`.

For GitHub-connected Workers Builds, set the build command to `pnpm build:cloudflare` and the deploy command to `pnpm exec wrangler deploy --config dist/server/wrangler.json`. Run database migrations separately when the schema changes:

```sh
pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.cloudflare.jsonc
```

Set `DEMO_PASSWORD_HASHES` as a Worker secret through Cloudflare. Keep its value out of source control and ordinary configuration. The deployed database starts separately from local development databases. Shared account credentials give access to that account's catalog.

Both `pnpm build` and `pnpm build:cloudflare` produce the team's Cloudflare deployment. `pnpm build:sites` retains the original preview build when needed.
