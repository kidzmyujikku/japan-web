import { BrowserRouter, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { LearningProvider, useLearning } from './store';
import { firebaseReady } from './lib/firebase';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import LibraryPage from './pages/Library';
import LessonPage from './pages/Lesson';
import QuizPage from './pages/Quiz';
import ReviewPage from './pages/Review';
import KanjiPage from './pages/Kanji';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import TutorPage from './pages/Tutor';
import PracticePage from './pages/Practice';
import { AIProvider } from './ai-store';

function LegacyTutor() { const { search } = useLocation(); return <Navigate to={`/latihan${search}`} replace/>; }

function Content() {
  const { user, authLoading, ready, error, retry } = useLearning();
  if (authLoading || (user && !ready)) return <div className="loading-screen" role="status"><span className="brand-mark" lang="ja">日</span><p>Membuka ruang belajarmu…</p></div>;
  if (firebaseReady && !user) return <LoginPage/>;
  if (user && error && !ready) return <div className="empty-state"><h1>Belum bisa membuka progres.</h1><p>{error}</p><button onClick={retry}>Coba lagi</button></div>;
  return <Routes><Route element={<Layout/>}><Route index element={<HomePage/>}/><Route path="materi" element={<LibraryPage/>}/><Route path="materi/:id" element={<LessonPage/>}/><Route path="kuis/:id" element={<QuizPage/>}/><Route path="ulangi" element={<ReviewPage/>}/><Route path="kanji" element={<KanjiPage/>}/><Route path="latihan" element={<PracticePage/>}/><Route path="tutor" element={<LegacyTutor/>}/><Route path="bantuan" element={<TutorPage/>}/><Route path="pengaturan" element={<SettingsPage/>}/><Route path="*" element={<div className="container empty-state"><h1>Halaman ini belum ada.</h1><Link className="button button-dark" to="/">Kembali ke beranda</Link></div>}/></Route></Routes>;
}
export default function App() { return <BrowserRouter><LearningProvider><AIProvider><Content/></AIProvider></LearningProvider></BrowserRouter>; }
