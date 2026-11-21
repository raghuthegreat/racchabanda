import Mark from './Mark'

// The front page's band: the mark, the name, the tagline, the two buttons. Warm mud tone (the
// brand's "moments" colour), buttons in the site's leaf green.
export default function TitleBand({ newHref = '/racchabanda/new' }) {
  return (
    <section className="rb-band">
      <Mark size={112} />
      <div className="rb-band-text">
        <h1 className="rb-band-title">రచ్చబండ</h1>
        <p className="rb-band-tag">ఊరంతా కూర్చుని మాట్లాడుకునే చోటు</p>
        <p className="rb-band-sub">పదాల గురించి, ఊరి మాటల గురించి: మీ మాట చెప్పండి, వేరే ఊరి వాళ్ళ మాట వినండి.</p>
        <div className="rb-band-actions">
          <a className="rb-btn rb-btn-primary" href={newHref}><i className="fas fa-plus" aria-hidden="true"></i> కొత్త చర్చ</a>
          <a className="rb-btn rb-btn-outline" href="/requests">అర్థం అడగండి →</a>
        </div>
      </div>
    </section>
  )
}
