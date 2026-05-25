import Link from 'next/link'
import PostCard from '@/components/posts/PostCard'
import { getPosts } from '@/lib/api'

async function getWordRequests(status) {
  try {
    const params = { category: 'request-a-word', sort: 'votes', limit: 50 }
    if (status) params.status = status
    const data = await getPosts(params)
    return data?.posts || data || []
  } catch {
    return []
  }
}

const STATUS_FILTERS = [
  { value: '', label: 'అన్నీ · All' },
  { value: 'open', label: 'Open · తెరిచి ఉంది' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'fulfilled', label: 'Fulfilled · నెరవేరింది' },
]

export const metadata = {
  title: 'మాట అడగండి · Request a Word — Racchabanda',
}

export default async function RequestAWordPage({ searchParams }) {
  const status = searchParams?.status || ''
  const posts = await getWordRequests(status)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="telugu-heading text-2xl font-bold text-slate-900">మాట అడగండి</h1>
          <p className="text-stone-500 text-sm mt-0.5">Request a word · Telugu పదాలు అడగండి</p>
        </div>
        <Link
          href="/request-a-word/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm shrink-0"
        >
          <span className="text-base">+</span>
          పదం అడగండి
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/request-a-word?status=${f.value}` : '/request-a-word'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${status === f.value
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-stone-300 hover:border-amber-400 hover:text-amber-700'
              }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Posts list */}
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              href={`/request-a-word/${post.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <p className="telugu-text text-2xl text-stone-300 mb-2">📝</p>
          <p className="text-stone-500 text-base mb-1">పోస్టులు లేవు</p>
          <p className="text-stone-400 text-sm mb-4">No word requests yet{status ? ` with status "${status}"` : ''}.</p>
          <Link
            href="/request-a-word/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            మొదటి పదం అడగండి
          </Link>
        </div>
      )}
    </div>
  )
}
