import { ArrowUpRight, Check, ChevronRight, Cloud, CloudUpload, HardDrive, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLearning } from '../store';
import { hasKanji, wordChunks } from '../data/kanji';
import type { StudyWord } from '../data/kanji';

export function RubyText({ text, furigana, onWordClick }: { text: string; furigana?: boolean; onWordClick?: (word: StudyWord) => void }) {
  const { progress } = useLearning();
  const show = furigana ?? progress.settings.furigana;
  if (onWordClick) return <>{wordChunks(text).map((chunk, i) => chunk.entry && hasKanji(chunk.text)
    ? <button key={i} type="button" className="kanji-inline" aria-label={`Lihat bacaan dan arti ${chunk.text}`} onClick={() => onWordClick(chunk.entry!)}><ruby lang="ja">{chunk.text}{show && <rt>{chunk.entry.reading}</rt>}</ruby></button>
    : <span key={i}>{chunk.text}</span>)}</>;
  return <RubyContent text={text} furigana={show}/>;
}

export function RubyContent({ text, furigana }: { text: string; furigana: boolean }) {
  const chunks = text.split(/([\p{Script=Han}々ヶ]+[ぁ-ゖァ-ヺー]*\{[^}]+\})/gu);
  return <>{chunks.map((chunk, i) => {
    const match = chunk.match(/^(.+)\{([^}]+)\}$/u);
    return match ? <ruby key={i}>{match[1]}{furigana && <rt>{match[2]}</rt>}</ruby> : <span key={i}>{chunk}</span>;
  })}</>;
}

export function ActionLink({ to, children, secondary = false, small = false }: { to: string; children: React.ReactNode; secondary?: boolean; small?: boolean }) {
  return <Link to={to} className={`button ${secondary ? 'button-outline' : 'button-dark'} ${small ? 'button-small' : ''}`}>{children}<ArrowUpRight size={18}/></Link>;
}

export function SyncStatus() {
  const { sync, retry, error, user } = useLearning();
  const Icon = sync === 'local' ? HardDrive : sync === 'saved' ? Cloud : sync === 'saving' ? CloudUpload : AlertCircle;
  const text = { local: 'Di perangkat ini', saved: 'Tersinkron', saving: 'Menyimpan…', error: user ? 'Belum tersinkron' : 'Belum tersimpan' }[sync];
  return <div className={`sync-status ${sync}`} role="status"><Icon size={15}/><span>{text}</span>{sync === 'error' && <button onClick={retry} title={error}>Coba lagi</button>}</div>;
}

export function ModeSwitch() {
  const { progress, setSettings } = useLearning();
  return <div className="mode-switch" role="group" aria-label="Mode belajar">
    <button aria-pressed={progress.settings.mode === 'explore'} onClick={() => setSettings({ ...progress.settings, mode: 'explore' })}>Eksplorasi</button>
    <button aria-pressed={progress.settings.mode === 'challenge'} onClick={() => setSettings({ ...progress.settings, mode: 'challenge' })}><Sparkles size={14}/>Tantangan</button>
  </div>;
}

export function Breadcrumb({ label }: { label: string }) {
  return <div className="breadcrumb"><Link to="/materi">Materi</Link><ChevronRight size={14}/><span>{label}</span></div>;
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  return <div className="setting-row"><div><strong>{label}</strong>{description && <p>{description}</p>}</div><button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span>{checked && <Check size={12}/>}</span></button></div>;
}

export function InlineKana() {
  return <svg className="inline-kana" viewBox="0 0 96 48" role="img" aria-label="Ilustrasi kana"><rect width="96" height="48" rx="24" fill="#FFD166"/><text x="22" y="34" fontSize="29" fill="#18233D" fontFamily="Noto Sans JP">あ</text><path d="M65 12v24M53 24h24" stroke="#18233D" strokeWidth="2"/></svg>;
}
