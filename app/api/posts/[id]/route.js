// DELETE /racchabanda/api/posts/<id>: your reply within 5 minutes, or an admin's delete
// PATCH  /racchabanda/api/posts/<id> {body}: edit your reply within 2 days
import { handleWrite } from '@/lib/route'
import { deleteReply, editReply } from '@/lib/write'
import { deletePhotos } from '@/lib/site'

export async function DELETE(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me) => deleteReply(store, me, { postId: id }, new Date(), { deletePhotos }))
}

export async function PATCH(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me, input) => editReply(store, me, { postId: id, body: input.body }))
}
