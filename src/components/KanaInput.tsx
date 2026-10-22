import { useEffect, useRef, useState } from 'react';
import { bind, unbind, toHiragana, toKatakana } from 'wanakana';

// Preserve the second n before a vowel (konnichi), including common IME spelling with three ns.
const prepareRomaji = (value: string) => value.replace(/n{2,3}(?=[aiueoy])/gi, "n'n");
function greetingKana(value: string, script: 'hiragana' | 'katakana') {
  const reading = toHiragana(value.trim());
  const correct = reading === 'こんにちわ' ? 'こんにちは' : reading === 'こんばんわ' ? 'こんばんは' : null;
  if (!correct) return value;
  return `${value.match(/^\s*/)?.[0] ?? ''}${script === 'katakana' ? toKatakana(correct) : correct}${value.match(/\s*$/)?.[0] ?? ''}`;
}

export default function KanaInput({ value, onChange, auto, script, disabled, onAutoChange }: { value: string; onChange: (value: string) => void; auto: boolean; script: 'hiragana' | 'katakana'; disabled: boolean; onAutoChange: (value: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [activeScript, setActiveScript] = useState(script);
  const switchScript = (next: 'hiragana' | 'katakana') => {
    setActiveScript(next);
    if (auto) onChange(next === 'hiragana' ? toHiragana(value) : toKatakana(value));
  };
  useEffect(() => {
    const node = input.current;
    if (!node || !auto) return;
    let carry: { value: string; cursor: number } | null = null;
    let source = '', sourceCursor = 0, fromRomaji = false, composing = false;
    const beforeInput = (event: Event) => {
      if (composing || (event as InputEvent).isComposing) { node.dataset.ignoreComposition = 'true'; carry = null; return; }
      node.dataset.ignoreComposition = 'false';
      const cursor = node.selectionStart ?? node.value.length;
      let before = node.value.slice(0, cursor);
      const tail = node.value.slice(cursor);
      // WanaKana commits nn immediately. Restore its pending second n only for the next vowel/y.
      if (carry && cursor === carry.cursor + 1 && node.value.slice(0, carry.cursor) === carry.value.slice(0, carry.cursor) && tail === carry.value.slice(carry.cursor) && /^[aiueoy]$/i.test(node.value.charAt(carry.cursor)) && !(event as InputEvent).inputType?.startsWith('delete')) before = `${before.slice(0, -1)}n${before.slice(-1)}`;
      carry = null;
      before = prepareRomaji(before);
      node.value = before + tail;
      node.setSelectionRange(before.length, before.length);
      source = node.value; sourceCursor = before.length; fromRomaji = /[a-z]/i.test(source);
    };
    const startComposition = () => { composing = true; carry = null; node.dataset.ignoreComposition = 'true'; };
    const endComposition = () => { composing = false; fromRomaji = false; node.dataset.ignoreComposition = 'false'; onChange(node.value); };
    node.addEventListener('input', beforeInput, true);
    node.addEventListener('compositionstart', startComposition);
    node.addEventListener('compositionend', endComposition);
    bind(node, { IMEMode: activeScript === 'hiragana' ? 'toHiragana' : 'toKatakana' });
    const update = (event: Event) => {
      if (composing || (event as InputEvent).isComposing) { onChange(node.value); return; }
      if (fromRomaji) {
        const correct = greetingKana(node.value, activeScript);
        if (correct !== node.value) { const cursor = node.selectionStart ?? correct.length; node.value = correct; node.setSelectionRange(cursor, cursor); }
      }
      if (/(?:^|[^n])nn$/i.test(source.slice(0, sourceCursor))) carry = { value: node.value, cursor: node.selectionStart ?? node.value.length };
      onChange(node.value);
    };
    node.addEventListener('input', update);
    return () => { node.removeEventListener('input', beforeInput, true); node.removeEventListener('input', update); node.removeEventListener('compositionstart', startComposition); node.removeEventListener('compositionend', endComposition); unbind(node); delete node.dataset.ignoreComposition; };
  }, [auto, activeScript, onChange]);
  const finalize = () => { if (auto && input.current) { const raw = prepareRomaji(input.current.value); const converted = activeScript === 'katakana' ? toKatakana(raw) : toHiragana(raw); onChange(/[a-z]/i.test(raw) ? greetingKana(converted, activeScript) : converted); } };
  return <div className="kana-input"><div className="kana-input-tools"><div role="group" aria-label="Jenis kana"><button type="button" disabled={disabled} aria-pressed={activeScript === 'hiragana'} onClick={() => switchScript('hiragana')}>ひ Hiragana</button><button type="button" disabled={disabled} aria-pressed={activeScript === 'katakana'} onClick={() => switchScript('katakana')}>カ Katakana</button></div><label><input type="checkbox" checked={auto} disabled={disabled} onChange={e => onAutoChange(e.target.checked)}/>Konversi otomatis</label></div><input ref={input} lang="ja" value={value} onChange={e => { if (!auto) onChange(e.target.value); }} onBlur={finalize} disabled={disabled} aria-label="Jawaban dalam kana" placeholder={auto ? 'Ketik romaji di sini…' : 'Ketik dengan keyboard Jepang…'} autoComplete="off" autoCapitalize="none" spellCheck={false}/><p>{auto ? 'Keyboard biasa bisa: konnichiwa → こんにちは, kitte → きって, nn → ん. Partikel lain は・へ・を: ketik ha, he, wo.' : 'Konversi mati. Gunakan keyboard Jepang bawaan perangkat.'}</p></div>;
}
