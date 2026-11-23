import Link from 'next/link'
import Avatar from './shared/Avatar'
import StickerChip from './StickerChip'
import { threadPath, timeAgo } from '@/lib/text'

const NEW_HOURS = 24

// One thread in the stream: who started it, the title, its word (to the dictionary) and region
// (filters the stream), when it last moved, reply count, the first post's stickers.
export default function ThreadRow({ thread, now = new Date() }) {
  const fresh = (now - new Date(thread.created_at)) / 3600000 < NEW_HOURS
  const who = thread.reply_count > 0 && thread.last_author_name
    ? `${thread.last_author_name} జవాబిచ్చారు` : `${thread.author_name || 'ఎవరో'} మొదలుపెట్టారు`
  return (
    <article className="rb-row">
      <Avatar name={thread.author_name} pic={thread.author_pic} size={44} />
      <div className="rb-row-main">
        <h2 className="rb-row-title">
          {thread.pinned && <i className="fas fa-thumbtack rb-pin" aria-label="పైన ఉంచారు"></i>}
          <Link href={threadPath(thread)}>{thread.title}</Link>
          {fresh && <span className="rb-new">కొత్త</span>}
        </h2>
        <div className="rb-row-meta">
          {thread.word && <a className="rb-chip-word" href={`/yaasa/${encodeURIComponent(thread.word)}`}>పదం: {thread.word}</a>}
          {thread.region && <Link className="rb-chip-region" href={`/?region=${encodeURIComponent(thread.region)}`}>{thread.region}</Link>}
          <span>{who} · {timeAgo(thread.last_activity_at, now)}</span>
          {thread.source === 'instagram' && <span>· Instagram నుండి</span>}
          {thread.photos?.length > 0 && <span aria-label={`${thread.photos.length} ఫోటోలు`}>· <i className="fas fa-camera" aria-hidden="true"></i> {thread.photos.length}</span>}
        </div>
      </div>
      <div className="rb-row-side">
        {thread.stickers?.length > 0 && (
          <div className="rb-row-stickers">
            {thread.stickers.slice(0, 2).map((s) => <StickerChip key={s.code} {...s} />)}
          </div>
        )}
        <span className="rb-row-replies" aria-label={`${thread.reply_count} జవాబులు`}>
          <i className="far fa-comment" aria-hidden="true"></i> {thread.reply_count}
        </span>
      </div>
    </article>
  )
}
