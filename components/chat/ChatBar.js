import Link from 'next/link'
import Mark from '@/components/Mark'

// The top of a conversation: on phones a compact bar instead of the site's header (← back to the
// list, the mark, the title, how many messages and people); on desktop the open thread's title.
export default function ChatBar({ thread, messages, people }) {
  return (
    <header className="rb-chatbar">
      <Link href="/" className="rb-chatbar-back" aria-label="రచ్చబండకు తిరిగి">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
      </Link>
      <span className="rb-chatbar-mark"><Mark size={32} /></span>
      <span className="rb-chatbar-text">
        <h1 className="rb-chatbar-title">{thread.title}</h1>
        <span className="rb-chatbar-meta">
          రచ్చబండ · {messages} మాటలు · {people} మంది
          {thread.word && <> · <a href={`/yaasa/${encodeURIComponent(thread.word)}`}>పదం: {thread.word} → నిఘంటువు</a></>}
          {thread.region && <> · <Link href={`/?region=${encodeURIComponent(thread.region)}`}>{thread.region}</Link></>}
        </span>
      </span>
    </header>
  )
}
