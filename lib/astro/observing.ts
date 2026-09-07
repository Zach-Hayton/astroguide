import {
  Body,
  Observer,
  Equator,
  Horizon,
  Vector,
  MakeTime,
  Rotation_EQJ_EQD,
  RotateVector,
  EquatorFromVector,
  Illumination,
  SearchRiseSet,
  SearchMoonQuarter,
  NextMoonQuarter,
} from 'astronomy-engine';
import {
  PLANETS,
  DEEP,
  starObject,
  type Dataset,
  type SpaceObject,
} from './data';

export type SkyTarget = {
  object: SpaceObject;
  altitude: number;
  azimuth: number;
  direction: string;
};
export const compass = (degrees: number) =>
  ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];
export function validateObserver(
  latitude: number,
  longitude: number,
  date: Date,
) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() < 1900 ||
    date.getUTCFullYear() > 2100
  )
    throw new Error(
      'Enter valid coordinates and a date between 1900 and 2100.',
    );
}
export function horizontal(
  object: SpaceObject,
  observer: Observer,
  date: Date,
): SkyTarget {
  let eq;
  if (object.body) eq = Equator(object.body, date, observer, true, true);
  else {
    const ra = ((object.ra ?? 0) * Math.PI) / 180,
      dec = ((object.dec ?? 0) * Math.PI) / 180;
    const vector = new Vector(
      Math.cos(dec) * Math.cos(ra),
      Math.cos(dec) * Math.sin(ra),
      Math.sin(dec),
      MakeTime(date),
    );
    eq = EquatorFromVector(RotateVector(Rotation_EQJ_EQD(date), vector));
  }
  const h = Horizon(date, observer, eq.ra, eq.dec, 'normal');
  return {
    object,
    altitude: h.altitude,
    azimuth: h.azimuth,
    direction: compass(h.azimuth),
  };
}
export function observingSky(
  data: Dataset,
  latitude: number,
  longitude: number,
  date: Date,
) {
  validateObserver(latitude, longitude, date);
  const observer = new Observer(latitude, longitude, 0);
  const objects = [
    ...PLANETS.filter(
      (o) => o.id !== 'earth' && o.id !== 'sun' && o.id !== 'pluto',
    ),
    ...DEEP.filter((o) => o.type !== 'Black hole'),
    ...data.stars.filter((s) => s.mag <= 3.5).map(starObject),
  ];
  const targets = objects
    .map((o) => horizontal(o, observer, date))
    .sort((a, b) => b.altitude - a.altitude);
  const sun = horizontal(PLANETS[0], observer, date);
  return {
    targets,
    sunAltitude: sun.altitude,
    moonLight: Illumination(Body.Moon, date).phase_fraction,
    sunset: SearchRiseSet(Body.Sun, observer, -1, date, 1)?.date ?? null,
    sunrise: SearchRiseSet(Body.Sun, observer, 1, date, 1)?.date ?? null,
  };
}
export function moonEvents(date: Date) {
  let q = SearchMoonQuarter(date);
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push({
      name: ['New Moon', 'First quarter', 'Full Moon', 'Last quarter'][
        q.quarter
      ],
      quarter: q.quarter,
      date: q.time.date,
    });
    q = NextMoonQuarter(q);
  }
  return result;
}
// Polar sky chart: north up, east left, as on a map held overhead.
export function skyPoint(altitude: number, azimuth: number) {
  const r = ((90 - Math.max(0, Math.min(90, altitude))) / 90) * 190,
    a = (azimuth * Math.PI) / 180;
  return { x: 230 - r * Math.sin(a), y: 230 - r * Math.cos(a) };
}
