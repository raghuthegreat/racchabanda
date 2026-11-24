// DELETE /racchabanda/api/threads/<id>: your new thread before replies, or an admin's delete
// PATCH  /racchabanda/api/threads/<id> {title, body}: edit your thread within 2 days
import { handleWrite } from '@/lib/route'
import { deleteThread, editThread } from '@/lib/write'
import { deletePhotos } from '@/lib/site'

export async function DELETE(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me) => deleteThread(store, me, { threadId: id }, new Date(), { deletePhotos }))
}

export async function PATCH(request, { params }) {
  const { id } = await params
  return handleWrite(request, (store, me, input) => editThread(store, me, { threadId: id, title: input.title, body: input.body }))
}
