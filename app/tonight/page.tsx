'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  MapPin,
  Moon,
  CalendarDays,
  Compass,
  Bookmark,
} from 'lucide-react';
import Header from '@/components/astro/header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loadDataset, type Dataset } from '@/lib/astro/data';
import {
  observingSky,
  moonEvents,
  skyPoint,
  type SkyTarget,
} from '@/lib/astro/observing';
import { discover, updateDiscovery, readCatalog } from '@/lib/astro/catalog';

const places = [
  { name: 'Waco, Texas', lat: 31.55, lon: -97.15 },
  { name: 'Seattle, Washington', lat: 47.61, lon: -122.33 },
  { name: 'London, UK', lat: 51.51, lon: -0.13 },
  { name: 'Sydney, Australia', lat: -33.87, lon: 151.21 },
];
const localInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
export default function Tonight() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [lat, setLat] = useState('31.55'),
    [lon, setLon] = useState('-97.15'),
    [place, setPlace] = useState('0'),
    [when, setWhen] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState(''),
    [planned, setPlanned] = useState<string[]>([]);
  useEffect(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    setWhen(localInput(d));
    loadDataset()
      .then(setData)
      .catch(() =>
        setError(
          'The star catalog could not load. Reload this page to try again.',
        ),
      );
    const sync = () =>
      setPlanned(
        readCatalog()
          .filter((x) => x.observationStatus === 'planned')
          .map((x) => x.id),
      );
    sync();
    window.addEventListener('astroguide-catalog', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('astroguide-catalog', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const result = useMemo(() => {
    if (!data || !when) return null;
    try {
      if (!lat.trim() || !lon.trim()) throw Error();
      return {
        sky: observingSky(data, Number(lat), Number(lon), new Date(when)),
        events: moonEvents(new Date(when)),
      };
    } catch {
      return null;
    }
  }, [data, lat, lon, when]);
  const visible = result?.sky.targets.filter((t) => t.altitude > 0) ?? [];
  const targets = visible.filter(
    (t) =>
      filter === 'all' ||
      (filter === 'planets'
        ? !!t.object.body
        : filter === 'stars'
          ? !!t.object.star
          : !t.object.star && !t.object.body),
  );
  const focus = visible.find((t) => t.object.id === selected) ?? targets[0];
  const time = (d: Date | null) =>
    d
      ? d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'No crossing in the next 24 hours';
  const zone = when ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  async function plan(t: SkyTarget) {
    try {
      await discover(t.object.id, t.object.name, t.object.type);
      await updateDiscovery(t.object.id, {
        saved: true,
        observationStatus: 'planned',
        observationDate: when.slice(0, 10),
      });
      setNotice(t.object.name + ' added to your observation plans.');
    } catch {
      setNotice(
        'Could not save this plan. Check your connection or sign in again.',
      );
    }
  }
  return (
    <main className="tonight-page">
      <Header active="tonight" />
      <div className="tonight-content">
        <div className="tonight-heading">
          <div>
            <p className="eyebrow">FROM EXPLORING TO OBSERVING</p>
            <h1>Your sky, tonight.</h1>
            <p>Find a direction. Pick a target. Make a plan.</p>
          </div>
          <Link href="/catalog" className="secondary-button">
            <Bookmark size={17} /> My observation plans
          </Link>
        </div>
        <div className="observing-controls">
          <label>
            <span>
              <MapPin size={15} /> Observing place
            </span>
            <Select
              value={place}
              onValueChange={(v) => {
                setPlace(String(v));
                const p = places[Number(v)];
                if (p) {
                  setLat(String(p.lat));
                  setLon(String(p.lon));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {places.map((p, i) => (
                  <SelectItem key={p.name} value={String(i)}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom coordinates</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label>
            Latitude
            <input
              type="number"
              min="-90"
              max="90"
              step=".01"
              value={lat}
              onChange={(e) => {
                setLat(e.target.value);
                setPlace('custom');
              }}
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              min="-180"
              max="180"
              step=".01"
              value={lon}
              onChange={(e) => {
                setLon(e.target.value);
                setPlace('custom');
              }}
            />
          </label>
          <label>
            Observing time
            <input
              type="datetime-local"
              min="1900-01-01T00:00"
              max="2100-12-31T23:59"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </label>
          <button
            className="secondary-button"
            onClick={() => setWhen(localInput(new Date()))}
          >
            Now
          </button>
        </div>
        <p className="observing-context">
          Waco is an example starting place, not your detected location.
          Coordinates stay in this page. All times use your device’s time zone
          {zone ? ' (' + zone + ')' : ''}, including when selecting another
          city.
        </p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : !data ? (
          <p className="empty-message">Opening the sky catalog…</p>
        ) : !result ? (
          <p role="alert" className="form-error">
            Enter latitude −90 to 90, longitude −180 to 180, and a valid
            observing time from 1900 to 2100.
          </p>
        ) : (
          <>
            <div className="sky-summary">
              <div>
                <span>SKY CONDITIONS</span>
                <strong>
                  {result.sky.sunAltitude >= 0
                    ? 'Daylight'
                    : result.sky.sunAltitude > -18
                      ? 'Twilight'
                      : 'Astronomical night'}
                </strong>
                <small>
                  {result.sky.sunAltitude >= -18
                    ? 'Most stars may be washed out.'
                    : 'Darkness estimate; weather is not included.'}
                </small>
              </div>
              <div>
                <span>MOON ILLUMINATION</span>
                <strong>{Math.round(result.sky.moonLight * 100)}%</strong>
                <small>Illuminated fraction of the lunar disk</small>
              </div>
              <div>
                <span>NEXT SUNSET</span>
                <strong>{time(result.sky.sunset)}</strong>
                <small>Calculated for the selected coordinates</small>
              </div>
              <div>
                <span>NEXT SUNRISE</span>
                <strong>{time(result.sky.sunrise)}</strong>
                <small>Within 24 hours of your selected time</small>
              </div>
            </div>
            <div className="observing-grid">
              <section className="sky-chart-panel">
                <div className="panel-heading">
                  <h2>
                    <Compass size={18} /> Above your horizon
                  </h2>
                  <span>{visible.length} catalog targets</span>
                </div>
                <svg
                  className="observing-chart"
                  viewBox="0 0 460 460"
                  role="img"
                  aria-label="Sky chart with north up and east left. Center is directly overhead. Select targets in the list for keyboard access."
                >
                  <defs>
                    <radialGradient id="sky-field">
                      <stop stopColor="#112b42" />
                      <stop offset="1" stopColor="#050a13" />
                    </radialGradient>
                  </defs>
                  <circle
                    cx="230"
                    cy="230"
                    r="190"
                    fill="url(#sky-field)"
                    stroke="#436079"
                  />
                  {[63.33, 126.66].map((r) => (
                    <circle
                      key={r}
                      cx="230"
                      cy="230"
                      r={r}
                      fill="none"
                      stroke="#21384c"
                      strokeDasharray="3 6"
                    />
                  ))}
                  <path d="M230 40V420M40 230H420" stroke="#21384c" />
                  <g fill="#8ca3b9" fontSize="13" textAnchor="middle">
                    <text x="230" y="24">
                      N
                    </text>
                    <text x="230" y="448">
                      S
                    </text>
                    <text x="22" y="235">
                      E
                    </text>
                    <text x="439" y="235">
                      W
                    </text>
                    <text x="253" y="227" fontSize="10">
                      90°
                    </text>
                    <text x="253" y="170" fontSize="10">
                      60°
                    </text>
                    <text x="253" y="106" fontSize="10">
                      30°
                    </text>
                  </g>
                  {visible.map((t) => {
                    const p = skyPoint(t.altitude, t.azimuth),
                      isFocus = t.object.id === focus?.object.id;
                    return (
                      <g
                        key={t.object.id}
                        onClick={() => setSelected(t.object.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>
                          {t.object.name +
                            ' · ' +
                            Math.round(t.altitude) +
                            '° up · ' +
                            t.direction}
                        </title>
                        <circle cx={p.x} cy={p.y} r="9" fill="transparent" />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isFocus ? 11 : 0}
                          fill="none"
                          stroke="#9de4cf"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={
                            t.object.body
                              ? 4
                              : Math.max(
                                  1.2,
                                  3.3 - (t.object.star?.mag ?? 2) * 0.6,
                                )
                          }
                          fill={t.object.color}
                        />
                        {(isFocus || t.object.body) && (
                          <text
                            x={p.x + 8}
                            y={p.y - 8}
                            fill={isFocus ? '#bcefe0' : '#adbfd1'}
                            fontSize="11"
                          >
                            {t.object.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <p className="chart-caption">
                  Hold the map overhead: east is on the left. The center is
                  directly above you; the outer circle is the horizon.
                </p>
                {focus && (
                  <div className="sky-focus">
                    <div>
                      <span className="eyebrow">{focus.object.type}</span>
                      <h3>{focus.object.name}</h3>
                      <p>
                        {Math.round(focus.altitude)}° above the horizon · Look{' '}
                        {focus.direction} ({Math.round(focus.azimuth)}°)
                      </p>
                    </div>
                    <div className="sky-focus-actions">
                      <Link
                        href={
                          '/explore?object=' +
                          encodeURIComponent(focus.object.id)
                        }
                        className="secondary-button"
                      >
                        Explore <ArrowUpRight size={16} />
                      </Link>
                      <button
                        className="primary-button"
                        onClick={() => plan(focus)}
                      >
                        {planned.includes(focus.object.id) ? (
                          <Check size={16} />
                        ) : (
                          <Bookmark size={16} />
                        )}{' '}
                        {planned.includes(focus.object.id)
                          ? 'Planned'
                          : 'Plan observation'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <section className="target-panel">
                <div className="panel-heading">
                  <h2>Pick a target</h2>
                </div>
                <Tabs
                  value={filter}
                  onValueChange={(v) => setFilter(String(v))}
                >
                  <TabsList variant="line">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="planets">Planets & Moon</TabsTrigger>
                    <TabsTrigger value="stars">Stars</TabsTrigger>
                    <TabsTrigger value="deep">Deep sky</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="target-guidance">
                  Sorted highest first. Being above the horizon does not
                  guarantee visibility.
                </p>
                <div className="target-list">
                  {targets.length ? (
                    targets.map((t) => (
                      <button
                        key={t.object.id}
                        className={
                          'target-row ' +
                          (focus?.object.id === t.object.id ? 'active' : '')
                        }
                        onClick={() => setSelected(t.object.id)}
                      >
                        <span
                          className="target-dot"
                          style={{ background: t.object.color }}
                        />
                        <span>
                          <strong>{t.object.name}</strong>
                          <small>
                            {t.object.type}
                            {!t.object.body && !t.object.star
                              ? ' · Optical aid recommended'
                              : ''}
                          </small>
                        </span>
                        <span className="target-altitude">
                          {Math.round(t.altitude)}°<small>{t.direction}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-message">
                      No targets in this category are above the horizon at this
                      time. Try a different time.
                    </p>
                  )}
                </div>
              </section>
            </div>
            {notice && (
              <p role="status" className="observing-notice">
                {notice} <Link href="/catalog">Open catalog →</Link>
              </p>
            )}
            <section className="moon-events">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">PLAN AHEAD</p>
                  <h2>
                    <CalendarDays size={20} /> Upcoming Moon phases
                  </h2>
                </div>
                <span>After your selected time</span>
              </div>
              <div className="moon-event-grid">
                {result.events.map((e) => (
                  <article key={e.date.toISOString()}>
                    <Moon size={24} className={'phase-' + e.quarter} />
                    <h3>{e.name}</h3>
                    <p>{time(e.date)}</p>
                    <small>
                      {e.quarter === 0
                        ? 'Less moonlight around this date.'
                        : e.quarter === 2
                          ? 'A bright Moon can wash out faint objects.'
                          : 'Explore the boundary between lunar day and night.'}
                    </small>
                    <button onClick={() => setWhen(localInput(e.date))}>
                      View sky at this time <ArrowUpRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <p className="observing-footnote">
              Guidance uses calculated positions and a level horizon. Clouds,
              terrain, light pollution, eyesight, and equipment affect what you
              can see. No weather data is included.{' '}
              <Link href="/science">Sources & calculation notes</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
