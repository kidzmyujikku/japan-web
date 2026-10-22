import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAI } from '../ai-context';

export default function ChatGPTConnection({ compact = false }: { compact?: boolean }) {
  const {status,loading,connecting,error,notice,loginUrl,connect,select,disconnect,refresh,acknowledge}=useAI();
  const [copied,setCopied]=useState(false);
  const profile=status?.profiles.find(p=>p.id===status.activeId);
  const welcome=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(status?.sharing && profile && !profile.welcomeSeen && !welcome.current?.open)welcome.current?.showModal();else if((!status?.sharing || profile?.welcomeSeen)&&welcome.current?.open)welcome.current.close();},[status?.sharing,profile]);
  return <section className={`chatgpt-connection ${compact?'compact':''}`} aria-label="Koneksi ChatGPT">
    <div className="chatgpt-connection-heading"><span className="connection-dot" data-connected={Boolean(status?.sharing)}/><div><strong>{status?.sharing?'Using ChatGPT plan':'Gunakan langganan ChatGPT-mu.'}</strong><p>{status?.sharing?profile?.email:'Hubungkan akun Plus atau Pro untuk memakai tutor tanpa API key.'}</p></div>{status?.sharing && <Check size={20}/>}</div>
    {loading ? <p className="connection-loading" role="status"><LoaderCircle size={16}/>Memeriksa koneksi tutor…</p> : <>
      {status?.profiles.length ? <label className="profile-picker">Akun ChatGPT<select value={status.activeId??''} disabled={connecting} onChange={e=>{void select(e.target.value);}}><option value="" disabled>Pilih akun tersimpan</option>{status.profiles.map((p,i)=><option key={p.id} value={p.id}>{p.email||p.name} · koneksi {i+1}</option>)}</select></label>:null}
      <div className="connection-actions"><button className="button button-dark" disabled={connecting} onClick={()=>{void connect(profile?.id);}}>{connecting?<><LoaderCircle className="spin" size={17}/>Selesaikan login di tab ChatGPT</>:status?.connected?'Hubungkan ulang':'Continue with ChatGPT'}{!connecting && <ArrowUpRight size={17}/>}</button>{status?.profiles.length ? <button className="text-link" disabled={connecting} onClick={()=>{void connect();}}>Tambah akun</button>:null}{status?.connected && <button className="text-link" disabled={connecting} onClick={()=>{void disconnect();}}><LogOut size={15}/>Putuskan koneksi</button>}</div>
      {status?.connected && !status.sharing && <p className="connection-warning">Identitas terhubung, tetapi izin memakai paket belum aktif. Hubungkan ulang dan izinkan penggunaan paket.</p>}
      {connecting && <><p className="small-note">Selesaikan login di browser sistem yang terbuka. Pilih akunmu dan tinjau izin di halaman resmi ChatGPT, lalu kembali ke sini.</p><div className="connection-actions">{loginUrl && <button className="text-link" onClick={()=>{void navigator.clipboard.writeText(loginUrl).then(()=>setCopied(true)).catch(()=>setCopied(false));}}>{copied?'Tautan login disalin':'Salin tautan untuk Chrome / Edge'}</button>}<button className="text-link" onClick={()=>{setCopied(false);void connect(profile?.id);}}>Mulai ulang login</button></div></>}
      {(status?.sharing || status?.connected) && <a className="text-link manage-usage" href="https://chatgpt.com/settings/usage" target="_blank" rel="noreferrer">Manage usage<ArrowUpRight size={15}/></a>}
    </>}
    {error && <div className="connection-error" role="alert"><p>{error}</p><button className="text-link" onClick={()=>{void refresh();}}><RefreshCw size={15}/>Periksa kembali</button></div>}
    {notice && <p className="small-note" role="status">{notice}</p>}
    {!compact && <p className="connection-privacy"><ShieldCheck size={16}/>Pemakaian berbagi kuota ChatGPT-mu. Token akun disimpan oleh layanan lokal, bukan di browser.</p>}
    <dialog className="ai-welcome" ref={welcome} onCancel={e=>{e.preventDefault();void acknowledge();}} aria-labelledby="ai-welcome-title"><span className="welcome-check"><Check size={28}/></span><h2 id="ai-welcome-title">You're using your ChatGPT plan</h2><p>Pertanyaan tutor memakai kuota langganan ChatGPT-mu yang sama. Kamu dapat mengatur batas aplikasi dan meninjau pemakaian di pengaturan ChatGPT.</p><a className="text-link" href="https://chatgpt.com/settings/usage" target="_blank" rel="noreferrer">Manage usage<ArrowUpRight size={16}/></a><button className="button button-dark" onClick={()=>{void acknowledge();}}>Got it<Check size={17}/></button></dialog>
  </section>;
}
