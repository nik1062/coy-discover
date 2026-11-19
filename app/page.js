'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const api = async (url, opts) => {
  const r = await fetch(url, opts);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

function Photo({ p, className = '' }) {
  return (
    <div className={`photo ${className}`} style={{ '--h': (p.id * 47) % 360 }}>
      <span>{p.name[0]}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photo} alt={p.name} draggable={false} onError={(e) => (e.currentTarget.style.display = 'none')} />
    </div>
  );
}

function Card({ p }) {
  return (
    <>
      <Photo p={p} />
      <div className="info">
        <h2>{p.name}, {p.age}</h2>
        <p className="place">{p.place}</p>
        <p>{p.bio}</p>
        <div className="tags">{p.interests.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </>
  );
}

function Deck({ feed, onSwipe }) {
  const [x, setX] = useState(0);
  const [fly, setFly] = useState(0);
  const [drag, setDrag] = useState(false);
  const startX = useRef(null);
  const busy = useRef(false);
  const top = feed[0], next = feed[1];

  const commit = (dir) => {
    if (busy.current || !top) return;
    busy.current = true;
    setFly(dir === 'like' ? 1 : -1);
    setTimeout(() => { onSwipe(top, dir); setX(0); setFly(0); busy.current = false; }, 260);
  };
  const tx = fly ? fly * 520 : x;

  return (
    <div className="deck">
      {next && <div className="card behind"><Card p={next} /></div>}
      {top && (
        <div
          key={top.id}
          className="card"
          style={{ transform: `translateX(${tx}px) rotate(${tx / 18}deg)`, transition: drag && !fly ? 'none' : 'transform .26s ease' }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startX.current = e.clientX; setDrag(true); }}
          onPointerMove={(e) => { if (startX.current !== null && !busy.current) setX(e.clientX - startX.current); }}
          onPointerUp={() => {
            startX.current = null; setDrag(false);
            if (Math.abs(x) > 110) commit(x > 0 ? 'like' : 'pass'); else setX(0);
          }}
          onPointerCancel={() => { startX.current = null; setDrag(false); setX(0); }}
        >
          <Card p={top} />
          <b className="stamp like" style={{ opacity: Math.min(1, Math.max(0, tx / 100)) }}>LIKE</b>
          <b className="stamp nope" style={{ opacity: Math.min(1, Math.max(0, -tx / 100)) }}>NOPE</b>
        </div>
      )}
      <div className="actions">
        <button className="round pass" aria-label="Pass" disabled={!top} onClick={() => commit('pass')}>✕</button>
        <button className="round like" aria-label="Like" disabled={!top} onClick={() => commit('like')}>♥</button>
      </div>
    </div>
  );
}

function Discover() {
  const [feed, setFeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState('swipe');
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [f, m] = await Promise.all([api('/api/feed'), api('/api/matches')]);
      setFeed(f.profiles); setMatches(m.matches); setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onSwipe = async (p, direction) => {
    setFeed((f) => f.filter((x) => x.id !== p.id)); // optimistic: card is gone immediately
    try {
      const r = await api('/api/swipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: p.id, direction }) });
      if (r.matched) { setMatch(r.profile); setMatches((m) => [...m, r.profile]); }
    } catch (e) { setError(e.message); load(); }
  };
  const reset = async () => { await api('/api/reset', { method: 'POST' }); load(); };

  return (
    <section>
      <div className="seg">
        <button className={view === 'swipe' ? 'on' : ''} onClick={() => setView('swipe')}>Swipe</button>
        <button className={view === 'matches' ? 'on' : ''} onClick={() => setView('matches')}>Matches ({matches.length})</button>
      </div>
      {error && <p className="err">{error}</p>}
      {view === 'swipe' && feed === null && <p className="muted">Loading…</p>}
      {view === 'swipe' && feed && feed.length > 0 && <Deck feed={feed} onSwipe={onSwipe} />}
      {view === 'swipe' && feed && feed.length === 0 && (
        <div className="empty">
          <h2>You’re all caught up</h2>
          <p>No new profiles right now. Check your matches, or come back later.</p>
          <button className="btn" onClick={() => setView('matches')}>See matches</button>
          <button className="link" onClick={reset}>Reset demo data</button>
        </div>
      )}
      {view === 'matches' && (matches.length === 0
        ? <div className="empty"><h2>No matches yet</h2><p>Matches show up here when you both like each other.</p></div>
        : <ul className="grid">{matches.map((p) => (
            <li key={p.id}><Photo p={p} /><b>{p.name}, {p.age}</b><span>{p.place}</span></li>
          ))}</ul>)}
      {match && (
        <div className="overlay" role="dialog" aria-label="It’s a match">
          <h1>It’s a match!</h1>
          <Photo p={match} className="big" />
          <p>You and {match.name} like each other.</p>
          <button className="btn" onClick={() => setMatch(null)}>Keep swiping</button>
          <button className="link" onClick={() => { setMatch(null); setView('matches'); }}>View matches</button>
        </div>
      )}
    </section>
  );
}

export default function Page() {
  const [tab, setTab] = useState('discover');
  return (
    <main>
      <header><span className="logo">coy<i /></span></header>
      <div className="body">
        {tab === 'home' ? null : <Discover />}
      </div>
      <nav className="tabs">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Home</button>
        <button className={tab === 'discover' ? 'on' : ''} onClick={() => setTab('discover')}>Discover</button>
      </nav>
    </main>
  );
}
