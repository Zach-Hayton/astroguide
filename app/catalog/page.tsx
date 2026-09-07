'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Compass,
  Orbit,
  Search,
  NotebookPen,
} from 'lucide-react';
import Header from '@/components/astro/header';
import {
  readCatalog,
  updateDiscovery,
  type Discovery,
} from '@/lib/astro/catalog';
import { PLANETS, DEEP } from '@/lib/astro/data';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
export default function Catalog() {
  const [records, setRecords] = useState<Discovery[]>([]),
    [ready, setReady] = useState(false),
    [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [edit, setEdit] = useState<Discovery | null>(null),
    [note, setNote] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setRecords(readCatalog());
    sync();
    setReady(true);
    window.addEventListener('astroguide-catalog', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('astroguide-catalog', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const filtered = records.filter(
    (r) =>
      (filter === 'all' || r.saved) &&
      r.name.toLowerCase().includes(query.toLowerCase()),
  );
  function save(id: string, patch: Partial<Pick<Discovery, 'saved' | 'note'>>) {
    try {
      updateDiscovery(id, patch);
      setRecords(readCatalog());
      setError('');
      return true;
    } catch {
      setError(
        'Your browser could not save this change. Check your storage settings.',
      );
      return false;
    }
  }
  return (
    <main className="catalog-page">
      <Header active="catalog" />
      <section className="catalog-content">
        <div className="catalog-intro">
          <div>
            <p className="eyebrow">YOUR OWN CORNER OF THE COSMOS</p>
            <h1>A universe of discoveries.</h1>
            <p>Every world you visit. Every star that makes you wonder.</p>
          </div>
          <Link href="/explore" className="primary-button">
            Keep exploring <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="guest-banner">
          <Orbit size={20} />
          <div>
            <strong>Your guest catalog</strong>
            <span>
              Saved in this browser on this laptop. Account syncing will come
              later.
            </span>
          </div>
          <Link href="/login">
            About accounts <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="catalog-toolbar">
          <Tabs value={filter} onValueChange={(v) => setFilter(String(v))}>
            <TabsList variant="line">
              <TabsTrigger value="all">
                All discoveries{' '}
                <span className="count-badge">{records.length}</span>
              </TabsTrigger>
              <TabsTrigger value="saved">
                Bookmarked{' '}
                <span className="count-badge">
                  {records.filter((r) => r.saved).length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="catalog-search">
            <Search size={17} />
            <input
              aria-label="Search your discoveries"
              placeholder="Find a discovery…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="status" className="form-error">
            {error}
          </p>
        )}
        {!ready ? (
          <p className="empty-message">Opening your catalog…</p>
        ) : filtered.length === 0 ? (
          <div className="catalog-empty">
            <Compass size={45} />
            <h2>
              {query
                ? 'No matching discoveries.'
                : filter === 'saved'
                  ? 'Keep your favorites close.'
                  : 'Your first discovery is out there.'}
            </h2>
            <p>
              {query
                ? 'Try another object name.'
                : filter === 'saved'
                  ? 'Bookmark an object in the explorer to find it here.'
                  : 'Visit an object in the explorer and it will appear in your catalog.'}
            </p>
            <Link href="/explore" className="primary-button">
              Enter the explorer <ArrowUpRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="discovery-grid">
            {filtered.map((r) => {
              const o = [...PLANETS, ...DEEP].find((o) => o.id === r.id);
              const image =
                o?.image || (o?.body ? '/assets/' + o.id + '-map.jpg' : null);
              return (
                <article className="discovery-card" key={r.id}>
                  <Link
                    className={'discovery-image ' + (!image ? 'no-image' : '')}
                    href={'/explore?object=' + encodeURIComponent(r.id)}
                  >
                    {image ? (
                      <img src={image} alt={r.name} />
                    ) : (
                      <Orbit size={42} />
                    )}
                    <span className="type-chip">{r.type}</span>
                  </Link>
                  <div className="discovery-info">
                    <div>
                      <h2>
                        <Link
                          href={'/explore?object=' + encodeURIComponent(r.id)}
                        >
                          {r.name}
                        </Link>
                      </h2>
                      <button
                        aria-label={
                          r.saved
                            ? 'Remove bookmark from ' + r.name
                            : 'Bookmark ' + r.name
                        }
                        onClick={() => save(r.id, { saved: !r.saved })}
                      >
                        {r.saved ? <Check size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                    <p>
                      First explored{' '}
                      {new Date(r.viewedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {r.note && <p className="discovery-note">{r.note}</p>}
                    <div className="discovery-actions">
                      <button
                        onClick={() => {
                          setEdit(r);
                          setNote(r.note);
                        }}
                      >
                        <NotebookPen size={14} />
                        {r.note ? 'Edit note' : 'Add a note'}
                      </button>
                      <Link
                        href={'/explore?object=' + encodeURIComponent(r.id)}
                      >
                        Visit again <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent className="note-dialog">
          <DialogTitle>Field notes · {edit?.name}</DialogTitle>
          <DialogDescription>
            Keep a thought, a question, or an observation for your next visit.
          </DialogDescription>
          <Textarea
            aria-label="Discovery note"
            placeholder="What caught your attention?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            maxLength={4000}
          />
          <button
            className="primary-button"
            onClick={() => {
              if (edit && save(edit.id, { note: note.trim() })) setEdit(null);
            }}
          >
            Save note <Check size={17} />
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
