// POST /racchabanda/api/reads {threadId}: "I opened this thread" (unread counts restart from now)
import { handleWrite } from '@/lib/route'
import { markRead } from '@/lib/write'

export async function POST(request) {
  return handleWrite(request, (store, me, input) => markRead(store, me, input))
}
