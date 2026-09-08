'use client';
import Link from '@/components/astro/site-link';
import dynamic from 'next/dynamic';
import { AccountLink } from './account-provider';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowLeft,
  Orbit,
  Sparkles,
  Globe2,
  Bookmark,
  Check,
  Plus,
  Minus,
  Maximize2,
  Info,
  Play,
  Pause,
  RotateCcw,
  X,
  Zap,
  Focus,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  PLANETS,
  DEEP,
  loadDataset,
  resolveObject,
  starObject,
  constellationObject,
  position,
  distance,
  formatDistance,
  formatDuration,
  C_KM_S,
  YEAR_SECONDS,
  LY_KM,
  type SpaceObject,
  type Dataset,
  type Mode,
} from '@/lib/astro/data';
import { discover, readCatalog, updateDiscovery } from '@/lib/astro/catalog';
import type { ViewCommand, LightState } from './space-viewport';
const SpaceViewport = dynamic(() => import('./space-viewport'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <Orbit size={32} />
      <p>Opening your window to the universe…</p>
    </div>
  ),
});
function Choice({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v !== null && onChange(v)}
      items={options}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export default function Explorer() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState(''),
    [selected, setSelected] = useState<SpaceObject>(PLANETS[3]),
    [mode, setMode] = useState<Mode>('space'),
    [category, setCategory] = useState('solar'),
    [query, setQuery] = useState(''),
    [date, setDate] = useState(new Date('2026-09-06T12:00:00Z')),
    [cinematic, setCinematic] = useState(true),
    [lines, setLines] = useState(true),
    [labels, setLabels] = useState(true),
    [command, setCommand] = useState<ViewCommand>({
      serial: 0,
      type: 'object',
      object: PLANETS[3],
    }),
    [cameraDistance, setCameraDistance] = useState(''),
    [saved, setSaved] = useState(false),
    [help, setHelp] = useState(false),
    [compact, setCompact] = useState(false),
    [storageError, setStorageError] = useState('');
  const [lightOpen, setLightOpen] = useState(false),
    [fromId, setFromId] = useState('sun'),
    [toId, setToId] = useState('earth'),
    [speed, setSpeed] = useState(1),
    [elapsed, setElapsed] = useState(0),
    [running, setRunning] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const serial = useRef(1);
  const send = (cmd: Omit<ViewCommand, 'serial'>) =>
    setCommand({ ...cmd, serial: serial.current++ });
  useEffect(() => {
    let cancelled = false;
    loadDataset()
      .then(async (d) => {
        if (cancelled) return;
        setData(d);
        const now = new Date();
        setDate(now);
        const url = new URL(window.location.href);
        const obj =
          resolveObject(url.searchParams.get('object') || 'earth', d) ||
          PLANETS[3];
        setSelected(obj);
        if (url.searchParams.get('view') === 'sky') {
          setMode('sky');
          setCategory('constellations');
        } else if (obj.distanceLy) {
          setCategory('deep');
        }
        send({ type: 'object', object: obj });
        if (url.searchParams.has('light')) setLightOpen(true);
        try {
          await discover(obj.id, obj.name, obj.type);
          setSaved(!!readCatalog().find((x) => x.id === obj.id)?.saved);
        } catch {
          setStorageError(
            'Could not save this discovery. Check your connection or sign in again.',
          );
        }
      })
      .catch(() =>
        setError(
          'We couldn’t load the astronomy catalog. Please reload to try again.',
        ),
      );
    return () => {
      cancelled = true;
    };
  }, []);
  async function choose(o: SpaceObject) {
    setSelected(o);
    if (o.type === 'Constellation') setMode('sky');
    else if (mode === 'sky' && o.body) setMode('space');
    send({ type: 'object', object: o });
    try {
      await discover(o.id, o.name, o.type);
      setSaved(!!readCatalog().find((x) => x.id === o.id)?.saved);
    } catch {
      setStorageError(
        'Could not save. Check your connection or sign in again.',
      );
    }
  }
  const options = useMemo(() => {
    if (!data) return PLANETS;
    const pool = query
      ? [
          ...PLANETS,
          ...DEEP,
          ...data.constellations.map(constellationObject),
          ...data.stars.map(starObject),
        ]
      : category === 'solar'
        ? PLANETS
        : category === 'deep'
          ? DEEP
          : category === 'constellations'
            ? data.constellations.map(constellationObject)
            : data.stars.filter((s) => s.named).map(starObject);
    const q = query.toLowerCase().trim();
    return pool
      .filter(
        (o) =>
          !q ||
          (o.name + ' ' + o.type + ' ' + o.subtitle + ' ' + o.id)
            .toLowerCase()
            .includes(q),
      )
      .slice(0, query ? 70 : 100);
  }, [data, category, query]);
  const lightObjects = useMemo(
    () => [
      ...PLANETS,
      ...DEEP,
      ...(data?.stars
        .filter((s) => s.named && s.distanceLy < 30)
        .slice(0, 25)
        .map(starObject) || []),
    ],
    [data],
  );
  const from = lightObjects.find((o) => o.id === fromId) || PLANETS[0],
    to = lightObjects.find((o) => o.id === toId) || PLANETS[3];
  const lightPath = useMemo(
    () => ({ from: position(from, date), to: position(to, date) }),
    [from, to, date],
  );
  const travel = distance(lightPath.from, lightPath.to) / C_KM_S;
  const progress = travel > 0 ? Math.min(1, elapsed / travel) : 0;
  useEffect(() => {
    setElapsed(0);
    setRunning(false);
  }, [fromId, toId, date]);
  useEffect(() => {
    if (!running) return;
    let last = performance.now(),
      raf = 0;
    const tick = (now: number) => {
      const step = (now - last) / 1000;
      last = now;
      setElapsed((v) => Math.min(travel, v + step * speed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, travel]);
  useEffect(() => {
    if (elapsed >= travel && running) setRunning(false);
  }, [elapsed, travel, running]);
  const light: LightState = lightOpen ? { ...lightPath, progress } : null;
  function frameLight() {
    setMode('space');
    send({ type: 'light', ...lightPath });
  }
  async function toggleSave() {
    try {
      await updateDiscovery(selected.id, { saved: !saved });
      setSaved(!saved);
    } catch {
      setStorageError(
        'Could not save. Check your connection or sign in again.',
      );
    }
  }
  return (
    <div className="explorer-app" ref={container}>
      <header className="explorer-header">
        <Link href="/" className="brand">
          <Orbit size={25} />
          <span>
            astroguide<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="explorer-breadcrumb">
          <span>/</span> Explorer
        </div>
        <div className="header-right">
          <Link href="/tonight">Tonight</Link>
          <Link href="/catalog">
            <Bookmark size={15} /> My catalog
          </Link>
          <button
            onClick={() => setHelp(true)}
            aria-label="Explorer controls and scientific notes"
          >
            <Info size={18} />
          </button>
          <AccountLink />
        </div>
      </header>
      <div className={'explorer-workspace ' + (compact ? 'compact' : '')}>
        {!compact && (
          <aside className="object-browser">
            <div className="browser-heading">
              <span className="eyebrow">YOUR NEXT DISCOVERY</span>
              <button
                aria-label="Hide browsing panel"
                onClick={() => setCompact(true)}
              >
                <PanelLeftClose size={17} />
              </button>
            </div>
            <Command shouldFilter={false} className="object-command">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search the universe…"
              />
              <div className="browse-tabs">
                <Tabs
                  value={category}
                  onValueChange={(v) => {
                    setCategory(String(v));
                    setQuery('');
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="solar">Solar</TabsTrigger>
                    <TabsTrigger value="stars">Stars</TabsTrigger>
                    <TabsTrigger value="constellations">Patterns</TabsTrigger>
                    <TabsTrigger value="deep">Deep</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="list-caption">
                {query
                  ? 'SEARCH RESULTS'
                  : category === 'solar'
                    ? 'OUR SOLAR SYSTEM'
                    : category === 'stars'
                      ? 'STARS BY APPARENT BRIGHTNESS'
                      : category === 'constellations'
                        ? 'CONSTELLATIONS'
                        : 'BEYOND THE SOLAR SYSTEM'}
                <span>{options.length}</span>
              </div>
              <CommandList className="object-list">
                <CommandEmpty>
                  No objects found. Try “Orion”, “Sirius”, or “black hole”.
                </CommandEmpty>
                <CommandGroup>
                  {options.map((o) => (
                    <CommandItem
                      className={
                        'object-item ' +
                        (selected.id === o.id ? 'is-selected' : '')
                      }
                      key={o.id}
                      value={o.id}
                      onSelect={() => choose(o)}
                    >
                      <span
                        className="object-symbol"
                        style={{ color: o.color }}
                      >
                        {o.type === 'Constellation' ? (
                          <Sparkles size={18} />
                        ) : o.type === 'Black hole' ? (
                          <Orbit size={20} />
                        ) : o.type === 'Galaxy' || o.type === 'Nebula' ? (
                          <Sparkles size={19} />
                        ) : (
                          <span
                            className="object-dot"
                            style={{ background: o.color }}
                          />
                        )}
                      </span>
                      <div>
                        <strong>{o.name}</strong>
                        <span>
                          {o.type}
                          {o.distanceLy
                            ? ' · ' + formatDistance(o.distanceLy * LY_KM)
                            : ''}
                        </span>
                      </div>
                      {selected.id === o.id && (
                        <span className="selection-dash" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="browser-foot">
              <span className="status-dot" />
              <span>
                {data
                  ? data.stars.length.toLocaleString() + ' cataloged stars'
                  : 'Loading catalog…'}
                <small>Recorded positions · J2000</small>
              </span>
              <Link href="/science" aria-label="Read data sources">
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        )}
        <main className="universe-canvas">
          <div className="scene-topbar">
            <div className="mode-control">
              {compact && (
                <button
                  className="icon-button"
                  onClick={() => setCompact(false)}
                  aria-label="Show browsing and details"
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList>
                  <TabsTrigger value="space">
                    <Orbit size={14} /> 3D universe
                  </TabsTrigger>
                  <TabsTrigger value="sky">
                    <Sparkles size={14} /> Earth sky
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <button
              className="icon-button"
              title="Fullscreen"
              aria-label="Toggle fullscreen"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else
                  container.current
                    ?.requestFullscreen()
                    .catch(() => setHelp(true));
              }}
            >
              <Maximize2 size={16} />
            </button>
          </div>
          {data ? (
            <SpaceViewport
              data={data}
              selected={selected}
              date={date}
              mode={mode}
              cinematic={cinematic}
              lines={lines}
              labels={labels}
              command={command}
              light={light}
              onSelect={choose}
              onDistance={setCameraDistance}
            />
          ) : (
            <div className="scene-loading">
              <Orbit size={35} />
              <p>{error || 'Loading the star catalog…'}</p>
              {error && (
                <button onClick={() => window.location.reload()}>
                  Try again
                </button>
              )}
            </div>
          )}
          <div className="scene-identity">
            <span className="eyebrow">
              {mode === 'sky'
                ? 'THE SKY FROM EARTH'
                : selected.type === 'Constellation'
                  ? 'STELLAR NEIGHBORHOOD'
                  : 'EXPLORING'}
            </span>
            <h2>{mode === 'sky' ? 'Connect the stars.' : selected.name}</h2>
            <p>
              {mode === 'sky'
                ? 'Drag to look around · Scroll to magnify'
                : selected.subtitle}
            </p>
          </div>
          <div className="zoom-controls">
            <button
              aria-label="Zoom in"
              onClick={() => send({ type: 'zoom', factor: 0.35 })}
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="Zoom out"
              onClick={() => send({ type: 'zoom', factor: 2.85 })}
            >
              <Minus size={18} />
            </button>
            <span />
            <button
              aria-label="Return to selected object"
              onClick={() => send({ type: 'object', object: selected })}
            >
              <Focus size={18} />
            </button>
            <button
              aria-label="See entire solar system"
              onClick={() => {
                setMode('space');
                send({ type: 'overview' });
              }}
            >
              <Orbit size={18} />
            </button>
          </div>
          {!lightOpen && (
            <div className="scene-bottom">
              <div className="scale-readout">
                <span className="scale-rule" />
                <strong>{cameraDistance}</strong>
                <span>
                  {mode === 'sky'
                    ? cinematic
                      ? 'Enhanced starlight · Illustrative sky glow'
                      : 'Angular star map · No local horizon'
                    : cinematic
                      ? 'Cinematic view · Planet sizes enhanced'
                      : 'True object sizes & distances'}
                </span>
              </div>
              <button
                className="light-launch"
                onClick={() => {
                  setLightOpen(true);
                  frameLight();
                }}
              >
                <Zap size={17} /> Follow the light <ArrowUpRight size={16} />
              </button>
            </div>
          )}
          {lightOpen && (
            <section className="light-panel">
              <header>
                <div>
                  <Zap size={18} />
                  <strong>Follow the light</strong>
                  <span>c = 299,792.458 km/s</span>
                </div>
                <button
                  aria-label="Close light travel"
                  onClick={() => {
                    setRunning(false);
                    setLightOpen(false);
                  }}
                >
                  <X size={17} />
                </button>
              </header>
              <div className="light-route">
                <Choice
                  label="Light journey origin"
                  value={fromId}
                  onChange={(id) => {
                    if (id === toId) setToId(fromId);
                    setFromId(id);
                  }}
                  options={lightObjects.map((o) => ({
                    value: o.id,
                    label: o.name,
                  }))}
                />
                <ArrowRight size={16} />
                <Choice
                  label="Light journey destination"
                  value={toId}
                  onChange={setToId}
                  options={lightObjects
                    .filter((o) => o.id !== fromId)
                    .map((o) => ({ value: o.id, label: o.name }))}
                />
                <button
                  className="icon-button"
                  title="Frame journey in 3D"
                  aria-label="Frame light journey"
                  onClick={frameLight}
                >
                  <Focus size={18} />
                </button>
              </div>
              <div className="light-timing">
                <span>
                  {formatDuration(elapsed)} <small>elapsed</small>
                </span>
                <span>
                  {formatDuration(travel)} <small>total</small>
                </span>
              </div>
              <Slider
                aria-label="Light journey progress"
                value={[progress * 100]}
                min={0}
                max={100}
                step={0.01}
                onValueChange={(v) => {
                  setRunning(false);
                  setElapsed(((Array.isArray(v) ? v[0] : v) / 100) * travel);
                }}
              />
              <div className="light-playback">
                <button
                  className="play-button"
                  aria-label={
                    running ? 'Pause light journey' : 'Play light journey'
                  }
                  disabled={travel <= 0}
                  onClick={() => {
                    if (elapsed >= travel) setElapsed(0);
                    frameLight();
                    setRunning(!running);
                  }}
                >
                  {running ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  className="icon-button"
                  aria-label="Restart light journey"
                  onClick={() => {
                    setElapsed(0);
                    setRunning(false);
                  }}
                >
                  <RotateCcw size={15} />
                </button>
                <Choice
                  label="Playback time multiplier"
                  value={String(speed)}
                  onChange={(s) => setSpeed(Number(s))}
                  options={[
                    { value: '1', label: '1× · Real time' },
                    { value: '60', label: '60× · 1 min / sec' },
                    { value: '3600', label: '3,600× · 1 hour / sec' },
                    { value: String(YEAR_SECONDS), label: '1 year / sec' },
                    {
                      value: String(YEAR_SECONDS * 10000),
                      label: '10,000 years / sec',
                    },
                  ]}
                />
                <span>
                  {speed === 1 ? 'REAL LIGHT SPEED' : 'ACCELERATED PLAYBACK'}
                </span>
              </div>
              <p className="light-note">
                {formatDistance(distance(lightPath.from, lightPath.to))} ·
                Center-to-center. Positions held at the selected date;
                straight-line travel in vacuum.
              </p>
            </section>
          )}
        </main>
        {!compact && (
          <aside className="object-detail">
            <div className="detail-top">
              <span className="eyebrow">FIELD NOTES</span>
              <button
                className={saved ? 'saved' : ''}
                onClick={toggleSave}
                aria-label={saved ? 'Remove bookmark' : 'Bookmark object'}
              >
                {saved ? <Check size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
            <div className="detail-title">
              <span className="type-chip">{selected.type}</span>
              <h1>{selected.name}</h1>
              <p>{selected.subtitle}</p>
            </div>
            <p className="object-description">{selected.description}</p>
            {selected.star && cinematic && (
              <div className="model-note">
                <p>
                  Artistic stellar surface · Color follows the catalog color
                  index. Surface detail, rotation, and displayed radius are
                  illustrative.
                </p>
              </div>
            )}
            <dl className="object-facts">
              {selected.facts.map(([k, val]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
            <button
              className="visit-button"
              onClick={() => {
                if (selected.type === 'Constellation') {
                  setMode('space');
                  send({ type: 'depth', object: selected });
                } else {
                  setMode('space');
                  send({ type: 'object', object: selected });
                }
              }}
            >
              <Focus size={16} />
              {selected.type === 'Constellation'
                ? 'Explore its stars in 3D'
                : 'Fly to ' + selected.name}
              <ArrowUpRight size={15} />
            </button>
            {selected.illustration && (
              <div className="science-note">
                <Info size={14} />
                <p>{selected.illustration}</p>
              </div>
            )}
            {selected.image && (
              <figure className="observation-image">
                <img
                  src={selected.image}
                  alt={
                    selected.type === 'Black hole'
                      ? 'Event Horizon Telescope reconstructed radio image of Sagittarius A*'
                      : selected.name + ' observation'
                  }
                />
                <figcaption>
                  <a
                    href={selected.imageSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selected.imageCredit} <ArrowUpRight size={11} />
                  </a>
                </figcaption>
              </figure>
            )}
            <a
              className="source-link"
              href={selected.source}
              target="_blank"
              rel="noreferrer"
            >
              Read the source <ArrowUpRight size={14} />
            </a>
            <div className="view-options">
              <span className="eyebrow">YOUR VIEW</span>
              <label>
                Cinematic view
                <Switch
                  checked={cinematic}
                  onCheckedChange={setCinematic}
                  aria-label="Cinematic view"
                />
              </label>
              <small>
                {cinematic
                  ? 'Brighter starlight, enhanced planets, and an artistic Milky Way backdrop.'
                  : 'Physical planet sizes, catalog stars, and natural shadow contrast.'}
              </small>
              <label>
                Object labels{' '}
                <Switch
                  checked={labels}
                  onCheckedChange={setLabels}
                  aria-label="Show object labels"
                />
              </label>
              <label>
                {mode === 'sky' ? 'Constellation lines' : 'Orbital paths'}
                <Switch
                  checked={lines}
                  onCheckedChange={setLines}
                  aria-label="Show reference lines"
                />
              </label>
              <label className="date-label">
                Solar-system date (UTC)
                <input
                  type="date"
                  aria-label="Solar-system date in UTC"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={date.toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const d = new Date(e.target.value + 'T12:00:00Z');
                    if (
                      !isNaN(d.getTime()) &&
                      d.getUTCFullYear() >= 1900 &&
                      d.getUTCFullYear() <= 2100
                    )
                      setDate(d);
                  }}
                />
              </label>
              <small>
                12:00 UTC when choosing a date. Stars remain at catalog epoch
                J2000.
              </small>
            </div>
          </aside>
        )}
      </div>
      <div className="explorer-status">
        <span>
          <span className="status-dot" />{' '}
          {mode === 'sky' ? 'EARTH-BASED SKY MAP' : '3D EXPLORER'}
        </span>
        <span>Drag to rotate · Scroll to zoom · WASD to travel</span>
        <Link href="/science">
          Sources & model notes <ArrowUpRight size={12} />
        </Link>
      </div>
      {storageError && (
        <div className="storage-notice" role="status">
          {storageError}
        </div>
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="help-dialog">
          <DialogTitle>Make yourself at home in space.</DialogTitle>
          <DialogDescription>
            Use your trackpad or mouse to explore. A keyboard works too.
          </DialogDescription>
          <dl className="controls-list">
            <div>
              <dt>Rotate / look around</dt>
              <dd>Drag or arrow keys</dd>
            </div>
            <div>
              <dt>Zoom quickly</dt>
              <dd>Scroll or + / − keys</dd>
            </div>
            <div>
              <dt>Move sideways in 3D</dt>
              <dd>Shift + drag</dd>
            </div>
            <div>
              <dt>Travel through 3D space</dt>
              <dd>WASD · Q / E for down / up</dd>
            </div>
            <div>
              <dt>Visit an object</dt>
              <dd>Search or click a label</dd>
            </div>
            <div>
              <dt>Compare star depths</dt>
              <dd>Choose a constellation → Explore its stars in 3D</dd>
            </div>
          </dl>
          <p>
            Turn off Cinematic view for physical planet sizes. Cinematic view
            enhances distant planets, lighting, and background stars. Stars are
            light points with an enlarged display glow. Deep-space imagery and
            illustrative models are labeled.
          </p>
          <p>
            Earth sky shows catalog directions, without a local horizon, or
            observing-location prediction. Cinematic sky glow is artistic.
          </p>
          <Link className="source-link" href="/science">
            Read all model notes <ArrowUpRight size={14} />
          </Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}
