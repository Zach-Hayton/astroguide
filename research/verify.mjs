import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AU_KM,
  C_KM_S,
  LY_KM,
  YEAR_SECONDS,
  PLANETS,
  equatorial,
  position,
  distance,
  formatDuration,
} from '../lib/astro/data.ts';
import {
  readCatalog,
  discover,
  updateDiscovery,
} from '../lib/astro/catalog.ts';
const date = new Date('2000-01-01T11:58:55.816Z'); // UTC corresponding approximately to JD 2451545.0 TDB.
const earth = PLANETS.find((o) => o.id === 'earth'),
  moon = PLANETS.find((o) => o.id === 'moon');
const actual = position(earth, date);
const expected = [-26499033.6774305, 57556718.47054072, -132757417.3383451];
const discrepancy = distance(actual, expected);
assert.ok(
  discrepancy < 5000,
  'Earth heliocentric position must be within 5000 km of independent JPL Horizons reference',
);
assert.ok(Math.abs(AU_KM / C_KM_S - 499.004783836) < 1e-8);
assert.ok(Math.abs(LY_KM / C_KM_S - YEAR_SECONDS) < 1e-7);
assert.deepEqual(equatorial(0, 0, 1), [1, 0, -0]);
assert.ok(Math.abs(equatorial(90, 0, 1)[2] + 1) < 1e-12);
assert.ok(Math.abs(equatorial(0, 90, 1)[1] - 1) < 1e-12);
for (const year of [1900, 2000, 2026, 2100]) {
  const d = new Date(year + '-09-06T12:00:00Z');
  const a = position(earth, d),
    b = position(moon, d);
  const lunar = distance(a, b);
  assert.ok(lunar > 350000 && lunar < 410000);
  assert.ok(lunar / C_KM_S > 1.16 && lunar / C_KM_S < 1.37);
  for (const p of PLANETS) assert.ok(position(p, d).every(Number.isFinite));
}
const stars = JSON.parse(readFileSync('public/data/stars-3d.json', 'utf8'));
assert.equal(stars.length, 10426);
assert.equal(new Set(stars.map((s) => s.id)).size, stars.length);
assert.ok(stars.every((s) => s.distanceLy > 0 && s.distanceLy < 326156));
const sirius = stars.find((s) => s.name === 'Sirius');
assert.ok(Math.abs(sirius.distanceLy - 8.6) < 0.03);
const cons = JSON.parse(
  readFileSync('public/data/constellations.json', 'utf8'),
);
assert.equal(
  new Set(cons.features.map((c) => c.id.replace(/\d/g, ''))).size,
  88,
);
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
};
globalThis.window = { dispatchEvent: () => {} };
assert.deepEqual(readCatalog(), []);
discover('earth', 'Earth', 'Planet');
discover('earth', 'Earth', 'Planet');
assert.equal(readCatalog().length, 1);
updateDiscovery('earth', { saved: true, note: 'Pale blue dot' });
assert.equal(readCatalog()[0].saved, true);
assert.equal(readCatalog()[0].note, 'Pale blue dot');
updateDiscovery('earth', { saved: false });
assert.equal(readCatalog()[0].saved, false);
for (const p of PLANETS)
  assert.ok(
    readFileSync('public/assets/' + p.id + '-map.jpg').byteLength > 1000,
  );
console.log(
  'PASS: independent JPL Earth position (error ' +
    discrepancy.toFixed(1) +
    ' km), exact light-time constants, coordinate axes, lunar ranges across four epochs, catalog integrity, 88 constellations, saved discoveries, and all planet textures.',
);
