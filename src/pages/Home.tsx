import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Flame, Layers3, Sparkles, Trophy } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { allVocabulary, groups, lessons } from '../data/curriculum';
import { achievements, earnedPoints, jakartaDate, streak, unlocked } from '../lib/learning';
import { useLearning } from '../store';
import KanaArt from '../components/KanaArt';
import { ActionLink, InlineKana, ModeSwitch } from '../components/Shared';

gsap.registerPlugin(ScrollTrigger, useGSAP);
export default function HomePage() {
  const root = useRef<HTMLDivElement>(null);
  const { progress, attempts } = useLearning();
  const [activeGroup, setActiveGroup] = useState(0);
  const [errorIndex, setErrorIndex] = useState(0);
  const today = jakartaDate();
  const passed = lessons.filter(l => (progress.lessons[l.id]?.best ?? 0) >= 80).length;
  const next = lessons.find(l => (progress.lessons[l.id]?.best ?? 0) < 80 && unlocked(progress, l.index)) ?? lessons[0];
  const due = allVocabulary.filter(w => progress.reviews[w.id]?.due <= today).length;
  const awards = achievements(progress);
  const mistakes = attempts.flatMap(a => a.answers.filter(answer => !answer.correct).map(answer => ({ ...answer, lessonId: a.lessonId }))).slice(0,10);
  const mistake = mistakes[errorIndex % Math.max(1, mistakes.length)];
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.from('.hero-copy > *', { y: 24, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' });
      gsap.from('.kana-art', { rotation: 4, y: 30, opacity: 0, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.reveal-word', { opacity: .18 }, { opacity: 1, stagger: .12, scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 45%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('.stack-card').forEach((card, i) => {
        if (i > 0) gsap.from(card, { y: 75, rotation: i % 2 ? -2 : 2, scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 40%', scrub: true } });
      });
    });
    return () => media.revert();
  }, { scope: root });

  return <div ref={root} className="home-page">
    <section className="hero container">
      <div className="hero-copy"><p className="eyebrow">RUANG KECIL UNTUK LANGKAH BESAR</p><h1>Belajar Jepang.<br/><span>Sedikit setiap hari.</span></h1><p className="hero-description">Dari huruf pertama sampai percakapan sederhana.<br className="desktop-break"/> Belajar dengan caramu, tumbuh dengan ritmemu.</p><div className="hero-actions"><ActionLink to={`/materi/${next.id}`}>Lanjutkan belajar</ActionLink><ActionLink to="/materi" secondary>Jelajahi materi</ActionLink></div><a className="hero-scroll" href="#ritme"><ArrowDown size={16}/>Satu langkah hari ini</a></div>
      <div className="hero-art"><KanaArt/></div>
      <span className="hero-side-note">BUKAN HARUS CEPAT. YANG PENTING MULAI.</span>
    </section>

    <section className="rhythm-section container" id="ritme">
      <div className="section-heading"><div><p className="eyebrow">RITME BELAJARMU</p><h2>Kembali ke langkah kecilmu.</h2></div><ModeSwitch/></div>
      <div className="bento">
        <Link className="bento-continue" to={`/materi/${next.id}`}><div className="card-top"><span><BookOpen size={17}/>Lanjutkan perjalanan</span><ArrowUpRight/></div><div className="continue-kana" aria-hidden="true" lang="ja">{groups[next.group].kana}</div><div><span className="subtle-label">{groups[next.group].name}</span><h3>{next.title}</h3><p>{next.subtitle}</p></div><div className="lesson-progress"><div className="progress-line"><span style={{ width: `${passed / 24 * 100}%` }}/></div><span>{passed} dari 24 pelajaran lulus</span></div></Link>
        <Link className="bento-review" to="/ulangi"><div><span className="card-top-label"><Layers3 size={18}/>Sedikit pengulangan</span><h3>{due ? `${due} kata menunggumu.` : 'Biar makin melekat.'}</h3><p>{due ? 'Temui lagi kata-kata yang sudah kamu kenal.' : 'Selesaikan materi pertamamu untuk membuka flashcard.'}</p></div><span className="round-arrow"><ArrowUpRight/></span></Link>
        <div className="bento-streak"><Flame size={25}/><strong>{streak(progress)}<small>hari</small></strong><p>Ritme berturut-turut</p><div className="week-dots" aria-hidden="true">{Array.from({length:7},(_,i) => <span key={i} className={i < Math.min(7,streak(progress)) ? 'filled' : ''}/>)}</div></div>
        <Link className="bento-award" to="/pengaturan#pencapaian"><Trophy size={25}/><strong>{earnedPoints(progress)}<small>poin</small></strong><p>{awards.filter(a => a.earned).length} dari 4 pencapaian</p><span className="award-label"><Sparkles size={13}/>Setiap usaha berarti</span></Link>
      </div>
      <Link className="home-practice-link" to={`/latihan?materi=${next.id}`}><div><strong>Sudah kenal soalnya? Coba variasi baru.</strong><span>Latihan AI sesuai topik, satu sesi pendek setiap kali.</span></div><span className="text-link">Buat latihan<ArrowRight size={18}/></span></Link>
      <p className="mode-note">{progress.settings.mode === 'explore' ? 'Mode eksplorasi: semua materi terbuka. Ikuti rasa ingin tahumu.' : 'Mode tantangan: raih minimal 80% pada setiap kuis untuk membuka langkah berikutnya.'}</p>
    </section>

    <section className="journey-section container"><div className="section-heading"><div><p className="eyebrow">DARI NOL, SELANGKAH DEMI SELANGKAH</p><h2>Ada banyak cara<br/>untuk mulai <InlineKana/></h2></div><Link className="text-link" to="/materi">Lihat semua materi<ArrowUpRight size={18}/></Link></div>
      <div className="journey-accordion">{groups.map((group,i) => <div className={`journey-panel ${activeGroup === i ? 'expanded' : ''} color-${group.color}`} key={group.name} onMouseEnter={() => setActiveGroup(i)}><button className="journey-toggle" aria-label={`Kelompok ${i+1}: ${group.name}`} aria-expanded={activeGroup === i} aria-controls={`journey-${i}`} onClick={() => setActiveGroup(i)}><span className="journey-number">0{i+1}</span><span className="journey-label">{group.name}</span><span className="journey-glyph" lang="ja">{group.kana}</span></button><div id={`journey-${i}`} className="journey-details" hidden={activeGroup !== i}><h3>{group.title}</h3><p>{group.description}</p><Link to={`/materi?kelompok=${i}`} className="text-link">4 pelajaran<ArrowRight size={18}/></Link></div></div>)}</div>
    </section>

    <section className="statement container"><p>{'Kamu tidak perlu menguasai semuanya hari ini. Cukup satu kata, satu kalimat, satu langkah lagi.'.split(' ').map((word,i) => <span className="reveal-word" key={i}>{word} </span>)}</p><span lang="ja">少しずつ、毎日。</span><small>Sedikit demi sedikit, setiap hari.</small></section>

    <section className="learning-story container"><div className="story-intro"><p className="eyebrow">BELAJAR YANG TERASA RINGAN</p><h2>Kenali.<br/>Coba.<br/><span>Ingat lagi.</span></h2><p>Ruang untuk penasaran, salah, dan mencoba lagi. Semuanya bagian dari perjalanan.</p></div><div className="stack-track"><article className="stack-card color-yellow"><span className="story-step">01 / KENALI</span><h3>Mulai dari yang dekat.</h3><p>Kata sehari-hari, penjelasan singkat, dan contoh yang langsung bisa kamu pakai.</p><div className="story-example" lang="ja"><span>こんにちは</span><small>konnichiwa · halo</small></div></article><article className="stack-card color-coral"><span className="story-step">02 / COBA</span><h3>Belajar dengan melakukan.</h3><p>Pilih, pasangkan, susun, lalu ketik. Ubah romaji menjadi kana langsung dari keyboard biasa.</p><div className="typing-preview"><span>neko</span><ArrowRight/><strong lang="ja">ねこ</strong><Check size={22}/></div></article><article className="stack-card color-teal"><span className="story-step">03 / INGAT LAGI</span><h3>Berjumpa sebelum lupa.</h3><p>Pengulangan kecil dengan jarak yang bertambah. Bukan menghafal semuanya sekaligus.</p><div className="review-intervals"><span>1 hari</span><span>3 hari</span><span>7 hari</span><ArrowRight size={20}/></div></article></div></section>

    <section className="feedback-section container"><div className="feedback-icon"><Sparkles size={32}/></div><div className="feedback-copy"><p className="eyebrow">SALAH ITU BAGIAN DARI BELAJAR</p><h2>{mistake ? 'Coba lihat sekali lagi.' : 'Tempat untuk mencoba lagi.'}</h2>{mistake ? <><p className="feedback-prompt">{mistake.prompt}</p><p>{mistake.explanation}</p><Link className="text-link" to={`/materi/${mistake.lessonId}`}>Buka pelajarannya<ArrowUpRight size={16}/></Link></> : <p>Setelah mencoba kuis, kesalahanmu akan muncul di sini beserta penjelasannya. Setiap percobaan membantumu memahami sedikit lebih banyak.</p>}</div><div className="carousel-controls"><button className="icon-button" aria-label="Kesalahan sebelumnya" disabled={mistakes.length < 2} onClick={() => setErrorIndex((errorIndex - 1 + mistakes.length) % mistakes.length)}><ArrowLeft/></button><button className="icon-button" aria-label="Kesalahan berikutnya" disabled={mistakes.length < 2} onClick={() => setErrorIndex((errorIndex + 1) % mistakes.length)}><ArrowRight/></button></div></section>
    <section className="closing-section"><div className="container closing-inner"><span lang="ja" aria-hidden="true">一歩</span><p className="eyebrow">LANGKAH KECILMU DIMULAI DI SINI</p><h2>Hari ini, satu<br/>langkah lagi.</h2><ActionLink to={`/materi/${next.id}`}>Yuk, mulai belajar</ActionLink><p>Tidak perlu sempurna. Cukup mulai.</p></div></section>
  </div>;
}
