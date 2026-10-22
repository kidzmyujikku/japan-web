import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import MatchingQuestion from './MatchingQuestion';

afterEach(cleanup);
const pairs = [{ left: 'ねこ', right: 'kucing' }, { left: 'いぬ', right: 'anjing' }, { left: 'うみ', right: 'laut' }];
function Board({ disabled = false }) {
  const [matches, setMatches] = useState<Record<number, string>>({});
  return <MatchingQuestion pairs={pairs} rights={['laut','kucing','anjing']} matches={matches} disabled={disabled} onMatch={(left, right) => setMatches(previous => { const next = { ...previous }; for(const k of Object.keys(next)) if(next[Number(k)] === right) delete next[Number(k)]; next[left] = right; return next; })}/>;
}
describe('connected matching exercise', () => {
  it('draws lines for pairs and keeps the existing line while selecting a replacement', () => {
    const view = render(<Board/>);
    fireEvent.click(view.getByRole('button',{name:'ねこ, pilih pasangan'})); fireEvent.click(view.getByRole('button',{name:'kucing'}));
    expect(view.container.querySelectorAll('.match-connections path')).toHaveLength(1);
    expect(view.getByRole('button',{name:'kucing, pasangan 1 dengan ねこ'})).toBeDefined();
    fireEvent.click(view.getByRole('button',{name:'ねこ, pasangan 1: kucing'})); expect(view.container.querySelectorAll('.match-connections path')).toHaveLength(1);
    fireEvent.click(view.getByRole('button',{name:'laut'}));
    expect(view.getByRole('button',{name:'laut, pasangan 1 dengan ねこ'})).toBeDefined();
    expect(view.container.querySelectorAll('.match-connections path')).toHaveLength(1);
  });
  it('reassigns an occupied answer without keeping a stale connection', () => {
    const view = render(<Board/>);
    fireEvent.click(view.getByRole('button',{name:'ねこ, pilih pasangan'})); fireEvent.click(view.getByRole('button',{name:'kucing'}));
    fireEvent.click(view.getByRole('button',{name:'いぬ, pilih pasangan'})); fireEvent.click(view.getByRole('button',{name:'kucing, pasangan 1 dengan ねこ'}));
    expect(view.getByRole('button',{name:'ねこ, pilih pasangan'})).toBeDefined();
    expect(view.getByRole('button',{name:'kucing, pasangan 2 dengan いぬ'})).toBeDefined();
    expect(view.container.querySelectorAll('.match-connections path')).toHaveLength(1);
  });
  it('blocks edits when an answer has already been submitted', () => {
    const view = render(<Board disabled/>);
    expect([...view.container.querySelectorAll('button')].every(button => button.disabled)).toBe(true);
  });
});
