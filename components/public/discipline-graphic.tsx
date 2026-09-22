// Decorative mathematical studies, not live financial data.
export function DisciplineGraphic({ type = "economics" }: { type?: "economics" | "finance" | "data" }) {
  return <svg className={`discipline-graphic graphic-${type}`} viewBox="0 0 600 320" fill="none" aria-hidden="true" focusable="false">
    <g stroke="currentColor" opacity=".1">{Array.from({ length: 13 }, (_, i) => <path key={`v${i}`} d={`M${i * 50} 0V320`} />)}{Array.from({ length: 7 }, (_, i) => <path key={`h${i}`} d={`M0 ${i * 50}H600`} />)}</g>
    {type === "economics" && <g stroke="currentColor" strokeWidth="1.2">{Array.from({ length: 22 }, (_, i) => <path key={i} opacity={.25 + i / 35} d={`M${45 + i * 7} 280 C${140 + i * 4} ${240 - i * 9},${180 + i * 10} ${20 + i * 4},${540 - i * 3} ${70 + i * 7}`} />)}</g>}
    {type === "finance" && <g stroke="currentColor" strokeWidth="1.2">{Array.from({ length: 10 }, (_, i) => <path key={i} opacity={.25 + i / 18} d={`M${75 + i * 39} 264 v-${50 + i * 16} l22 -13 v${50 + i * 16} l-22 13 m0 -${50 + i * 16} l-22 -13 v${50 + i * 16} l22 13 m-22 -${50 + i * 16} l22 -13 l22 13`} />)}<path d="M42 250C180 270 330 120 540 48" strokeWidth="2" strokeDasharray="4 5" /></g>}
    {type === "data" && <g stroke="currentColor">{Array.from({ length: 8 }, (_, i) => Array.from({ length: 7 }, (_, j) => { const x = 84 + i * 60 + Math.sin(j) * 19; const y = 40 + j * 40 + Math.sin(i * .9) * 14; return <g key={`${i}-${j}`}><path opacity=".18" d={`M${x} ${y}l60 ${Math.sin((i + 1) * .9) * 14 - Math.sin(i * .9) * 14}`} /><path opacity=".14" d={`M${x} ${y}l${Math.sin(j + 1) * 19 - Math.sin(j) * 19} 40`} /><circle cx={x} cy={y} r={(i + j) % 5 === 0 ? 5 : 2.5} fill="currentColor" opacity={.25 + ((i * 3 + j) % 6) / 8} /></g>; }))}</g>}
  </svg>;
}
