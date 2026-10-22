import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { LearningContext } from '../context';
import type { Store } from '../context';
import { emptyProgress } from '../lib/learning';
import { QuizQuestion } from './Quiz';

afterEach(cleanup);
const store: Store = { progress: emptyProgress(), attempts: [], send: vi.fn(), setSettings: vi.fn(), retry: vi.fn(), sync: 'local', error: '', user: null, authLoading: false, ready: true, logout: vi.fn() };
describe('typed quiz answer', () => {
  it('uses learned kanji in sentence order without furigana even when reading help is enabled', () => {
    const onNext = vi.fn();
    const question = { id: 'teacher', type: 'order' as const, prompt: 'Susun: Saya guru.', tokens: ['私{わたし}', 'は', '先生{せんせい}', 'です'], answer: ['私{わたし}', 'は', '先生{せんせい}', 'です'], explanation: '先生{せんせい} berarti guru.' };
    const view = render(<LearningContext.Provider value={store}><QuizQuestion question={question} index={0} timer={0} showSolution={question.answer.join('')} onNext={onNext}/></LearningContext.Provider>);
    for (const word of ['私', 'は', '先生', 'です']) fireEvent.click(view.getByRole('button', { name: word }));
    expect(view.container.querySelector('rt')).toBeNull();
    expect(view.container.textContent).not.toContain('{');
    fireEvent.click(view.getByRole('button', { name: 'Periksa jawaban' }));
    expect(view.getByText('Tepat sekali.')).toBeDefined();
    expect(view.container.querySelector('rt')).toBeNull();
    expect(view.container.textContent).not.toContain('わたし');
    fireEvent.click(view.getByRole('button', { name: 'Soal berikutnya' }));
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ correct: true, response: '私 / は / 先生 / です' }));
  });
  it('grades konnichiwa as the correct written greeting without relaxing kana spelling checks', () => {
    const onNext = vi.fn();
    const view = render(<LearningContext.Provider value={store}><QuizQuestion question={{ id:'hello', type:'type', prompt:'Ketik bacaan halo/selamat siang.', answers:['こんにちは'], script:'hiragana', explanation:'Salam ini ditulis こんにちは.' }} index={0} timer={0} onNext={onNext}/></LearningContext.Provider>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    for(const char of 'konnichiwa') { const raw = input.value + char; fireEvent.input(input,{target:{value:raw,selectionStart:raw.length,selectionEnd:raw.length},data:char,inputType:'insertText'}); }
    fireEvent.blur(input); expect(input.value).toBe('こんにちは');
    fireEvent.click(view.getByRole('button',{name:'Periksa jawaban'}));
    expect(view.getByText('Tepat sekali.')).toBeDefined();
    fireEvent.click(view.getByRole('button',{name:'Soal berikutnya'})); expect(onNext).toHaveBeenCalledWith(expect.objectContaining({correct:true,response:'こんにちは'}));
  });
  it('still counts incorrect kana entered directly as wrong', () => {
    const view = render(<LearningContext.Provider value={store}><QuizQuestion question={{ id:'hello', type:'type', prompt:'Ketik salam siang.', answers:['こんにちは'], script:'hiragana', explanation:'Salam ini ditulis こんにちは.' }} index={0} timer={0} onNext={vi.fn()}/></LearningContext.Provider>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:'こんにちわ',selectionStart:5,selectionEnd:5},inputType:'insertFromPaste'}); fireEvent.blur(input);
    fireEvent.click(view.getByRole('button',{name:'Periksa jawaban'})); expect(view.getByText('Satu hal baru untuk diingat.')).toBeDefined();
  });
});
