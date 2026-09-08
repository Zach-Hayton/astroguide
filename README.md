# AstroGuide

An astronomy explorer and observing planner for Five Fish / CSI 3471.

Team members: Zach Hayton

## Features

- Interactive solar-system and deep-space views, with cinematic and true-scale modes.
- NASA planetary textures, 10,426 catalog stars, and all 88 constellations.
- Light-travel playback with adjustable speed.
- An observing planner with city search, optional device location, horizon charts, and upcoming Moon phases.
- Personal catalogs with saved discoveries, notes, and observation plans.
- Scientific sources, image credits, and model limitations on the Science page.

## Development

Use Node.js 24 and pnpm. See [TEAM_SETUP.md](TEAM_SETUP.md) for database setup and deployment.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
node research/verify.mjs
pnpm build:cloudflare
```

## Architecture

React and Vinext provide the interface and server routes. Three.js renders the explorer with floating-origin coordinates. Astronomy Engine calculates planetary positions and observing directions. Cloudflare Workers hosts the app; D1 stores account catalogs and sessions. Guest catalogs remain in browser storage.

The two shared project accounts use salted PBKDF2 password verifiers supplied through the `DEMO_PASSWORD_HASHES` Worker secret. Passwords and local configuration must never be committed. Sessions use random tokens stored as hashes, HttpOnly cookies, expiration, and logout revocation. Catalog writes require a valid session and matching origin.

The Java Spring Boot, DAO, and Derby course backend remains a separate planned integration; the current server is a Cloudflare Worker.

## Data and credits

HYG v4.0 by David Nash / Astronexus is licensed CC BY-SA 4.0. The filtered derivative in `public/data/stars-3d.json` retains that license. D3-Celestial data by Olaf Frohn uses the BSD 3-Clause license. License files are included in `public/data`.

NASA, ESA/Hubble, EHT, and Solar System Scope images retain their source credits on the Science page. City search uses the Open-Meteo free non-commercial geocoding service and GeoNames data. Only the entered search text goes to that service; device coordinates are used locally for sky calculations.

Catalog distances and educational orbital models have measurement and precision limits. Cinematic glow, stellar surfaces, and deep-space geometry are visual interpretations. The Science page distinguishes those effects from catalog measurements.

## Verification

`research/verify.mjs` checks astronomy data, coordinate conventions, light-time constants, catalog integrity, and guest storage behavior. `research/verify-observing.mjs` checks horizon calculations and Moon phases. `research/verify-accounts.mjs` checks authentication, persistence, and catalog isolation against a running test instance; provide the password through `ASTRO_DEMO_PASSWORD`.
