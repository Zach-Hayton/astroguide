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

## Next: hosting in the team's Cloudflare account

The current `.openai/hosting.json` and Sites plugin refer to the existing private preview service. Pushing this repository to GitHub does **not** deploy a new Cloudflare site, move a database, or grant teammates access to that private preview.

Before enabling automatic production deployment, we need to:

1. Configure a team-owned Worker and adapt the build configuration for direct Cloudflare deployment while preserving the current preview setup.
2. Create a real D1 database in that Cloudflare account and bind it as `DB`.
3. Apply the committed schema migrations to that database.
4. Set `DEMO_PASSWORD_HASHES` as a Worker secret through Cloudflare; never place the real value in GitHub source or ordinary configuration.
5. Connect the private GitHub repository to Workers Builds and choose build/deployment commands after validating that direct configuration.
6. Verify HTTPS sign-in, persistence, logout, and separation of user1/user2 catalogs on the hosted deployment. Test free-tier CPU limits before relying on a zero-cost plan.

The new database starts empty unless we explicitly migrate records. Shared demo credentials identify a demo account, not an individual teammate. Anyone given an account's credentials can access its catalog.

References: [Workers GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [D1 setup](https://developers.cloudflare.com/d1/get-started/), [Workers build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
