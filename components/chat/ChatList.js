import Link from 'next/link'
import Avatar from '@/components/shared/Avatar'
import { threadPath } from '@/lib/text'
import { listTime, lastLine } from '@/lib/chat'

// The threads as a chat list (like WhatsApp's): who started it, the title, the newest message
// ("వాణి: విజయనగరం…") and when, and the word it is about. activeId marks the open thread (the
// desktop's left pane). unread: Map(threadId -> {unread}) for a logged-in person (lib/reads.js):
// a green count, and a green time, on threads with replies since they last opened them.
export default function ChatList({ threads, activeId = null, now = new Date(), unread = new Map() }) {
  return (
    <ul className="rb-list-chat">
      {threads.map((t) => {
        const n = t.id === activeId ? 0 : (unread.get(t.id)?.unread || 0)
        return (
        <li key={t.id}>
          <Link href={threadPath(t)} className={`rb-chat-row${t.id === activeId ? ' rb-chat-row-on' : ''}`} aria-current={t.id === activeId ? 'page' : undefined}>
            <Avatar name={t.author_name} pic={t.author_pic} size={46} />
            <span className="rb-chat-row-main">
              <span className="rb-chat-row-top">
                <span className="rb-chat-row-title">
                  {t.pinned && <i className="fas fa-thumbtack rb-pin" aria-label="పైన ఉంచారు"></i>}{t.title}
                </span>
                <span className={`rb-chat-row-time${n ? ' rb-chat-row-time-new' : ''}`}>{listTime(t.last_activity_at, now)}</span>
              </span>
              <span className="rb-chat-row-second">
                <span className="rb-chat-row-last">{lastLine(t)}</span>
                {n > 0 && <span className="rb-unread" aria-label={`${n} కొత్త మాటలు`}>{n}</span>}
              </span>
              {(t.word || t.photos?.length > 0 || t.source === 'instagram') && (
                <span className="rb-chat-row-tags">
                  {t.word && <span className="rb-chip-word">పదం: {t.word}</span>}
                  {t.photos?.length > 0 && <span><i className="fas fa-camera" aria-hidden="true"></i> {t.photos.length}</span>}
                  {t.source === 'instagram' && <span>Instagram నుండి</span>}
                </span>
              )}
            </span>
          </Link>
        </li>
        )
      })}
    </ul>
  )
}
