// POST /racchabanda/api/threads {title, body?, word?, region?}: start a thread (lib/write.js)
import { handleWrite } from '@/lib/route'
import { createThread } from '@/lib/write'

export async function POST(request) {
  return handleWrite(request, (store, me, input) => createThread(store, me, input))
}
