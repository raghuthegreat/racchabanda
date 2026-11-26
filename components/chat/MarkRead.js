'use client'
import { useEffect } from 'react'
import { send } from '@/lib/client'

// Once a thread is open in the browser (logged in): record it as read (unread counts restart from
// now; done here, not while the page renders, because Next.js may fetch thread pages ahead of
// time from the list's links), and if there are new messages since the last visit, scroll to
// the first of them (the "కొత్త మాటలు" line just above it).
export default function MarkRead({ threadId, firstUnread = null }) {
  useEffect(() => {
    send('POST', '/reads', { threadId })
    if (firstUnread) document.getElementById('rb-unread')?.scrollIntoView({ block: 'start' })
  }, [threadId, firstUnread])
  return null
}
