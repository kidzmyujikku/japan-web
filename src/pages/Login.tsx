import { useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, ownerUid, readableError } from '../lib/firebase';
import KanaArt from '../components/KanaArt';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!auth || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (reset) { await sendPasswordResetEmail(auth, email); setMessage('Tautan reset kata sandi sudah diminta. Periksa email dan folder spam.'); }
      else {
        const result = await signInWithEmailAndPassword(auth,email,password);
        if (result.user.uid !== ownerUid) { await signOut(auth); setError('Akun ini tidak memiliki akses ke ruang belajar pribadi.'); }
      }
    } catch (e) { setError(readableError(e)); }
    finally { setBusy(false); }
  };
  return <main className="login-page"><div className="login-brand brand"><span className="brand-mark" lang="ja">日</span><span>nichi<span className="brand-second">nichi</span><small>SEDIKIT SETIAP HARI</small></span></div><div className="login-layout container"><div className="login-art"><KanaArt/><h2>Satu langkah kecil.<br/>Setiap hari.</h2></div><section className="login-panel"><p className="eyebrow">RUANG BELAJAR PRIBADIMU</p><h1>{reset ? 'Mulai lagi dengan tenang.' : 'Selamat datang kembali.'}</h1><p>{reset ? 'Kami akan mengirim tautan untuk mengganti kata sandi.' : 'Masuk untuk melanjutkan progres yang sama di semua perangkat.'}</p><form onSubmit={e => { void submit(e); }}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com"/></label>{!reset && <label>Kata sandi<div className="password-field"><input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShow(!show)}>{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></label>}{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button disabled={busy} className="button button-dark" type="submit">{busy ? 'Sebentar…' : reset ? 'Kirim tautan reset' : 'Masuk & lanjutkan'}<ArrowRight size={18}/></button></form><button className="text-link login-reset" onClick={() => { setReset(!reset); setError(''); setMessage(''); }}>{reset && <ArrowLeft size={16}/>} {reset ? 'Kembali ke login' : 'Lupa kata sandi?'}</button><p className="login-private"><ShieldCheck size={17}/>Hanya akun pribadimu yang dapat masuk.</p></section></div></main>;
}
