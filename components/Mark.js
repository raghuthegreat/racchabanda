// The రచ్చబండ mark: a tree with the village's raised round stone platform around it, in the
// line style and colours of the యాసలు granary (thatch, mud, leaf), with a row of muggu dots.
// The same drawing is app/icon.svg (the browser tab).
export default function Mark({ size = 96, title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined}
         aria-label={title || undefined} aria-hidden={title ? undefined : 'true'}>
      <circle cx="50" cy="30" r="22" fill="#4a6b3a" />
      <circle cx="30" cy="40" r="15" fill="#4a6b3a" />
      <circle cx="70" cy="40" r="15" fill="#4a6b3a" />
      <circle cx="44" cy="24" r="6" fill="#5d8049" />
      <circle cx="63" cy="33" r="4" fill="#5d8049" />
      <rect x="45.5" y="42" width="9" height="32" rx="2" fill="#7C4428" />
      <path d="M16 74 Q50 64 84 74 L84 84 Q50 94 16 84 Z" fill="#9a5a34" />
      <ellipse cx="50" cy="74" rx="34" ry="8" fill="#D9A23E" />
      <ellipse cx="50" cy="73" rx="7" ry="2.4" fill="#7C4428" />
      <circle cx="27" cy="83" r="1.6" fill="#FFF8EC" />
      <circle cx="38" cy="86" r="1.6" fill="#FFF8EC" />
      <circle cx="50" cy="87" r="1.6" fill="#FFF8EC" />
      <circle cx="62" cy="86" r="1.6" fill="#FFF8EC" />
      <circle cx="73" cy="83" r="1.6" fill="#FFF8EC" />
    </svg>
  )
}
