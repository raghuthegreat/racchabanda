import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostDetail from '@/components/posts/PostDetail'
import DefinitionList from '@/components/definitions/DefinitionList'
import DefinitionForm from '@/components/definitions/DefinitionForm'
import { getPost, getReplies, getDefinitions } from '@/lib/api'

async function getData(id) {
  try {
    const [post, replies, definitions] = await Promise.all([
      getPost(id),
      getReplies(id).catch(() => []),
      getDefinitions(id).catch(() => []),
    ])
    return { post: post?.post || post, replies: replies?.replies || replies || [], definitions: definitions?.definitions || definitions || [] }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  try {
    const data = await getData(params.id)
    if (!data?.post) return { title: 'Word Request — Racchabanda' }
    const { post } = data
    const title = post.word_telugu
      ? `${post.word_telugu} · ${post.word_transliteration || post.title}`
      : post.title
    return { title: `${title} — Racchabanda` }
  } catch {
    return { title: 'Word Request — Racchabanda' }
  }
}

export default async function WordRequestDetailPage({ params }) {
  const data = await getData(params.id)

  if (!data || !data.post) {
    notFound()
  }

  const { post, replies, definitions } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/request-a-word" className="hover:text-amber-700 transition-colors">
          మాట అడగండి
        </Link>
        <span>›</span>
        <span className="text-slate-600 truncate max-w-xs">
          {post.word_telugu || post.word_transliteration || post.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Post detail */}
          <PostDetail post={post} initialReplies={replies} showWordFields />

          {/* Fulfilled: link to Yaasalu */}
          {post.status === 'fulfilled' && (post.word_transliteration || post.yaasalu_slug) && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800 mb-0.5">
                  నెరవేరింది · Fulfilled!
                </p>
                <p className="text-xs text-green-700">
                  ఈ పదం Yaasalu లో చేర్చబడింది.{' '}
                  <a
                    href={`https://yaasalu.com/yaasa/${post.yaasalu_slug || post.word_transliteration}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-green-900 transition-colors"
                  >
                    View on Yaasalu →
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Definitions section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              నిర్వచనాలు · Definitions
            </h2>
            <DefinitionList definitions={definitions} />

            <div className="mt-6">
              <DefinitionForm postId={post.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
