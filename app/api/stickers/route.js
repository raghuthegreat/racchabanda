// POST /racchabanda/api/stickers {threadId, postId?, sticker}: add your sticker, or take it back
import { handleWrite } from '@/lib/route'
import { toggleSticker } from '@/lib/write'

export async function POST(request) {
  return handleWrite(request, (store, me, input) => toggleSticker(store, me, input))
}
