import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Layers3, RotateCcw } from 'lucide-react';
import { allVocabulary } from '../data/curriculum';
import { jakartaDate } from '../lib/learning';
import { useLearning } from '../store';

export default function ReviewPage() {
  const { progress, send } = useLearning();
  const [today] = useState(jakartaDate());
  const [queue] = useState(() => allVocabulary.filter(w => progress.reviews[w.id] && progress.reviews[w.id].due <= today).sort((a,b) => progress.reviews[a.id].due.localeCompare(progress.reviews[b.id].due)).slice(0,20));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = queue[index];
  const remaining = allVocabulary.filter(w => progress.reviews[w.id]?.due <= jakartaDate()).length;
  const hasVocabulary = allVocabulary.some(w => progress.reviews[w.id]);
  const rate = (remembered: boolean) => {
    if (!card) return;
    send({ id: crypto.randomUUID(), type: 'review', cardId: card.id, remembered, date: jakartaDate(), at: Date.now() });
    setIndex(index + 1); setFlipped(false);
  };
  return <div className="container page-shell review-page"><div className="page-heading"><div><p className="eyebrow">BERJUMPA SEBELUM LUPA</p><h1>Sedikit pengulangan.<br/><span>Banyak yang melekat.</span></h1><p>Lihat katanya, ingat artinya, lalu balik kartunya.</p></div><div className="review-page-icon"><Layers3 size={42}/></div></div>
    {card ? <div className="review-session"><div className="review-topline"><span>Kartu {index+1} dari {queue.length}</span><span>{progress.days[jakartaDate()]?.reviews ?? 0} kartu diulang hari ini</span></div><button className={`flashcard ${flipped ? 'flipped' : ''}`} aria-label={flipped ? 'Jawaban flashcard' : 'Balik kartu untuk melihat arti'} onClick={() => setFlipped(!flipped)}><span className="flashcard-kicker">{flipped ? 'MAKNA KATANYA' : 'MASIH INGAT KATA INI?'}</span><span className="flashcard-word" lang="ja">{card.word}</span>{flipped ? <><span className="flashcard-reading" lang="ja">{card.reading}{progress.settings.romaji && ` · ${card.romaji}`}</span><strong className="flashcard-meaning">{card.meaning}</strong></> : <span className="flashcard-hint"><RotateCcw size={16}/>Ketuk untuk membuka</span>}</button>{flipped && <div className="review-buttons"><button className="button button-outline" onClick={() => rate(false)}><RotateCcw size={18}/>Ulang besok</button><button className="button button-dark" onClick={() => rate(true)}><Check size={18}/>Masih ingat</button></div>}<p className="review-help">“Masih ingat” memberi jarak 1, 3, 7, 14, lalu 30 hari.<br/>“Ulang besok” mengembalikan jarak ke satu hari.</p></div> : <div className="empty-state review-complete"><Check size={36}/><h2>{queue.length ? 'Kata-katanya sudah disapa.' : 'Belum ada kartu yang menunggu.'}</h2><p>{queue.length ? `${queue.length} kartu selesai. ${remaining ? `Masih ada ${remaining} kartu; mulai sesi berikutnya saat siap.` : 'Kembali lagi saat jadwal berikutnya tiba.'}` : hasVocabulary ? 'Pengulanganmu sudah selesai untuk sekarang. Pelajari materi lain atau kembali besok.' : 'Selesaikan satu materi untuk membuka enam flashcard pertamamu.'}</p>{remaining > 0 && <button className="button button-dark" onClick={() => window.location.reload()}>Sesi berikutnya<ArrowRight size={18}/></button>}<Link className="button button-outline" to="/materi">Jelajahi materi<ArrowRight size={18}/></Link></div>}
  </div>;
}
