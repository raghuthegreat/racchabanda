import Link from 'next/link'
import PostCard from '@/components/posts/PostCard'
import { getPosts } from '@/lib/api'

async function getRecentPosts() {
  try {
    const data = await getPosts({ limit: 5, sort: 'recent' })
    return data?.posts || data || []
  } catch {
    return []
  }
}

const SECTIONS = [
  {
    href: '/request-a-word',
    telugu: 'మాట అడగండి',
    english: 'Request a Word',
    description: 'తెలుగు పదాలకు అర్థాలు, నిర్వచనాలు అడగండి. Ask for meanings and definitions of Telugu words.',
    icon: '📝',
    color: 'border-amber-200 hover:border-amber-400 bg-amber-50',
    iconBg: 'bg-amber-100',
  },
  {
    href: '/telugu-typos',
    telugu: 'తప్పుల తడక',
    english: 'Telugu Typos',
    description: 'తెలుగులో తప్పులను అందరితో పంచుకోండి. Share amusing Telugu language mistakes.',
    icon: '✍️',
    color: 'border-rose-200 hover:border-rose-400 bg-rose-50',
    iconBg: 'bg-rose-100',
  },
  {
    href: '/regions',
    telugu: 'ప్రాంతాలు',
    english: 'Regions',
    description: 'ఉత్తరాంధ్ర, రాయలసీమ, తెలంగాణ, కోస్తా మరియు డయాస్పోరా. Explore Telugu dialects by region.',
    icon: '🗺️',
    color: 'border-teal-200 hover:border-teal-400 bg-teal-50',
    iconBg: 'bg-teal-100',
  },
  {
    href: '/feedback',
    telugu: 'అభిప్రాయం',
    english: 'Feedback',
    description: 'మీ అభిప్రాయాలు, సూచనలు మాతో పంచుకోండి. Share your thoughts and suggestions.',
    icon: '💬',
    color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50',
    iconBg: 'bg-indigo-100',
  },
]

export default async function HomePage() {
  const recentPosts = await getRecentPosts()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Hero */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-8 mb-8 text-white shadow-lg">
            <div className="max-w-xl">
              <h1 className="telugu-heading text-4xl font-bold mb-2 drop-shadow">
                రచ్చబండ
              </h1>
              <p className="text-xl font-semibold text-amber-100 mb-4">Racchabanda</p>
              <p className="text-amber-50 text-base leading-relaxed mb-6">
                Telugu community forum — మీ అభిప్రాయాలు చెప్పండి, పదాలు నేర్చుకోండి,
                ప్రాంతీయ భాషా వైవిధ్యాలు అన్వేషించండి.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/request-a-word/new"
                  className="px-5 py-2.5 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors text-sm shadow"
                >
                  + పదం జోడించండి
                </Link>
                <Link
                  href="/request-a-word"
                  className="px-5 py-2.5 bg-amber-800 bg-opacity-40 text-white font-medium rounded-lg hover:bg-opacity-60 transition-colors text-sm border border-amber-500"
                >
                  మాట అడగండి
                </Link>
              </div>
            </div>
          </div>

          {/* Section cards */}
          <h2 className="text-lg font-semibold text-slate-800 mb-4">విభాగాలు · Sections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className={`block rounded-xl border-2 p-5 transition-all duration-150 hover:shadow-md ${section.color} group`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${section.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
                    {section.icon}
                  </div>
                  <div>
                    <div className="telugu-text text-base font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                      {section.telugu}
                    </div>
                    <div className="text-sm text-stone-500 font-medium mb-1">{section.english}</div>
                    <p className="text-xs text-stone-600 leading-relaxed">{section.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent activity */}
          {recentPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                తాజా పోస్టులు · Recent Activity
              </h2>
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 shrink-0 space-y-4">
          {/* Yaasalu link */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <a
              href="https://yaasalu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-xl font-bold text-amber-700">యాసలు</span>
              <span className="text-sm text-stone-400">· Yaasalu</span>
              <svg className="w-4 h-4 text-stone-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-stone-500 leading-relaxed">
              Telugu dictionary and language platform. రచ్చబండ is the community forum of Yaasalu.
            </p>
          </div>

          {/* Regions quick links */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ప్రాంతాలు · Regions</h3>
            <div className="space-y-1">
              {[
                { slug: 'uttarandhra', telugu: 'ఉత్తరాంధ్ర', english: 'Uttarandhra' },
                { slug: 'rayalaseema', telugu: 'రాయలసీమ', english: 'Rayalaseema' },
                { slug: 'telangana', telugu: 'తెలంగాణ', english: 'Telangana' },
                { slug: 'kosta', telugu: 'కోస్తా', english: 'Kosta' },
                { slug: 'diaspora', telugu: 'డయాస్పోరా', english: 'Diaspora' },
              ].map((r) => (
                <Link
                  key={r.slug}
                  href={`/regions/${r.slug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-700 text-sm text-slate-600 transition-colors"
                >
                  <span className="telugu-text text-base">{r.telugu}</span>
                  <span className="text-xs text-stone-400">· {r.english}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick contribute */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">దోహదం చేయండి</h3>
            <p className="text-xs text-amber-700 mb-3 leading-relaxed">
              Telugu language knowledge తో contribute చేయండి — పదాలకు నిర్వచనాలు రాయండి.
            </p>
            <Link
              href="/request-a-word"
              className="block text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              నిర్వచనం రాయండి
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
