import Link from 'next/link'
import Avatar from '@/components/shared/Avatar'

export default function TypoCard({ post }) {
  return (
    <Link
      href={`/telugu-typos/${post.id}`}
      className="masonry-item block bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-150 overflow-hidden group"
    >
      {/* Image */}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt={post.title || 'Telugu typo'}
          className="w-full object-cover"
        />
      )}

      {/* Card body */}
      <div className="p-3">
        {/* Title / caption */}
        {post.title && (
          <p className="text-sm text-slate-700 font-medium group-hover:text-amber-700 transition-colors line-clamp-3 mb-2">
            {post.title}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar user={post.author} size="xs" />
              <span className="text-xs text-stone-500 truncate">{post.author.name || post.author.username}</span>
            </div>
          )}

          {/* Vote + reply counts */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hearts / votes */}
            <span className="flex items-center gap-0.5 text-xs text-rose-400">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {post.vote_count ?? 0}
            </span>

            {/* Replies */}
            {post.reply_count != null && (
              <span className="flex items-center gap-0.5 text-xs text-stone-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.reply_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
