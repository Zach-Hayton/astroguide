import { Body, HelioVector, RotationAxis } from 'astronomy-engine';
export const AU_KM = 149597870.7;
export const C_KM_S = 299792.458;
export const YEAR_SECONDS = 365.25 * 86400;
export const LY_KM = C_KM_S * YEAR_SECONDS;
export type Vec3 = [number, number, number];
export type Mode = 'space' | 'sky';
export type Star = {
  id: string;
  hip: string;
  name: string;
  ra: number;
  dec: number;
  distanceLy: number;
  mag: number;
  absMag: number;
  bv: number | null;
  spectral: string;
  constellation: string;
  named: boolean;
};
export type SkyFeature = {
  id: number;
  properties: { mag: number; bv: string };
  geometry: { coordinates: [number, number] };
};
export type Constellation = {
  id: string;
  properties: { name: string; en: string; display: number[] };
  geometry: { coordinates: [number, number] };
};
export type ConstellationLine = {
  id: string;
  geometry: { coordinates: [number, number][][] };
};
export type Dataset = {
  stars: Star[];
  sky: SkyFeature[];
  constellations: Constellation[];
  lines: ConstellationLine[];
};
export type SpaceObject = {
  id: string;
  name: string;
  type:
    | 'Planet'
    | 'Moon'
    | 'Star'
    | 'Dwarf planet'
    | 'Nebula'
    | 'Galaxy'
    | 'Black hole'
    | 'Constellation';
  subtitle: string;
  description: string;
  color: string;
  radiusKm?: number;
  body?: Body;
  periodDays?: number;
  ra?: number;
  dec?: number;
  distanceLy?: number;
  source: string;
  facts: [string, string][];
  image?: string;
  imageCredit?: string;
  imageSource?: string;
  illustration?: string;
  star?: Star;
};
const jpl = 'https://ssd.jpl.nasa.gov/planets/phys_par.html';
export const PLANETS: SpaceObject[] = [
  {
    id: 'sun',
    name: 'Sun',
    type: 'Star',
    subtitle: 'The star we call home',
    body: Body.Sun,
    radiusKm: 695700,
    color: '#fff1bd',
    description:
      'Our solar system’s star. Nuclear fusion in its core supplies the energy that lights and warms the planets.',
    source: 'https://science.nasa.gov/sun/facts/',
    facts: [
      ['Spectral class', 'G2 V'],
      ['Nominal radius', '695,700 km'],
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Planet',
    subtitle: 'Small world. Swift orbit.',
    body: Body.Mercury,
    radiusKm: 2439.4,
    color: '#aaa39c',
    periodDays: 87.969,
    description:
      'The smallest planet travels around the Sun in about 88 Earth days. Its surface preserves a long history of impacts.',
    source: jpl,
    facts: [
      ['Mean radius', '2,439.4 km'],
      ['Orbital period', '87.97 days'],
      ['Mass', '3.301 × 10²³ kg'],
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Planet',
    subtitle: 'A world wrapped in clouds',
    body: Body.Venus,
    radiusKm: 6051.8,
    color: '#deba80',
    periodDays: 224.701,
    description:
      'A thick atmosphere hides Venus’s surface. Its slow, retrograde rotation runs opposite to most planets.',
    source: jpl,
    facts: [
      ['Mean radius', '6,051.8 km'],
      ['Orbital period', '224.70 days'],
      ['Mass', '4.867 × 10²⁴ kg'],
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Planet',
    subtitle: 'Our pale blue dot',
    body: Body.Earth,
    radiusKm: 6371.0084,
    color: '#7fbfdf',
    periodDays: 365.256,
    description:
      'An ocean world under a thin atmosphere, and the only place where we currently know life exists. Pull back to see how small home becomes.',
    source: jpl,
    facts: [
      ['Mean radius', '6,371.0 km'],
      ['Orbital period', '365.26 days'],
      ['Mass', '5.972 × 10²⁴ kg'],
    ],
    image: '/assets/earth-hero.jpg',
    imageCredit: 'NASA / ISS Expedition 66 crew / JSC',
    imageSource:
      'https://science.nasa.gov/earth/earth-observatory/earths-limb-with-a-crescent-moon-150240/',
  },
  {
    id: 'moon',
    name: 'Moon',
    type: 'Moon',
    subtitle: 'Our nearest celestial neighbor',
    body: Body.Moon,
    radiusKm: 1737.4,
    color: '#bebdb8',
    periodDays: 27.322,
    description:
      'Earth’s natural satellite keeps nearly the same face toward us. Its distance changes throughout its elliptical orbit.',
    source: 'https://science.nasa.gov/moon/facts/',
    facts: [
      ['Mean radius', '1,737.4 km'],
      ['Mean Earth distance', '384,400 km'],
      ['Orbital period', '27.32 days'],
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Planet',
    subtitle: 'The red planet',
    body: Body.Mars,
    radiusKm: 3389.5,
    color: '#bd6948',
    periodDays: 686.98,
    description:
      'A cold, rocky world with a thin atmosphere. Rust-bearing minerals give its surface the familiar red color.',
    source: jpl,
    facts: [
      ['Mean radius', '3,389.5 km'],
      ['Orbital period', '1.88 years'],
      ['Mass', '6.417 × 10²³ kg'],
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Planet',
    subtitle: 'A giant among worlds',
    body: Body.Jupiter,
    radiusKm: 69911,
    color: '#cba586',
    periodDays: 4332.589,
    description:
      'The largest planet in our solar system. Its visible cloud bands trace a deep, rapidly rotating atmosphere.',
    source: jpl,
    facts: [
      ['Mean radius', '69,911 km'],
      ['Orbital period', '11.86 years'],
      ['Mass', '1.898 × 10²⁷ kg'],
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Planet',
    subtitle: 'A world of rings',
    body: Body.Saturn,
    radiusKm: 58232,
    color: '#dac795',
    periodDays: 10759.22,
    description:
      'Saturn’s wide rings are made of countless pieces of ice and rock. Its cloud-covered globe is the second-largest planet.',
    source: jpl,
    facts: [
      ['Mean radius', '58,232 km'],
      ['Orbital period', '29.45 years'],
      ['Mass', '5.683 × 10²⁶ kg'],
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Planet',
    subtitle: 'An ice giant on its side',
    body: Body.Uranus,
    radiusKm: 25362,
    color: '#92d8de',
    periodDays: 30685.4,
    description:
      'Uranus rotates with an extreme axial tilt. Methane in its atmosphere contributes to its blue-green appearance.',
    source: jpl,
    facts: [
      ['Mean radius', '25,362 km'],
      ['Orbital period', '84.02 years'],
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Planet',
    subtitle: 'At the edge of the planetary realm',
    body: Body.Neptune,
    radiusKm: 24622,
    color: '#597fdb',
    periodDays: 60189,
    description:
      'The most distant of the eight planets is an ice giant. One orbit takes about 165 Earth years.',
    source: jpl,
    facts: [
      ['Mean radius', '24,622 km'],
      ['Orbital period', '164.79 years'],
    ],
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'Dwarf planet',
    subtitle: 'A small world beyond Neptune',
    body: Body.Pluto,
    radiusKm: 1188.3,
    color: '#d7c6af',
    periodDays: 90560,
    description:
      'Pluto is a dwarf planet in the Kuiper Belt. Its inclined, elongated orbit sometimes carries it closer to the Sun than Neptune.',
    source: jpl,
    facts: [
      ['Mean radius', '1,188.3 km'],
      ['Orbital period', 'About 248 years'],
    ],
  },
];
export const DEEP: SpaceObject[] = [
  {
    id: 'orion-nebula',
    name: 'Orion Nebula',
    type: 'Nebula',
    subtitle: 'M42 · A stellar nursery',
    ra: 83.8221,
    dec: -5.3911,
    distanceLy: 1344,
    radiusKm: 10 * LY_KM,
    color: '#d197bb',
    description:
      'A nearby region where new stars form from clouds of gas and dust. It lies in Orion’s sword, below the three bright stars of the belt.',
    source:
      'https://nightsky.jpl.nasa.gov/documents/136/PartnerArticle_December2019.pdf',
    facts: [
      ['Distance estimate', 'About 1,344 light-years'],
      ['Extent', 'About 20 light-years'],
      ['Catalog designation', 'M42 / NGC 1976'],
    ],
    image: '/assets/orion.jpg',
    imageCredit:
      'NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope Orion Treasury Project Team',
    imageSource: 'https://esahubble.org/images/heic0601a/',
    illustration:
      'Telescope image placed at the catalog distance. The image is a flat observation, not a measured 3D gas volume.',
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    type: 'Galaxy',
    subtitle: 'M31 · A neighboring spiral',
    ra: 10.6847,
    dec: 41.269,
    distanceLy: 2500000,
    radiusKm: 76000 * LY_KM,
    color: '#ccd5df',
    description:
      'A large spiral galaxy in our Local Group. Its light has traveled for roughly 2.5 million years before reaching Earth.',
    source:
      'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/',
    facts: [
      ['Distance estimate', 'About 2.5 million light-years'],
      ['Catalog designation', 'M31 / NGC 224'],
      ['Galaxy type', 'Spiral'],
    ],
    illustration:
      'Illustrative spiral disk at an approximate catalog position and distance. Individual stars and disk dimensions are schematic.',
  },
  {
    id: 'sagittarius-a',
    name: 'Sagittarius A*',
    type: 'Black hole',
    subtitle: 'The dark heart of our galaxy',
    ra: 266.4168,
    dec: -29.0078,
    distanceLy: 26000,
    radiusKm: 11813000,
    color: '#efa25b',
    description:
      'The supermassive black hole at the center of the Milky Way. Astronomers infer its mass by tracking nearby stellar orbits and have imaged its shadow with the Event Horizon Telescope.',
    source: 'https://www.eso.org/public/images/eso2208-eht-mwa/',
    facts: [
      ['Distance estimate', 'About 26,000 light-years'],
      ['Mass estimate', 'About 4 million Suns'],
      ['Schwarzschild radius¹', 'About 11.8 million km'],
    ],
    image: '/assets/sagittarius.jpg',
    imageCredit: 'EHT Collaboration · CC BY 4.0',
    imageSource: 'https://www.eso.org/public/images/eso2208-eht-mwa/',
    illustration:
      'Illustrative accretion disk, not a relativistic ray-traced model. ¹Radius uses a non-spinning black-hole approximation; spin changes the horizon. The observation below is reconstructed radio imagery.',
  },
];
export function equatorial(ra: number, dec: number, distance: number): Vec3 {
  const a = (ra * Math.PI) / 180,
    d = (dec * Math.PI) / 180;
  return [
    distance * Math.cos(d) * Math.cos(a),
    distance * Math.sin(d),
    -distance * Math.cos(d) * Math.sin(a),
  ];
}
export function position(o: SpaceObject, date: Date): Vec3 {
  if (o.body) {
    const p = HelioVector(o.body, date);
    return [p.x * AU_KM, p.z * AU_KM, -p.y * AU_KM];
  }
  return equatorial(o.ra ?? 0, o.dec ?? 0, (o.distanceLy ?? 0) * LY_KM);
}
export function axis(o: SpaceObject, date: Date): Vec3 {
  if (!o.body) return [0, 1, 0];
  const a = RotationAxis(o.body, date);
  return [a.north.x, a.north.z, -a.north.y];
}
export function starObject(s: Star): SpaceObject {
  return {
    id: s.id,
    name: s.name,
    type: 'Star',
    subtitle: s.spectral ? 'Spectral class ' + s.spectral : 'Cataloged star',
    ra: s.ra,
    dec: s.dec,
    distanceLy: s.distanceLy,
    color: starColor(s.bv),
    description:
      'A cataloged star in ' +
      (s.constellation || 'the sky') +
      '. Its position and distance come from HYG v4.0, which combines Hipparcos, Yale, and Gliese observations. Distances are catalog estimates and may be revised.',
    source: 'https://github.com/astronexus/HYG-Database',
    facts: [
      [
        'Catalog distance',
        s.distanceLy.toLocaleString('en-US', { maximumFractionDigits: 2 }) +
          ' light-years',
      ],
      ['Apparent magnitude', s.mag.toFixed(2)],
      ['Spectral class', s.spectral || 'Not available'],
    ],
    star: s,
    illustration:
      'Stars are unresolved light points. Their visible glow is a display effect, not a physical radius. Catalog positions are fixed at epoch J2000.',
  };
}
export function constellationObject(c: Constellation): SpaceObject {
  return {
    id: 'con-' + c.id,
    name: c.properties.name,
    type: 'Constellation',
    subtitle: c.properties.en + ' · Earth-based pattern',
    ra: c.geometry.coordinates[0],
    dec: c.geometry.coordinates[1],
    color: '#a8dcd7',
    description:
      'One of the 88 recognized regions of the sky. The connecting lines are a conventional pattern as viewed from Earth. Its stars lie at different distances; the constellation has no single physical distance or size.',
    source: 'https://iauarchive.eso.org/public/themes/constellations/',
    facts: [
      ['Abbreviation', c.id.replace(/\d/g, '')],
      ['Viewpoint', 'Earth'],
      ['Line pattern', 'Conventional guide'],
    ],
  };
}
export function starColor(bv: number | null) {
  if (bv === null) return '#eef3ff';
  return bv < -0.1
    ? '#a9c9ff'
    : bv < 0.3
      ? '#dbe8ff'
      : bv < 0.6
        ? '#fff7dc'
        : bv < 1
          ? '#ffdfad'
          : bv < 1.5
            ? '#ffbf8f'
            : '#ff9772';
}
export function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
export function formatDistance(km: number): string {
  if (km >= LY_KM)
    return (
      (km / LY_KM).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ly'
    );
  if (km >= AU_KM * 0.1)
    return (
      (km / AU_KM).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' AU'
    );
  return km.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' km';
}
export function formatDuration(seconds: number): string {
  if (seconds >= YEAR_SECONDS)
    return (
      (seconds / YEAR_SECONDS).toLocaleString('en-US', {
        maximumFractionDigits: 2,
      }) + ' years'
    );
  if (seconds >= 86400)
    return (
      (seconds / 86400).toLocaleString('en-US', { maximumFractionDigits: 2 }) +
      ' days'
    );
  if (seconds >= 3600)
    return (
      Math.floor(seconds / 3600) +
      'h ' +
      Math.floor((seconds % 3600) / 60) +
      'm'
    );
  if (seconds >= 60)
    return Math.floor(seconds / 60) + 'm ' + (seconds % 60).toFixed(1) + 's';
  return seconds.toFixed(2) + ' seconds';
}
export function resolveObject(
  id: string,
  data: Dataset,
): SpaceObject | undefined {
  const known = [...PLANETS, ...DEEP].find((o) => o.id === id);
  if (known) return known;
  if (id.startsWith('con-')) {
    const c = data.constellations.find((c) => 'con-' + c.id === id);
    return c ? constellationObject(c) : undefined;
  }
  const s = data.stars.find((s) => s.id === id);
  return s ? starObject(s) : undefined;
}
export async function loadDataset(): Promise<Dataset> {
  const urls = ['stars-3d', 'stars', 'constellations', 'constellation-lines'];
  const [stars, sky, cons, lines] = await Promise.all(
    urls.map(async (name) => {
      const r = await fetch('/data/' + name + '.json');
      if (!r.ok) throw new Error('The star catalog could not be loaded.');
      return r.json();
    }),
  );
  if (!Array.isArray(stars)) throw new Error('Invalid star catalog');
  return {
    stars: stars as Star[],
    sky: (sky as { features: SkyFeature[] }).features,
    constellations: (cons as { features: Constellation[] }).features,
    lines: (lines as { features: ConstellationLine[] }).features,
  };
}
