'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';

type Place = { name: string; latitude: number; longitude: number; admin1?: string; country?: string; id: number };
export default function LocationSearch({ onSelect }: { onSelect: (name: string, lat: number, lon: number) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  async function search() {
    const current = ++request.current;
    setResults([]);
    if (query.trim().length < 2) { setStatus('Enter at least two characters.'); return; }
    setBusy(true); setStatus('Searching places…');
    try {
      const response = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: query.trim(), count: '6', language: 'en', format: 'json' }), { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw Error();
      const payload = await response.json() as { results?: Place[] };
      if (current !== request.current) return;
      const found = (payload.results ?? []).filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
      setResults(found);
      setStatus(found.length ? 'Choose your observing place below.' : 'No places found. Try a nearby city or a postal code.');
    } catch { if (current === request.current) setStatus('Place search is unavailable. Choose a saved place or enter coordinates below.'); }
    finally { if (current === request.current) setBusy(false); }
  }
  function locate() {
    const current = ++request.current;
    setResults([]);
    if (!navigator.geolocation) { setStatus('This browser does not support location. Search for a city instead.'); return; }
    setBusy(true); setStatus('Waiting for your location permission…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (current !== request.current) return;
      onSelect('Current location', coords.latitude, coords.longitude);
      setStatus('Using your current location. Coordinates remain in this page.'); setBusy(false);
    }, error => {
      if (current !== request.current) return;
      setStatus(error.code === 1 ? 'Location access was declined. Search for a city or enter coordinates instead.' : 'Your location could not be found. Try a city search instead.'); setBusy(false);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
  return <section className="location-search" aria-label="Find an observing location">
    <form onSubmit={e => { e.preventDefault(); void search(); }}>
      <label htmlFor="place-search">Find your observing place</label>
      <div className="location-search-row">
        <input id="place-search" value={query} maxLength={100} onChange={e => { setQuery(e.target.value); request.current++; setBusy(false); setResults([]); setStatus(''); }} placeholder="City or postal code" autoComplete="off" />
        <button className="secondary-button" disabled={busy} type="submit"><Search size={16} /> Search</button>
        <button className="secondary-button" disabled={busy} type="button" onClick={locate}><LocateFixed size={16} /> Use my location</button>
      </div>
    </form>
    {status && <p role="status">{status}</p>}
    {results.length > 0 && <ul className="location-results">{results.map(p => {
      const name = [...new Set([p.name, p.admin1, p.country].filter(Boolean))].join(', ');
      return <li key={p.id}><button type="button" onClick={() => { request.current++; onSelect(name, p.latitude, p.longitude); setQuery(name); setResults([]); setStatus('Observing place updated.'); }}>{name}</button></li>;
    })}</ul>}
    <small>City search by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / GeoNames. Device coordinates are used only for sky calculations.</small>
  </section>;
}
