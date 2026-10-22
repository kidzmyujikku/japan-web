import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import KanaInput from './KanaInput';

afterEach(cleanup);
function Input({ script = 'hiragana' as 'hiragana' | 'katakana', auto = true }) {
  const [value,setValue] = useState('');
  return <KanaInput value={value} onChange={setValue} auto={auto} onAutoChange={() => {}} script={script} disabled={false}/>;
}
describe('kana input', () => {
  function enter(input: HTMLInputElement, text: string) {
    for (const char of text) {
      const next = input.value + char;
      fireEvent.input(input, { target: { value: next, selectionStart: next.length, selectionEnd: next.length }, data: char, inputType: 'insertText' });
    }
  }
  it.each([['konnichiwa','こんにちは'],['konnichiha','こんにちは'],['konnnichiha','こんにちは'],['konbanwa','こんばんは'],['konnbanwa','こんばんは'],['nna','んな'],['nni','んに'],['nnya','んにゃ']])('converts incremental %s to %s without swallowing a following vowel', (romaji, kana) => {
    const view = render(<Input/>); const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    enter(input, romaji); fireEvent.blur(input); expect(input.value).toBe(kana);
  });
  it.each([['konnichiwa','こんにちは'],['KONNICHIWA','こんにちは'],['konnnichiha','こんにちは'],['konbanwa','こんばんは'],[' konnichiwa ',' こんにちは ']])('accepts pasted %s', (romaji, kana) => {
    const view = render(<Input/>); const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:romaji,selectionStart:romaji.length,selectionEnd:romaji.length},inputType:'insertFromPaste'});
    fireEvent.blur(input); expect(input.value).toBe(kana);
  });
  it('does not rewrite an incorrect greeting pasted or composed as Japanese kana', () => {
    const view = render(<Input/>); const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:'こんにちわ',selectionStart:5,selectionEnd:5},inputType:'insertFromPaste'}); fireEvent.blur(input);
    expect(input.value).toBe('こんにちわ');
    fireEvent.compositionStart(input); fireEvent.input(input,{target:{value:'こんばんわ'},isComposing:true}); fireEvent.compositionEnd(input); fireEvent.blur(input);
    expect(input.value).toBe('こんばんわ');
  });
  it('edits in the middle, handles deletion after nn, and supports katakana greetings', () => {
    const view = render(<Input/>); const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    enter(input,'nn'); expect(input.value).toBe('ん');
    fireEvent.input(input,{target:{value:'',selectionStart:0,selectionEnd:0},inputType:'deleteContentBackward'}); enter(input,'i'); expect(input.value).toBe('い');
    fireEvent.input(input,{target:{value:'ねkaこ',selectionStart:3,selectionEnd:3},inputType:'insertText'}); expect(input.value).toBe('ねかこ');
    fireEvent.input(input,{target:{value:'',selectionStart:0,selectionEnd:0},inputType:'deleteContentBackward'});
    fireEvent.click(view.getByRole('button',{name:'カ Katakana'})); enter(input,'konnichiwa'); expect(input.value).toBe('コンニチハ');
  });
  it.each([['ka','か'],['neko','ねこ'],['kitte','きって'],['kya','きゃ'],['nn','ん']])('converts %s to %s through an actual input event', (romaji,kana) => {
    const view = render(<Input/>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:romaji,selectionStart:romaji.length,selectionEnd:romaji.length}});
    expect(input.value).toBe(kana);
  });
  it('converts katakana and accepts native Japanese input with conversion disabled', () => {
    const view = render(<Input script="katakana"/>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:'pan',selectionStart:3,selectionEnd:3}});
    fireEvent.blur(input);
    expect(input.value).toBe('パン');
    cleanup();
    const native = render(<Input auto={false}/>);
    const nativeInput = native.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.change(nativeInput,{target:{value:'ねこ'}});
    expect(nativeInput.value).toBe('ねこ');
  });
  it('does not convert native IME composition prematurely', () => {
    const view = render(<Input/>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.compositionStart(input);
    fireEvent.input(input,{target:{value:'がっこう'},isComposing:true});
    fireEvent.compositionEnd(input);
    expect(input.value).toBe('がっこう');
  });
  it('preserves backspace, handles pasted romaji, and converts existing text on script change', () => {
    const view = render(<Input/>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:'neko',selectionStart:4,selectionEnd:4},inputType:'insertFromPaste'});
    expect(input.value).toBe('ねこ');
    fireEvent.input(input,{target:{value:'ね',selectionStart:1,selectionEnd:1},inputType:'deleteContentBackward'});
    expect(input.value).toBe('ね');
    fireEvent.click(view.getByRole('button',{name:'カ Katakana'}));
    expect(input.value).toBe('ネ');
    fireEvent.click(view.getByRole('button',{name:'ひ Hiragana'}));
    expect(input.value).toBe('ね');
  });
  it('finalizes a pending n on blur', () => {
    const view = render(<Input/>);
    const input = view.getByLabelText('Jawaban dalam kana') as HTMLInputElement;
    fireEvent.input(input,{target:{value:'n',selectionStart:1,selectionEnd:1}});
    fireEvent.blur(input);
    expect(input.value).toBe('ん');
  });
});
