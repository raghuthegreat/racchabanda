// POST /racchabanda/api/posts {threadId, body}: reply in a thread; the thread's author and
// earlier repliers hear about it through the site (🔔 + email)
import { handleWrite } from '@/lib/route'
import { createReply } from '@/lib/write'
import { notifyReply } from '@/lib/site'

export async function POST(request) {
  return handleWrite(request, (store, me, input) => createReply(store, me, input, { notify: notifyReply }))
}
