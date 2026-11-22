// A person's Google photo, or the first letter of their name on one of the brand's soft tones
// (picked from the name, so a person keeps their colour). Sizes in px.
const TONES = ['mud', 'leaf', 'thatch', 'sunk']

export default function Avatar({ name, pic, size = 40 }) {
  const label = name || 'ఎవరో'
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) }
  if (pic && pic.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="rb-avatar" src={pic} alt="" style={style} referrerPolicy="no-referrer" />
  }
  const tone = TONES[(label.codePointAt(0) || 0) % TONES.length]
  return <span className={`rb-avatar rb-avatar-${tone}`} style={style} aria-hidden="true">{[...label][0]}</span>
}
