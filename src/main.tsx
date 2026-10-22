import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import './styles.css';
import './kanji.css';
import './mnemonics.css';
import './kanji-test.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
