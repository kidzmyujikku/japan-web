import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Check, Clock3, LockKeyhole, Search } from 'lucide-react';
import { groups, lessons } from '../data/curriculum';
import { unlocked } from '../lib/learning';
import { useLearning } from '../store';
import { ModeSwitch } from '../components/Shared';

export default function LibraryPage() {
  const { progress } = useLearning();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const selected = params.get('kelompok');
  const groupIndex = selected !== null && /^[0-5]$/.test(selected) ? Number(selected) : -1;
  const filtered = lessons.filter(l => (groupIndex < 0 || l.group === groupIndex) && `${l.title} ${l.goal} ${groups[l.group].name}`.toLowerCase().includes(search.toLowerCase()));
  const passed = lessons.filter(l => (progress.lessons[l.id]?.best ?? 0) >= 80).length;
  return <div className="container page-shell library-page">
    <div className="page-heading"><div><p className="eyebrow">JALUR BELAJARMU</p><h1>Dari satu kata,<br/><span>ke banyak cerita.</span></h1><p>24 pelajaran. Pilih langkah yang ingin kamu ambil hari ini.</p></div><ModeSwitch/></div>
    <div className="library-tools"><label className="search-field"><Search size={19}/><input type="search" placeholder="Cari materi…" aria-label="Cari materi" value={search} onChange={e => setSearch(e.target.value)}/></label><span>{passed} / 24 pelajaran lulus</span></div>
    <div className="filter-chips" role="group" aria-label="Filter kelompok"><button aria-pressed={groupIndex === -1} onClick={() => setParams({})}>Semua materi</button>{groups.map((g,i) => <button key={i} aria-pressed={groupIndex === i} onClick={() => setParams({ kelompok: String(i) })}>{g.name}</button>)}</div>
    {progress.settings.mode === 'challenge' && <div className="info-box"><LockKeyhole size={19}/><p>Raih minimal 80% pada semua kuis sebelumnya untuk membuka materi berikutnya. Kamu selalu bisa beralih ke eksplorasi.</p></div>}
    <div className="lesson-grid">{filtered.map(lesson => {
      const record = progress.lessons[lesson.id];
      const open = unlocked(progress, lesson.index);
      const passed = (record?.best ?? 0) >= 80;
      const contents = <><div className={`lesson-glyph color-${groups[lesson.group].color}`} lang="ja">{groups[lesson.group].kana}<span>{String(lesson.index + 1).padStart(2,'0')}</span></div><div className="lesson-card-body"><span className="subtle-label">{groups[lesson.group].name}</span><h2>{lesson.title}</h2><p>{lesson.subtitle}</p><div className="lesson-card-bottom"><span><Clock3 size={14}/>15–20 menit materi</span><span className={`lesson-status ${passed ? 'passed' : ''}`}>{!open ? <><LockKeyhole size={14}/>Terkunci</> : passed ? <><Check size={14}/>{record.best}%</> : record?.studied ? 'Sudah dipelajari' : <ArrowUpRight size={18}/>}</span></div></div></>;
      return open ? <Link key={lesson.id} className="lesson-card" to={`/materi/${lesson.id}`}>{contents}</Link> : <article key={lesson.id} className="lesson-card locked" aria-label={`${lesson.title}, terkunci`}>{contents}</article>;
    })}</div>
    {!filtered.length && <div className="empty-state"><Search size={30}/><h2>Belum ada yang cocok.</h2><p>Coba kata lain atau pilih semua materi.</p><button className="button button-outline" onClick={() => { setSearch(''); setParams({}); }}>Hapus filter</button></div>}
  </div>;
}
