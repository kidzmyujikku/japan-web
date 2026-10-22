import { BookOpen, Home, Layers3, Settings2, ArrowUpRight, Menu, X, WandSparkles, Languages } from 'lucide-react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SyncStatus } from './Shared';
import { useLearning } from '../store';
import StudyTimer from './StudyTimer';

const navigation = [{ to: '/', label: 'Beranda', icon: Home }, { to: '/materi', label: 'Materi', icon: BookOpen }, { to: '/ulangi', label: 'Ulangi', icon: Layers3 }, { to: '/kanji', label: 'Kanji', icon: Languages }, { to: '/latihan', label: 'Latihan', icon: WandSparkles, Languages }, { to: '/pengaturan', label: 'Pengaturan', icon: Settings2 }];
export default function Layout() {
  const { pathname, hash } = useLocation();
  const { error } = useLearning();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    setMenu(false);
    document.getElementById('main-content')?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null;
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return <>
    <a className="skip-link" href="#main-content">Lewati ke konten</a>
    <StudyTimer/>
    <header className="site-header container">
      <Link className="brand" to="/" aria-label="Nichi Nichi, beranda"><span className="brand-mark" lang="ja">日</span><span>nichi<span className="brand-second">nichi</span><small>SEDIKIT SETIAP HARI</small></span></Link>
      <nav className={`desktop-nav ${menu ? 'open' : ''}`} aria-label="Navigasi utama">{navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      <div className="header-right"><SyncStatus/><button className="menu-button icon-button" aria-label={menu ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button><Link className="header-action" to="/materi">Mulai belajar<ArrowUpRight size={17}/></Link></div>
    </header>
    {error && <div className="container"><div className="alert" role="alert">{error}</div></div>}
    <main id="main-content" tabIndex={-1}><Outlet/></main>
    <footer className="site-footer container"><Link className="footer-brand" to="/">nichi nichi<span lang="ja">日々</span></Link><p>Satu langkah kecil. Setiap hari.</p><Link to="/pengaturan">Ruang belajarmu<ArrowUpRight size={15}/></Link></footer>
    <nav className="mobile-nav" aria-label="Navigasi seluler">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20}/><span>{label}</span></NavLink>)}</nav>
  </>;
}
