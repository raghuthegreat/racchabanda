import Link from 'next/link'
import Avatar from '@/components/shared/Avatar'
import Badge from '@/components/shared/Badge'

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'ఇప్పుడే · just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PostCard({ post, href }) {
  const linkHref = href || `/request-a-word/${post.id}`

  return (
    <Link
      href={linkHref}
      className="block bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-150 p-4 group"
    >
      <div className="flex gap-3">
        {/* Vote count column */}
        <div className="flex flex-col items-center justify-start pt-0.5 min-w-[40px]">
          <div
            className={`flex flex-col items-center px-2 py-1.5 rounded-lg
              ${post.vote_count > 0 ? 'bg-amber-50 text-amber-700' : 'bg-stone-50 text-stone-400'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-sm font-bold leading-none">{post.vote_count ?? 0}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Word (Telugu + transliteration) */}
          {(post.word_telugu || post.word_transliteration) && (
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              {post.word_telugu && (
                <span className="telugu-text text-lg font-semibold text-amber-800">
                  {post.word_telugu}
                </span>
              )}
              {post.word_transliteration && (
                <span className="text-sm text-stone-500 italic">{post.word_transliteration}</span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-slate-800 font-medium group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-1.5">
                <Avatar user={post.author} size="xs" />
                <span className="text-xs text-stone-500">{post.author.name || post.author.username}</span>
              </div>
            )}

            {/* Time */}
            {post.created_at && (
              <span className="text-xs text-stone-400">{relativeTime(post.created_at)}</span>
            )}

            {/* Reply count */}
            {post.reply_count != null && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.reply_count}
              </span>
            )}

            {/* Status badge */}
            {post.status && (
              <Badge type="status" value={post.status} />
            )}

            {/* Region badge */}
            {post.region && (
              <Badge type="region" value={post.region} />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
