import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction } from 'firebase/firestore';
import { auth, db, firebaseReady, ownerUid, readableError } from './lib/firebase';
import { applyEvent, emptyProgress } from './lib/learning';
import type { Attempt, LearningEvent, Progress } from './types';
import { LearningContext as Context } from './context';
import type { Store } from './context';

type Cache = { progress: Progress; pending: LearningEvent[]; attempts: Attempt[] };
const keyFor = (uid: string) => `nichinichi-v1:${uid}`;
function loadCache(uid: string): Cache {
  try {
    const stored = localStorage.getItem(keyFor(uid));
    if (stored) { const parsed = JSON.parse(stored) as Cache; return { ...parsed, progress: { ...emptyProgress(), ...parsed.progress, settings: { ...emptyProgress().settings, ...parsed.progress.settings } } }; }
  } catch { /* The UI starts safely if an old cache is unreadable. */ }
  return { progress: emptyProgress(), pending: [], attempts: [] };
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async next => {
      if (next && next.uid !== ownerUid) { await signOut(auth!); setUser(null); }
      else setUser(next);
      setAuthLoading(false);
    });
  }, []);
  return <SessionStore key={user?.uid ?? 'local'} user={user} authLoading={authLoading}>{children}</SessionStore>;
}

function SessionStore({ children, user, authLoading }: { children: ReactNode; user: User | null; authLoading: boolean }) {
  const uid = user?.uid ?? 'local';
  const [cache, setCache] = useState(() => loadCache(uid));
  const cacheRef = useRef(cache);
  const [error, setError] = useState('');
  const [sync, setSync] = useState<Store['sync']>(user ? 'saving' : 'local');
  const [ready, setReady] = useState(!user);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const active = useRef(true);
  const busy = useRef(false);
  const hydrated = useRef(!user);
  const storageHealthy = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const commit = useCallback((next: Cache) => {
    if (!active.current) return;
    cacheRef.current = next;
    setCache(next);
    try { localStorage.setItem(keyFor(uid), JSON.stringify(next)); storageHealthy.current = true; }
    catch { storageHealthy.current = false; setError(user ? 'Penyimpanan browser penuh atau diblokir. Jangan tutup halaman sebelum hasil tersinkron.' : 'Progres belum bisa disimpan karena penyimpanan browser penuh atau diblokir. Jangan tutup halaman sebelum mencoba menyimpan kembali.'); setSync('error'); }
  }, [uid, user]);

  useEffect(() => {
    if (user) return;
    const update = (event: StorageEvent) => {
      if (storageHealthy.current && event.key === keyFor(uid) && event.newValue) {
        const next = loadCache(uid);
        cacheRef.current = next; setCache(next);
      }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [uid, user]);

  const flush = useCallback(async () => {
    if (!user || !db || !hydrated.current || busy.current || !active.current) return;
    busy.current = true;
    if (cacheRef.current.pending.length) setSync('saving');
    try {
      while (cacheRef.current.pending.length && active.current) {
        const event = cacheRef.current.pending[0];
        const stateRef = doc(db, 'users', user.uid, 'progress', 'main');
        const receiptRef = doc(db, 'users', user.uid, 'events', event.id);
        await runTransaction(db, async transaction => {
          const [receipt, snapshot] = await Promise.all([transaction.get(receiptRef), transaction.get(stateRef)]);
          if (receipt.exists()) return;
          const base = snapshot.exists() ? { ...emptyProgress(), ...snapshot.data() } as Progress : emptyProgress();
          transaction.set(stateRef, applyEvent(base, event));
          transaction.set(receiptRef, event);
          if (event.type === 'quiz') transaction.set(doc(db!, 'users', user.uid, 'attempts', event.attempt.id), event.attempt);
        });
        if (!active.current) break;
        commit({ ...cacheRef.current, pending: cacheRef.current.pending.filter(e => e.id !== event.id) });
      }
      if (active.current) { setSync('saved'); setError(''); }
    } catch (e) {
      if (active.current) { setSync('error'); setError(readableError(e)); }
    } finally { busy.current = false; }
  }, [user, commit]);

  useEffect(() => {
    if (!user || !db) return;
    const stopState = onSnapshot(doc(db, 'users', user.uid, 'progress', 'main'), snapshot => {
      const remote = snapshot.exists() ? { ...emptyProgress(), ...snapshot.data() } as Progress : emptyProgress();
      const pending = cacheRef.current.pending.filter(e => !remote.recentEvents.includes(e.id));
      commit({ ...cacheRef.current, progress: remote, pending });
      hydrated.current = true; setReady(true);
      if (!pending.length) setSync('saved');
      void flush();
    }, e => { hydrated.current = false; setError(readableError(e)); setSync('error'); setReady(true); });
    const stopAttempts = onSnapshot(query(collection(db, 'users', user.uid, 'attempts'), orderBy('at', 'desc'), limit(30)), snapshot => {
      const remote = snapshot.docs.map(d => d.data() as Attempt);
      const local = cacheRef.current.pending.filter((e): e is Extract<LearningEvent, { type: 'quiz' }> => e.type === 'quiz').map(e => e.attempt);
      commit({ ...cacheRef.current, attempts: [...new Map([...remote, ...local].map(a => [a.id, a])).values()].sort((a,b) => b.at-a.at).slice(0,30) });
    }, e => { setError(readableError(e)); setSync('error'); });
    const online = () => { void flush(); };
    window.addEventListener('online', online);
    const timer = window.setInterval(() => { if (cacheRef.current.pending.length && navigator.onLine) void flush(); }, 15000);
    return () => { stopState(); stopAttempts(); window.removeEventListener('online', online); clearInterval(timer); };
  }, [user, commit, flush, connectionVersion]);

  const send = useCallback((event: LearningEvent) => {
    if (firebaseReady && !user) return;
    let previous = cacheRef.current;
    if (!user && storageHealthy.current) {
      try { if (localStorage.getItem(keyFor(uid))) previous = loadCache(uid); }
      catch { /* Use the in-memory progress while browser storage is unavailable. */ }
    }
    if (previous.pending.some(e => e.id === event.id) || previous.progress.recentEvents.includes(event.id)) return;
    const attempts = event.type === 'quiz' ? [event.attempt, ...previous.attempts.filter(a => a.id !== event.attempt.id)].slice(0,30) : previous.attempts;
    commit(user ? { ...previous, pending: [...previous.pending, event], attempts } : { progress: applyEvent(previous.progress, event), pending: [], attempts });
    if (user) void flush();
  }, [commit, user, flush, uid]);
  const progress = useMemo(() => cache.pending.reduce(applyEvent, cache.progress), [cache]);
  const value: Store = {
    progress, attempts: cache.attempts, send, sync, error, user, authLoading, ready,
    setSettings: settings => send({ id: crypto.randomUUID(), type: 'settings', settings, at: Date.now() }),
    retry: () => {
      if (!user) {
        try { localStorage.setItem(keyFor(uid), JSON.stringify(cacheRef.current)); storageHealthy.current = true; setSync('local'); setError(''); }
        catch { setSync('error'); }
      } else { setSync('saving'); setError(''); setConnectionVersion(n => n + 1); void flush(); }
    },
    logout: async () => { if (auth) await signOut(auth); },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLearning() {
  const store = useContext(Context);
  if (!store) throw new Error('LearningProvider is missing.');
  return store;
}
