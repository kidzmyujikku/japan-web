import { useLayoutEffect, useRef, useState } from 'react';
import { RubyContent } from './Shared';
import { practicePlain } from '../lib/practice-writing';
import { Check } from 'lucide-react';
import type { Question } from '../types';
import './MatchingQuestion.css';

type Pair = Extract<Question, { type: 'match' }>['pairs'][number];
const colors = ['#167D8D', '#BD4C3E', '#766098', '#94641B'];
type Connection = { left: number; path: string };
export default function MatchingQuestion({ pairs, rights, matches, disabled, onMatch, furigana = false }: { furigana?: boolean; pairs: Pair[]; rights: string[]; matches: Record<number, string>; disabled: boolean; onMatch: (left: number, right: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [lines, setLines] = useState<Connection[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const leftButtons = useRef(new Map<number, HTMLButtonElement>());
  const rightButtons = useRef(new Map<string, HTMLButtonElement>());
  useLayoutEffect(() => {
    const node = grid.current;
    if (!node) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const box = node.getBoundingClientRect();
      setLines(Object.entries(matches).flatMap(([index, right]) => {
        const left = Number(index), start = leftButtons.current.get(left)?.getBoundingClientRect(), end = rightButtons.current.get(right)?.getBoundingClientRect();
        if (!start || !end) return [];
        const x1 = start.right - box.left, y1 = start.top + start.height / 2 - box.top;
        const x2 = end.left - box.left, y2 = end.top + end.height / 2 - box.top;
        const bend = (x2 - x1) * .5;
        return [{ left, path: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}` }];
      }));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(node);
    [...leftButtons.current.values(), ...rightButtons.current.values()].forEach(button => observer?.observe(button));
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => { alive = false; observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [matches, pairs, rights]);
  const connect = (left: number, right: string) => { if (!disabled) { onMatch(left, right); setSelected(null); } };
  return <><p className="question-help">Pilih kata di kiri, lalu artinya di kanan. Garis menunjukkan pasanganmu. Kamu juga bisa menyeret kata ke artinya.</p><div ref={grid} className="match-grid connected-match">
    <svg className="match-connections" aria-hidden="true">{lines.map(line => <path key={line.left} data-pair={line.left + 1} d={line.path} stroke={colors[line.left % colors.length]}/>)}</svg>
    <div>{pairs.map((pair, i) => <button ref={node => { if (node) leftButtons.current.set(i, node); else leftButtons.current.delete(i); }} key={pair.left} lang="ja" disabled={disabled} className={`${selected === i ? 'selected' : ''} ${matches[i] ? 'paired' : ''}`} style={{ '--pair-color': colors[i % colors.length] } as React.CSSProperties} draggable={!disabled} onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} aria-pressed={selected === i} aria-label={`${practicePlain(pair.left)}${matches[i] ? `, pasangan ${i + 1}: ${matches[i]}` : ', pilih pasangan'}`} onClick={() => setSelected(selected === i ? null : i)}><span><RubyContent text={pair.left} furigana={furigana}/></span><small>{matches[i] ? <><span className="pair-number">{i + 1}</span>Terhubung</> : 'Pilih pasangan'}</small><span className={`match-port ${matches[i] ? 'linked' : ''}`} aria-hidden="true"/></button>)}</div>
    <div>{rights.map(right => {
      const assigned = Object.keys(matches).find(key => matches[Number(key)] === right), left = assigned === undefined ? null : Number(assigned);
      return <button ref={node => { if (node) rightButtons.current.set(right, node); else rightButtons.current.delete(right); }} key={right} disabled={disabled} className={left !== null ? 'paired' : ''} style={{ '--pair-color': left === null ? '#C5CABC' : colors[left % colors.length] } as React.CSSProperties} aria-label={`${right}${left === null ? '' : `, pasangan ${left + 1} dengan ${practicePlain(pairs[left].left)}`}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('text/plain'); if (/^\d+$/.test(raw) && Number(raw) < pairs.length) connect(Number(raw), right); }} onClick={() => { if (selected !== null) connect(selected, right); }}><span className={`match-port ${left !== null ? 'linked' : ''}`} aria-hidden="true"/><span><RubyContent text={right} furigana={furigana}/></span>{left !== null && <small><span className="pair-number">{left + 1}</span><Check size={13}/>Terhubung</small>}</button>;
    })}</div>
  </div><p className="question-help" role="status">{selected !== null ? `${practicePlain(pairs[selected].left)} dipilih. Pilih artinya di kanan.` : `${Object.keys(matches).length} dari ${pairs.length} pasangan terhubung.`}</p></>;
}
