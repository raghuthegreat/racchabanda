'use client'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PostText from '@/components/PostText'
import PhotoGrid from '@/components/PhotoGrid'
import { addPending, markSent, dropPending, visiblePending } from '@/lib/pending'

// Replies being sent: the message bar (ReplyBox) adds one the moment you tap send, and it shows
// at the end of the conversation (PendingReplies) until the refreshed page brings the real
// bubble. The pure list logic is lib/pending.js.
const Pending = createContext(null)

export function PendingProvider({ children }) {
  const [list, setList] = useState([])
  const add = useCallback((item) => setList((l) => addPending(l, item)), [])
  const sent = useCallback((key, id) => setList((l) => markSent(l, key, id)), [])
  const drop = useCallback((key) => setList((l) => dropPending(l, key)), [])
  const value = useMemo(() => ({ list, add, sent, drop }), [list, add, sent, drop])
  return <Pending.Provider value={value}>{children}</Pending.Provider>
}

// null outside a provider (the message bar then works as before, without the instant bubble)
export function usePending() {
  return useContext(Pending)
}

// Your replies on their way, drawn like your own bubbles (Bubble.js), marked "పంపుతోంది…";
// no stickers or tray until the real one arrives
export function PendingReplies({ knownIds }) {
  const pending = usePending()
  if (!pending) return null
  return visiblePending(pending.list, knownIds).map((p) => (
    <div className="rb-msg rb-msg-mine rb-msg-first rb-msg-last rb-msg-pending" key={p.key} aria-live="polite">
      <div className="rb-msg-col">
        <div className="rb-bubble">
          <PhotoGrid photos={p.photos} />
          {p.body && <PostText text={p.body} />}
          <span className="rb-stamp">{p.id ? 'పంపాం' : 'పంపుతోంది…'}</span>
        </div>
      </div>
    </div>
  ))
}
