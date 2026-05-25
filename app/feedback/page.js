'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard from '@/components/posts/PostCard';
import Badge from '@/components/shared/Badge';
import { getPosts } from '@/lib/api';

const FEEDBACK_TYPES = [
  { value: 'all', label: 'అన్నీ · All' },
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'section_request', label: '📋 New Section' },
  { value: 'word_quality', label: '📖 Word Quality' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'అన్నీ' },
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
];

export default function FeedbackPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postType, setPostType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = { category_slug: 'feedback', page };
        if (postType !== 'all') params.post_type = postType;
        if (status !== 'all') params.status = status;
        const data = await getPosts(params);
        setPosts(data.items);
        setTotalPages(data.pages);
      } catch (e) {
        setError('పోస్టులు లోడ్ చేయడంలో సమస్య');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postType, status, page]);

  function handleTypeChange(v) { setPostType(v); setPage(1); }
  function handleStatusChange(v) { setStatus(v); setPage(1); }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              అభిప్రాయం <span className="text-stone-400 font-normal text-lg ml-2">Feedback</span>
            </h1>
            <p className="text-stone-500 mt-1 text-sm">
              Bug reports · Feature requests · Section suggestions · Word quality
            </p>
          </div>
          <Link
            href="/feedback/new"
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + అభిప్రాయం చెప్పండి
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="space-y-3 mb-6">
          {/* Type filter */}
          <div className="flex gap-2 flex-wrap">
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  postType === t.value
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  status === s.value
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-stone-500 text-lg">ఇంకా అభిప్రాయాలు లేవు</p>
            <Link
              href="/feedback/new"
              className="inline-block mt-4 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              మొదటిది చెప్పండి
            </Link>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} showAdminReply />
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
