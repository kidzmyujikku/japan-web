import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AIContext } from './ai-context';
import type { AIModel, AIStatus, AIStore } from './ai-context';

async function readJSON<T>(response: Response): Promise<T> {
  let data;
  try { data = await response.json(); } catch { throw new Error('Layanan tutor belum aktif. Buka website melalui layanan lokal Nichi Nichi.'); }
  if (!response.ok) throw new Error(data.error || 'Layanan tutor belum dapat dihubungi.');
  return data as T;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [preference, setPreference] = useState({ account: '', model: '' });
  useEffect(() => {
    const account = status?.activeId ?? '';
    let model = '';
    try { model = localStorage.getItem(`nn-ai-model:${account}`) ?? ''; } catch { /* Use the account catalog default. */ }
    setPreference({ account, model });
  }, [status?.activeId]);
  const preferredModel = preference.account === status?.activeId ? preference.model : '';
  const chooseModel = (model: string) => {
    if (!status?.activeId || !models.some(m => m.slug === model)) return;
    setPreference({ account: status.activeId, model });
    try { localStorage.setItem(`nn-ai-model:${status.activeId}`, model); } catch { /* Session preference still works. */ }
  };
  const statusRef = useRef(status);
  const mounted = useRef(true);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const next = await readJSON<AIStatus>(await fetch('/api/ai/status',{cache:'no-store'}));
      if(!mounted.current || revision.current!==current)return;
      statusRef.current=next;setStatus(next);setConnecting(next.pending);setError(next.authError || '');if(!next.pending)setLoginUrl('');
      if(next.connected && next.sharing){
        const data=await readJSON<{models:AIModel[]}>(await fetch('/api/ai/models',{cache:'no-store'}));
        if(mounted.current && revision.current===current)setModels(data.models);
      } else setModels([]);
    } catch(e){if(mounted.current && revision.current===current){setError(e instanceof Error?e.message:'Koneksi ke layanan tutor terputus.');setModels([]);}}
    finally {if(mounted.current && revision.current===current)setLoading(false);}
  },[]);
  useEffect(()=>{
    mounted.current=true;void refresh();
    const focus=()=>{void refresh();};window.addEventListener('focus',focus);
    return()=>{mounted.current=false;revision.current++;window.removeEventListener('focus',focus);};
  },[refresh]);
  useEffect(()=>{
    if(!connecting)return;
    const timer=window.setInterval(()=>{void refresh();},1500);
    return()=>clearInterval(timer);
  },[connecting,refresh]);
  const post=useCallback(async(path:string,body:unknown,signal?:AbortSignal)=>{
    if(!statusRef.current)await refresh();
    if(!statusRef.current?.csrf)throw new Error('Layanan tutor belum aktif. Muat ulang atau mulai layanan lokal.');
    return fetch(`/api/ai/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-Nichi-CSRF':statusRef.current.csrf},body:JSON.stringify(body),signal});
  },[refresh]);
  const connect=async(profileId?:string)=>{
    setError('');setNotice('');
    setConnecting(true);
    try{const data=await readJSON<{url:string;opened:boolean}>(await post('auth/start',{profileId}));setLoginUrl(data.url);if(!data.opened)setNotice('Browser sistem belum terbuka. Salin tautan login lalu buka di Chrome atau Edge.');}
    catch(e){setConnecting(false);setError(e instanceof Error?e.message:'Login belum dapat dibuka.');}
  };
  const select=async(profileId:string)=>{try{setError('');setNotice('');await readJSON(await post('auth/select',{profileId}));await refresh();}catch(e){setError(e instanceof Error?e.message:'Akun belum dapat dipilih.');}};
  const disconnect=async()=>{try{const data=await readJSON<{message:string}>(await post('auth/logout',{}));setNotice(data.message);await refresh();}catch(e){setError(e instanceof Error?e.message:'Koneksi belum dapat diputuskan.');}};
  const acknowledge=async()=>{try{await readJSON(await post('auth/welcome',{}));await refresh();}catch(e){setError(e instanceof Error?e.message:'Pengaturan belum tersimpan.');}};
  const value:AIStore={status,models,loading,connecting,error,notice,loginUrl,refresh,connect,select,disconnect,acknowledge,post,preferredModel,chooseModel};
  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
