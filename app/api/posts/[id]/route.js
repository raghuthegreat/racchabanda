// DELETE /racchabanda/api/posts/<id>: your reply within 5 minutes, or an admin's delete
import { handleWrite } from '@/lib/route'
import { deleteReply } from '@/lib/write'

export async function DELETE(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me) => deleteReply(store, me, { postId: id }))
}
