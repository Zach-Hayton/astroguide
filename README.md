# AstroGuide

Laptop-first astronomy explorer for Five Fish / CSI 3471.

## Running

Use Node 22.13+ and the project’s pnpm lockfile. Install with `pnpm install`, then run `pnpm dev`. Build with `pnpm build`.

## Included in this first version

- NASA-textured animated Earth landing page.
- True-radius solar-system models and positions calculated with Astronomy Engine.
- Continuous camera scaling across kilometers, AU, and light-years, with drag, zoom, pan, and WASD flight.
- 10,426 HYG stars with catalog distances; 5,044 sky-map stars and all 88 constellation regions (89 records because Serpens is split).
- Object search, sourced information, constellation depth view, and illustrative deep-space models.
- Light travel with exact vacuum speed, scrubber, pause/restart, and explicit playback acceleration.
- Local guest discoveries plus two demo accounts with database-backed catalogs, bookmarks, observation plans, and notes.
- A public source/model notes page with image attribution and downloadable licensed star data.

## Scientific verification

Run `node --experimental-strip-types research/verify.mjs` and `pnpm exec tsc --noEmit`.

The test suite checks an independently requested JPL Horizons Earth vector at J2000 (within the educational model's tolerance), light-time constants, coordinate axes, lunar-distance ranges across 1900–2100, catalog integrity and completeness of constellation IDs, local discovery/bookmark behavior, and planetary asset presence. The reference response is in `research/horizons-earth-j2000.json`. The comparison transforms J2000 equatorial XYZ into the Three.js convention [X,Z,-Y].

No claim is made of spacecraft-grade ephemerides or a relativistic renderer. Planet surfaces are processed texture maps. In true-scale mode stars remain unresolved display points. Cinematic close-ups use explicitly illustrative plasma surfaces and representative radii, separated from catalog measurements. Distances are catalog estimates at epoch J2000. The black-hole disk and Andromeda disk are explicitly illustrative. Read `/science` for limitations and licenses.

## Architecture and next stages

The current React UI is built with the required Sites scaffold (Vinext/Vite). Three.js owns the floating-origin explorer; React Three Fiber renders the landing globe. Astronomical world coordinates remain double-precision kilometers; rendering subtracts the camera focus and normalizes by view distance before GPU upload.

The planned Java Spring Boot backend remains a future integration, including the course's domain and DAO layers and Derby persistence if confirmed by the team. Demo accounts currently use Worker routes and D1; guest data remains browser-local.

Further previously discussed features remain future work: account syncing, a broader event calendar, daily astronomy media and sourced discoveries. Location/time-based observing guidance, a horizon chart, and upcoming Moon phases are now included. Experimental photo recognition, star scanning, image cleanup and classroom calculators are separate extensions. Mobile work is intentionally deferred at the user's request.

The first visual refinement added the landing globe, catalog imagery, Orion preview, clearer typography and keyboard travel. Browser interaction and visual testing have not been performed; validation so far is compilation, HTTP route responses and scientific/data unit checks.

## Data provenance

HYG v4.0, David Nash / Astronexus, CC BY-SA 4.0. The filtered derivative `public/data/stars-3d.json` remains CC BY-SA 4.0. Reproduce it with `research/prepare_catalog.py` after obtaining the upstream v4.0 archive at the URL documented in HYG's repository. D3-Celestial data is by Olaf Frohn, BSD 3-Clause; license files are retained in `public/data`. NASA, ESA/Hubble, EHT and Solar System Scope image credits are shown in `/science` and by observations where appropriate.

## Observation planning

`/tonight` adds optional manually selected coordinates and time, an overhead horizon map, target altitude/azimuth, sunrise/sunset, and six upcoming lunar quarter phases using the installed Astronomy Engine. All UI times use the device timezone. Waco is an example preset, not detected location. No weather or location network request is made.

Guest catalog records now optionally include observationStatus (none/planned/observed) and observationDate. Existing records migrate on read without clearing notes or bookmarks. Web exploration and actual observation are distinct. Remaining stages: daily sourced media, optional calculators, account sync and the class backend, photo observations, and experimental image analysis.

## Demo accounts

Two app-level demo usernames, user1 and user2, use server-side salted PBKDF2-SHA256 password verifiers supplied through the secret DEMO_PASSWORD_HASHES. No password is included in source. The current private Sites access policy remains an outer access gate; creating these accounts does not grant new visitors access to the hosting platform.

Sessions use random 256-bit tokens, hashed in D1, with HttpOnly, SameSite=Lax cookies (Secure on HTTPS), seven-day expiration and logout revocation. Writes check same-origin requests and owner identity. Account catalogs are D1-authoritative and guest catalogs remain separate. These are shared demo identities: anyone given one account's password can access that account's records.

Schema is in db/schema.ts and generated migrations in drizzle/. Local development needs .dev.vars with DEMO_PASSWORD_HASHES and the D1 migration applied locally. Hosting on another Cloudflare account needs a real DB binding, this migration, and that secret configured there; the current Sites platform owns its own database. The future course Spring Boot backend is still separate work.

Run research/verify-accounts.mjs against a local running app with ASTRO_DEMO_PASSWORD set. It verifies authentication, ownership isolation, CSRF rejection, logout and durable record retrieval using disposable local test data.
