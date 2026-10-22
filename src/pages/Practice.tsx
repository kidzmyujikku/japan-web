import { useSearchParams } from 'react-router-dom';
import { lessons } from '../data/curriculum';
import { unlocked } from '../lib/learning';
import { useLearning } from '../store';
import { useAI } from '../ai-context';
import PracticePanel from '../components/PracticePanel';

export default function PracticePage() {
  const [params, setParams] = useSearchParams();
  const { progress } = useLearning();
  const { status } = useAI();
  const accessible = lessons.filter(l => unlocked(progress, l.index));
  const lesson = accessible.find(l => l.id === params.get('materi')) ?? accessible[0];
  return <div className="container page-shell practice-page"><div className="page-heading"><div><p className="eyebrow">LATIHAN BARU, TOPIK YANG KAMU PILIH</p><h1>Topik yang sama.<br/><span>Tantangan yang baru.</span></h1><p>Ulangi sampai paham, dengan variasi yang dibuat untuk sesi ini.</p></div></div><label className="tutor-lesson-picker">Topik latihan<select value={lesson.id} onChange={e => setParams({ materi: e.target.value })}>{accessible.map(l => <option key={l.id} value={l.id}>{l.index + 1}. {l.title}</option>)}</select></label><PracticePanel key={`${lesson.id}:${status?.activeId ?? 'guest'}`} lesson={lesson}/></div>;
}
