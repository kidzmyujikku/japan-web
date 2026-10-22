export default function KanaArt({ compact = false }: { compact?: boolean }) {
  return <svg className={`kana-art ${compact ? 'compact' : ''}`} viewBox="0 0 600 530" role="img" aria-label="Kartu hiragana dan katakana, sebuah langkah kecil setiap hari">
    <defs>
      <pattern id="art-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#18233D" strokeOpacity=".075"/></pattern>
      <filter id="art-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#18233D" floodOpacity=".09"/></filter>
    </defs>
    <circle cx="335" cy="257" r="205" fill="#F4EBDC"/>
    <circle cx="335" cy="257" r="205" fill="url(#art-grid)"/>
    <path d="M89 271C24 221 71 118 157 135M470 388c89 8 116-85 67-126" fill="none" stroke="#18233D" strokeWidth="2" strokeDasharray="5 7"/>
    <g transform="translate(307 86) rotate(14 112 143)" filter="url(#art-shadow)">
      <rect width="224" height="286" rx="26" fill="#FFD166"/>
      <rect x="14" y="14" width="196" height="258" rx="18" stroke="#18233D" strokeOpacity=".18" fill="none"/>
      <text x="25" y="44" fill="#18233D" fontSize="13" fontFamily="Outfit" letterSpacing="2">KATAKANA</text>
      <text x="112" y="183" textAnchor="middle" fill="#18233D" fontSize="140" fontFamily="Noto Sans JP">ア</text>
      <text x="112" y="245" textAnchor="middle" fill="#18233D" fontSize="25" fontFamily="Outfit">a</text>
    </g>
    <g className="front-kana-card" transform="translate(99 159) rotate(-12 125 150)" filter="url(#art-shadow)">
      <rect width="250" height="302" rx="28" fill="#FF725E"/>
      <rect x="15" y="15" width="220" height="272" rx="19" stroke="#18233D" strokeOpacity=".2" fill="none"/>
      <text x="28" y="47" fill="#18233D" fontSize="13" fontFamily="Outfit" letterSpacing="2">HIRAGANA</text>
      <text x="125" y="201" textAnchor="middle" fill="#18233D" fontSize="156" fontFamily="Noto Sans JP">あ</text>
      <text x="125" y="266" textAnchor="middle" fill="#18233D" fontSize="25" fontFamily="Outfit">a</text>
    </g>
    <g transform="translate(380 372) rotate(-6)">
      <circle r="55" fill="#167D8D"/>
      <path d="M-20 0l13 13 28-29" fill="none" stroke="#FFF8EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <path d="M94 86l6 14 15 3-14 6-3 15-6-14-15-3 14-6zM544 146l4 10 11 2-10 4-2 11-4-10-11-2 10-4z" fill="#18233D"/>
    <path d="M327 476c45-1 87-14 108-35" fill="none" stroke="#18233D" strokeWidth="2" strokeLinecap="round"/>
    <text x="117" y="512" fontFamily="Outfit" fontSize="16" fill="#777569" letterSpacing="1">a little progress, every day.</text>
  </svg>;
}
