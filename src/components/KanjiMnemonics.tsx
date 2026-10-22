import {
  Armchair, Baby, BedDouble, BookOpen, CalendarDays, CarFront, Cat, ChevronDown,
  Clock3, Coins, DoorOpen, Droplets, Ear, Eye, Fish, Flag, Flower2, Footprints,
  Hand, Heart, House, KeyRound, Lightbulb, MessageCircle, Moon, Mountain, Package, Route,
  Scale, School, ScrollText, Soup, Sprout, Sun, TreeDeciduous, UserRound, Utensils,
  Wheat, Wrench, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mnemonicsForWord } from '../data/kanji-mnemonics';
import type { KanjiMnemonic, MnemonicVisual } from '../data/kanji-mnemonics';

const visualIcons: Partial<Record<MnemonicVisual, LucideIcon>> = {
  grain: Wheat, moon: Moon, sun: Sun, tree: TreeDeciduous, person: UserRound,
  house: House, book: BookOpen, water: Droplets, door: DoorOpen, ear: Ear,
  eye: Eye, fish: Fish, cat: Cat, hand: Hand, path: Route, flower: Flower2,
  food: Utensils, hill: Mountain, coin: Coins, calendar: CalendarDays, clock: Clock3,
  chair: Armchair, paper: ScrollText, key: KeyRound, lightning: Zap, flag: Flag,
  bowl: Soup, tool: Wrench, bag: Package, child: Baby, bed: BedDouble,
  speech: MessageCircle, scale: Scale, car: CarFront, heart: Heart, shoe: Footprints,
  school: School, sprout: Sprout, box: Package,
};

function SceneObject({ visual, x, y, color }: { visual: MnemonicVisual; x: number; y: number; color: string }) {
  const Icon = visualIcons[visual];
  if (Icon) return <Icon x={x} y={y} width={54} height={54} stroke={color} strokeWidth={1.7}/>;
  return <svg x={x} y={y} width="54" height="54" viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    {visual === 'self' && <><circle cx="32" cy="12" r="7"/><path d="M22 60V32c0-13 20-13 20 0v28M12 44l10-15M50 34l-15 6"/><path d="m39 34-5 6 7 2"/><circle cx="31" cy="38" r="3" fill={color}/></>}
    {visual === 'mouth' && <><path d="M8 29c14-11 34-11 48 0-14 20-34 20-48 0Z"/><path d="M11 30h42"/><path d="m26 35 6 5 6-5"/></>}
    {visual === 'horse' && <><path d="m13 20 26 4 9-14 8 8-9 7-4 15H15l-6-14-6-5M17 40l-3 17M36 40l8 17M15 21l-2 12M42 15l-3 9"/><circle cx="50" cy="17" r="1" fill={color}/></>}
    {visual === 'table' && <><path d="M5 18h54v8H5zM12 26v32M52 26v32M12 45h40"/></>}
    {visual === 'up' && <><path d="M5 50h54M32 50V10M32 26h16"/><circle cx="47" cy="12" r="5" fill={color} opacity=".25"/></>}
    {visual === 'down' && <><path d="M5 14h54M32 14v43M32 30l16 10"/><circle cx="14" cy="49" r="5" fill={color} opacity=".25"/></>}
    {visual === 'center' && <><rect x="9" y="19" width="46" height="29"/><path d="M32 5v54"/><circle cx="32" cy="33" r="5" fill={color} opacity=".3"/></>}
    {visual === 'one' && <path d="M7 32h50"/>}
    {visual === 'two' && <path d="M14 20h36M7 44h50"/>}
    {visual === 'three' && <path d="M11 15h42M17 31h30M7 49h50"/>}
    {visual === 'four' && <><rect x="10" y="9" width="44" height="45"/><path d="M23 10v23l-6 8M39 10v26h11"/><circle cx="9" cy="8" r="3" fill={color}/><circle cx="55" cy="8" r="3" fill={color}/><circle cx="9" cy="55" r="3" fill={color}/><circle cx="55" cy="55" r="3" fill={color}/></>}
    {visual === 'cross' && <path d="M6 31h52M32 6v52"/>}
    {visual === 'seven' && <><path d="m7 26 50-5M31 8v41q0 8 12 8h12"/><path d="m50 39 7 5-7 5Z" fill={color} opacity=".25"/></>}
    {visual === 'nine' && <path d="M21 7v26Q18 50 7 57M7 24h29q5 0 5 7v18q0 9 9 9h7"/>}
    {visual === 'six' && <><path d="m30 7 6 8M8 23h48M23 35 9 56M41 35l14 21"/><circle cx="32" cy="28" r="3" fill={color} opacity=".25"/></>}
    {visual === 'eight' && <path d="M25 11Q22 40 8 55M39 11q3 29 17 44"/>}
  </svg>;
}

function MnemonicPicture({ mnemonic }: { mnemonic: KanjiMnemonic }) {
  const positions = mnemonic.parts.length === 1 ? [160] : [80, 240];
  return <svg className="mnemonic-picture" viewBox="0 0 320 132" role="img" aria-label={`Gambar pengingat ${mnemonic.kanji}: ${mnemonic.parts.map(p => p.label).join(' dan ')}`}>
    {mnemonic.parts.length > 1 && <g fill="none" stroke="#A5B5AF" strokeWidth="2" strokeLinecap="round"><path d="M135 76h49m-6-6 7 6-7 6"/></g>}
    {mnemonic.parts.map((part, i) => <g key={i}>
      <circle cx={positions[i]} cy="76" r="44" fill={i === 0 ? '#FFD166' : '#F4B3A4'} opacity=".28"/>
      {part.shape && <text x={positions[i]} y="24" textAnchor="middle" className={`mnemonic-shape shape-${i}`} lang="ja">{part.shape}</text>}
      <SceneObject visual={part.visual} x={positions[i] - 27} y={49} color={i === 0 ? '#946219' : '#B74936'}/>
    </g>)}
  </svg>;
}

export default function KanjiMnemonics({ word }: { word: string }) {
  const mnemonics = mnemonicsForWord(word);
  if (!mnemonics.length) return null;
  return <details className="kanji-mnemonics" open>
    <summary><Lightbulb size={18}/><span>Mnemonik visual</span><small>{mnemonics.length} karakter</small><ChevronDown size={17}/></summary>
    <p className="mnemonic-intro">Hubungkan bentuk dengan gambar, lalu bayangkan ceritanya.</p>
    <div className={`mnemonic-cards ${mnemonics.length > 1 ? 'multiple' : ''}`}>
      {mnemonics.map(mnemonic => <article key={mnemonic.kanji} className="mnemonic-card" aria-label={`Mnemonik ${mnemonic.kanji}`}>
        <header><span className="mnemonic-character" lang="ja">{mnemonic.kanji}</span><span><small>KATA PENGINGAT</small><strong>{mnemonic.keyword}</strong></span></header>
        <MnemonicPicture mnemonic={mnemonic}/>
        <div className={`mnemonic-part-labels parts-${mnemonic.parts.length}`}>{mnemonic.parts.map((part, i) => <span key={i}><i className={`part-dot dot-${i}`}/>{part.label}</span>)}</div>
        <p className="mnemonic-story">{mnemonic.story}</p>
      </article>)}
    </div>
    {mnemonics.length > 1 && <p className="mnemonic-word-note">Gabungkan gambaran {mnemonics.map(m => m.kanji).join(' + ')} untuk mengingat bentuk <span lang="ja">{word}</span>. Bacaan dan arti mengikuti kata utuhnya.</p>}
    <p className="mnemonic-note">Cerita imajinatif untuk mengingat bentuk, bukan penjelasan asal-usul kanji.</p>
  </details>;
}
