'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PostCard from '@/components/posts/PostCard';
import { getPosts, createPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BilingualInput from '@/components/shared/BilingualInput';

const REGION_META = {
  uttarandhra: { name: 'Uttarandhra', telugu: 'ఉత్తరాంధ్ర', desc: 'Srikakulam · Vizianagaram · Visakhapatnam dialects', emoji: '🌊' },
  rayalaseema: { name: 'Rayalaseema', telugu: 'రాయలసీమ', desc: 'Kurnool · Kadapa · Anantapur · Chittoor dialects', emoji: '🏔️' },
  telangana:   { name: 'Telangana',   telugu: 'తెలంగాణ',   desc: 'Hyderabad · Warangal · Nizamabad dialects', emoji: '🕌' },
  kosta:       { name: 'Kosta',       telugu: 'కోస్తా',     desc: 'Krishna · Guntur · West & East Godavari dialects', emoji: '🌴' },
  diaspora:    { name: 'Diaspora',    telugu: 'డయాస్పోరా', desc: 'Malaysia · Sri Lanka · US · UK · Fiji · South Africa', emoji: '✈️' },
};

const POST_TYPES = [
  { value: 'discussion', label: 'Discussion', telugu: 'చర్చ' },
  { value: 'slang', label: 'Slang', telugu: 'స్థానిక మాట' },
  { value: 'meme', label: 'Meme', telugu: 'మీమ్' },
  { value: 'question', label: 'Question', telugu: 'ప్రశ్న' },
];

export default function RegionPage() {
  const { region } = useParams();
  const { user, isLoggedIn } = useAuth();
  const meta = REGION_META[region];

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // New post form state
  const [postType, setPostType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!meta) return;
    async function load() {
      try {
        setLoading(true);
        const data = await getPosts({ region, page });
        setPosts(data.items);
        setTotalPages(data.pages);
      } catch (e) {
        setError('పోస్టులు లోడ్ చేయడంలో సమస్య');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [region, page]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setFormError('శీర్షిక అవసరం'); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      const post = await createPost({
        title: title.trim(),
        body: body.trim() || null,
        post_type: postType,
        region,
        category_slug: region,
      });
      setPosts((prev) => [post, ...prev]);
      setTitle('');
      setBody('');
      setShowForm(false);
    } catch (e) {
      setFormError(e.message || 'Submit చేయడంలో సమస్య');
    } finally {
      setSubmitting(false);
    }
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-slate-700 font-medium">ఈ ప్రాంతం కనపడలేదు</p>
          <Link href="/regions" className="text-amber-600 hover:underline text-sm mt-2 inline-block">
            అన్ని ప్రాంతాలు చూడండి
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-stone-500 text-sm mb-1">
                <Link href="/regions" className="hover:text-amber-600">ప్రాంతాలు</Link>
                <span>›</span>
                <span>{meta.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {meta.emoji} {meta.telugu}
                <span className="text-stone-400 font-normal text-lg ml-2">{meta.name}</span>
              </h1>
              <p className="text-stone-500 text-sm mt-1">{meta.desc}</p>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-4 shrink-0"
              >
                + పోస్ట్ చేయండి
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* New post form */}
        {showForm && isLoggedIn && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">కొత్త పోస్ట్</h2>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Post type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">రకం</label>
                <div className="flex gap-2 flex-wrap">
                  {POST_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setPostType(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        postType === t.value
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {t.telugu} · {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <BilingualInput
                label={<>శీర్షిక <span className="text-red-500">*</span></>}
                placeholder="మీ పోస్ట్ గురించి..."
                value={title}
                onChange={setTitle}
                required
              />

              <BilingualInput
                label="వివరాలు (optional)"
                placeholder="మరిన్ని వివరాలు చెప్పండి..."
                value={body}
                onChange={setBody}
                multiline
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {submitting ? 'పోస్ట్ అవుతోంది...' : 'పోస్ట్ చేయండి'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50"
                >
                  రద్దు
                </button>
              </div>
            </form>
          </div>
        )}

        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex items-center justify-between">
            <span>పోస్ట్ చేయడానికి login చేయండి</span>
            <a href="https://yaasalu.com/login" className="font-medium hover:underline">Login →</a>
          </div>
        )}

        {loading && <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">{meta.emoji}</p>
            <p className="text-stone-500 text-lg">{meta.telugu} లో ఇంకా పోస్టులు లేవు</p>
            <p className="text-stone-400 text-sm mt-1">మొదటివాడు అవ్వండి!</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← వెనక్కి
                </button>
                <span className="px-4 py-2 text-stone-500 text-sm">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ముందుకు →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
