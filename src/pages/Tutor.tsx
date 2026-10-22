import { useSearchParams } from 'react-router-dom';
import { lessons } from '../data/curriculum';
import { unlocked } from '../lib/learning';
import { useLearning } from '../store';
import TutorPanel from '../components/TutorPanel';

export default function TutorPage() {
  const [params,setParams]=useSearchParams();
  const {progress}=useLearning();
  const accessible=lessons.filter(l=>unlocked(progress,l.index));
  const lesson=accessible.find(l=>l.id===params.get('materi'))??accessible[0];
  return <div className="container page-shell tutor-page"><div className="page-heading"><div><p className="eyebrow">TUTOR PRIBADI, MELALUI CHATGPT-MU</p><h1>Bertanya itu<br/><span>bagian dari belajar.</span></h1><p>Pahami materinya, lalu coba kalimatmu sendiri.</p></div></div><label className="tutor-lesson-picker">Materi yang dibahas<select value={lesson.id} onChange={e=>setParams({materi:e.target.value})}>{accessible.map(l=><option key={l.id} value={l.id}>{l.index+1}. {l.title}</option>)}</select></label><TutorPanel key={lesson.id} lesson={lesson} standalone/></div>;
}
