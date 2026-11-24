'use client'
import { useState } from 'react'
import Avatar from '@/components/shared/Avatar'
import PostText from '@/components/PostText'
import PhotoGrid from '@/components/PhotoGrid'
import StickerChip from '@/components/StickerChip'
import DeleteButton from '@/components/DeleteButton'
import EditForm from './EditForm'
import useStickers from './useStickers'
import { STICKERS } from '@/lib/stickers'

// One message of the chat: the topic (kind="thread", a pinned card at the top) or a reply
// (kind="post", a bubble: others' on the left, yours on the right). Tapping it opens the tray:
// the 8 stickers, and సవరించండి / తీసేయండి where allowed. Reactions sit under its edge.
//   first: starts a run from one person (name and avatar show); last: ends it (the bubble's tail)
export default function Bubble({
  kind = 'post', threadId, id, authorName, authorPic, body, title = '', photos, time, edited, mine = false,
  first = true, last = true, initialStickers, loggedIn, editable = false, deletable = false, children,
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const s = useStickers({ threadId, postId: kind === 'thread' ? null : id, initial: initialStickers, loggedIn })

  const pick = async (code) => { if (await s.toggle(code)) setOpen(false) }
  const tray = open && !editing && (
    <div className="rb-tray" role="group" aria-label="స్టిక్కర్లు" onClick={(e) => e.stopPropagation()}>
      <div className="rb-tray-stickers">
        {STICKERS.map((st) => (
          <button key={st.code} type="button" className="rb-sticker-btn" onClick={() => pick(st.code)} disabled={s.busy}>
            <StickerChip label={st.label} tone={st.tone} mine={s.stickers.some((x) => x.code === st.code && x.mine)} />
          </button>
        ))}
      </div>
      {(editable || deletable) && (
        <div className="rb-tray-actions">
          {editable && <button type="button" className="rb-edit" onClick={() => { setEditing(true); setOpen(false) }}><i className="far fa-edit" aria-hidden="true"></i> సవరించండి</button>}
          {deletable && <DeleteButton what={kind === 'thread' ? 'thread' : 'post'} id={id} />}
        </div>
      )}
      {s.error && <span className="rb-error" role="alert">{s.error}</span>}
    </div>
  )
  const reactions = s.stickers.length > 0 && (
    <div className="rb-reactions">
      {s.stickers.map((st) => (
        <button key={st.code} type="button" className="rb-sticker-btn" onClick={(e) => { e.stopPropagation(); s.toggle(st.code) }}
                aria-pressed={st.mine} title={st.mine ? 'మీ స్టిక్కర్ తీసేయండి' : 'మీరూ ఇవ్వండి'} disabled={s.busy}>
          <StickerChip {...st} />
        </button>
      ))}
    </div>
  )
  const stamp = <span className="rb-stamp">{time}{edited && <span className="rb-edited"> · సవరించారు</span>}</span>
  // A tap on a link, photo or button inside does its own thing, not the tray
  const tap = (e) => {
    if (editing || (e && e.target.closest && e.target.closest('a, button, input, textarea, select'))) return
    setOpen(!open)
  }
  const keyTap = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap() } }

  if (kind === 'thread') {
    return (
      <section className="rb-topic" id="topic">
        <div className="rb-topic-card" role="button" tabIndex={0} aria-expanded={open} onClick={tap} onKeyDown={keyTap}>
          <div className="rb-topic-head">
            <Avatar name={authorName} pic={authorPic} size={30} />
            <strong className="rb-who">{authorName || 'ఎవరో'}</strong>
            <span className="rb-when">మొదలుపెట్టారు · {time}{edited && ' · సవరించారు'}</span>
          </div>
          {editing ? <EditForm kind="thread" id={id} title={title} body={body} onDone={() => setEditing(false)} /> : (
            <>
              {body && <PostText text={body} />}
              <PhotoGrid photos={photos} />
            </>
          )}
          {children}
        </div>
        {reactions}
        {tray}
      </section>
    )
  }

  return (
    <div className={`rb-msg${mine ? ' rb-msg-mine' : ''}${first ? ' rb-msg-first' : ''}${last ? ' rb-msg-last' : ''}`} id={`post-${id}`}>
      {!mine && (first ? <Avatar name={authorName} pic={authorPic} size={28} /> : <span className="rb-msg-gap" />)}
      <div className="rb-msg-col">
        <div className="rb-bubble" role="button" tabIndex={0} aria-expanded={open} onClick={tap} onKeyDown={keyTap}>
          {!mine && first && <span className="rb-bubble-name">{authorName || 'ఎవరో'}</span>}
          {editing ? <EditForm kind="post" id={id} body={body} onDone={() => setEditing(false)} /> : (
            <>
              <PhotoGrid photos={photos} />
              {body && <PostText text={body} />}
            </>
          )}
          {stamp}
        </div>
        {reactions}
        {tray}
      </div>
    </div>
  )
}
