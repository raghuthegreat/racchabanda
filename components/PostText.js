import { linkParts } from '@/lib/text'

// A post's text: line breaks kept, web addresses as links (rel nofollow: people's links), and
// nothing typed can become HTML (React escapes every part).
export default function PostText({ text }) {
  return (
    <div className="rb-text">
      {linkParts(text).map((p, i) => (p.href
        ? <a key={i} href={p.href} rel="nofollow ugc noopener" target="_blank">{p.text}</a>
        : <span key={i}>{p.text}</span>))}
    </div>
  )
}
