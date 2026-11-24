// POST /racchabanda/api/posts {threadId, body}: reply in a thread; the thread's author and
// earlier repliers hear about it through the site (🔔 + email). That call runs after the answer
// is sent (Next.js after()), so the person never waits for it; a failure is only logged.
import { after } from 'next/server'
import { handleWrite } from '@/lib/route'
import { createReply } from '@/lib/write'
import { notifyReply } from '@/lib/site'

const notifyLater = (args) => {
  after(() => notifyReply(args).catch((e) => console.error('forum notify failed', e)))
}

export async function POST(request) {
  return handleWrite(request, (store, me, input) => createReply(store, me, input, { notify: notifyLater }))
}
