'use client'

// Something failed while loading (most likely the database didn't answer): say so in Telugu,
// offer a retry, keep the site's header and footer around it.
export default function Error({ reset }) {
  return (
    <div className="rb-wrap">
      <h1 className="rb-thread-title">రచ్చబండ ఇప్పుడు తెరుచుకోలేదు</h1>
      <p className="rb-empty">కొంచెం ఆగి మళ్ళీ ప్రయత్నించండి.</p>
      <button type="button" className="rb-btn rb-btn-primary" onClick={() => reset()}>మళ్ళీ ప్రయత్నించండి</button>
    </div>
  )
}
