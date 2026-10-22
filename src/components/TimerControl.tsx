import { useEffect, useState } from 'react';

export default function TimerControl({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(value ? String(value) : '');
  useEffect(() => setDraft(value ? String(value) : ''), [value]);
  const invalid = Boolean(draft) && (!Number.isInteger(Number(draft)) || Number(draft) < 5 || Number(draft) > 300);
  return <div className="timer-control"><div className="timer-presets" role="group" aria-label="Waktu per soal">{[0,10,20,30].map(n => <button type="button" key={n} aria-pressed={value === n} onClick={() => { setDraft(n ? String(n) : ''); onChange(n); }}>{n === 0 ? 'Tanpa timer' : `${n} detik`}</button>)}</div><label className="custom-timer">Waktu khusus<input aria-label="Waktu khusus per soal" aria-invalid={invalid} type="number" min="5" max="300" step="1" value={draft} placeholder="20" onChange={e => { setDraft(e.target.value); const n = e.target.valueAsNumber; if (Number.isInteger(n) && n >= 5 && n <= 300) onChange(n); }} onBlur={() => { if (!draft || invalid) setDraft(value ? String(value) : ''); }}/><span>detik / soal</span></label><small>{invalid ? 'Masukkan bilangan bulat dari 5 sampai 300 detik.' : 'Timer opsional. Waktu habis dihitung salah; pembahasan tetap bebas waktu.'}</small></div>;
}
