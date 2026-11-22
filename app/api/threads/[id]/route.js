// DELETE /racchabanda/api/threads/<id>: your new thread before replies, or an admin's delete
import { handleWrite } from '@/lib/route'
import { deleteThread } from '@/lib/write'

export async function DELETE(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me) => deleteThread(store, me, { threadId: id }))
}
