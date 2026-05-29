'use client'

import { useState } from 'react'
import Avatar from '@/components/shared/Avatar'
import Badge from '@/components/shared/Badge'
import VoteButton from '@/components/voting/VoteButton'
import { createReply } from '@/lib/api'

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

function Reply({ reply }) {
  return (
    <div className="flex gap-3 py-4 border-b border-stone-100 last:border-0">
      <Avatar user={reply.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700">
            {reply.author?.name || reply.author?.username || 'Anonymous'}
          </span>
          <span className="text-xs text-stone-400">{relativeTime(reply.created_at)}</span>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{reply.body}</p>
        <div className="mt-2">
          <VoteButton replyId={reply.id} count={reply.vote_count} voted={reply.user_voted} />
        </div>
      </div>
    </div>
  )
}

function ReplyForm({ postId, onReplyAdded }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)
    try {
      const reply = await createReply(postId, body.trim())
      setBody('')
      if (onReplyAdded) onReplyAdded(reply)
    } catch (err) {
      setError(err.message || 'Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label htmlFor="reply-body" className="block text-sm font-medium text-slate-700">
        మీ అభిప్రాయం చెప్పండి · Add a reply
      </label>
      <textarea
        id="reply-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="తెలుగు లో లేదా English లో రాయండి..."
        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-slate-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-base"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Posting...' : 'Reply పంపించండి'}
      </button>
    </form>
  )
}

export default function PostDetail({ post, initialReplies = [], showWordFields = false }) {
  const [replies, setReplies] = useState(initialReplies)

  function handleReplyAdded(newReply) {
    setReplies((prev) => [...prev, newReply])
  }

  if (!post) return null

  return (
    <article className="max-w-3xl mx-auto">
      {/* Post header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
        <div className="flex gap-4">
          {/* Vote button */}
          <div className="flex flex-col items-center pt-1">
            <VoteButton postId={post.id} count={post.vote_count} voted={post.user_voted} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Word display */}
            {showWordFields && (post.word_telugu || post.word_transliteration) && (
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                {post.word_telugu && (
                  <span className="telugu-heading text-3xl font-bold text-amber-800">
                    {post.word_telugu}
                  </span>
                )}
                {post.word_transliteration && (
                  <span className="text-xl text-stone-500 italic">{post.word_transliteration}</span>
                )}
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl font-semibold text-slate-900 mb-3">{post.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.status && <Badge type="status" value={post.status} />}
              {post.region && <Badge type="region" value={post.region} />}
            </div>

            {/* Body */}
            {post.body && (
              <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap mb-4">
                {post.body}
              </div>
            )}

            {/* Context / example sentence */}
            {post.context && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3 mb-4">
                <p className="text-xs font-medium text-amber-700 mb-1">Context · సందర్భం</p>
                <p className="text-slate-700 text-sm">{post.context}</p>
              </div>
            )}

            {post.example_sentence && (
              <div className="bg-stone-50 border-l-4 border-stone-300 rounded-r-lg px-4 py-3 mb-4">
                <p className="text-xs font-medium text-stone-500 mb-1">Example · ఉదాహరణ</p>
                <p className="text-slate-700 text-sm italic">{post.example_sentence}</p>
              </div>
            )}

            {/* Author + meta */}
            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              {post.author && (
                <>
                  <Avatar user={post.author} size="sm" />
                  <span className="text-sm text-slate-600">{post.author.name || post.author.username}</span>
                </>
              )}
              {post.created_at && (
                <span className="text-sm text-stone-400">{relativeTime(post.created_at)}</span>
              )}
              {post.reply_count != null && (
                <span className="text-sm text-stone-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post.reply_count} replies
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {replies.length > 0 ? `${replies.length} Replies · స్పందనలు` : 'స్పందించండి · Replies'}
        </h2>

        {replies.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {replies.map((reply) => (
              <Reply key={reply.id} reply={reply} />
            ))}
          </div>
        ) : (
          <p className="text-stone-400 text-sm py-4 text-center">
            మొదటి స్పందన ఇవ్వండి · Be the first to reply
          </p>
        )}

        <ReplyForm postId={post.id} onReplyAdded={handleReplyAdded} />
      </div>
    </article>
  )
}
