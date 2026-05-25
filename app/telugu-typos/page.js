'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TypoCard from '@/components/posts/TypoCard';
import { getPosts } from '@/lib/api';

export default function TeluguTyposPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getPosts({ post_type: 'image', page });
        setPosts(data.items);
        setTotalPages(data.pages);
      } catch (e) {
        setError('పోస్టులు లోడ్ చేయడంలో సమస్య · Could not load posts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              తప్పుల తడక <span className="text-stone-400 font-normal text-lg ml-2">Telugu Typos</span>
            </h1>
            <p className="text-stone-500 mt-1 text-sm">
              Autocorrect disasters · WhatsApp blunders · Keyboard chaos
            </p>
          </div>
          <Link
            href="/telugu-typos/new"
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + తప్పు పోస్ట్ చేయండి
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📸</p>
            <p className="text-stone-500 text-lg">ఇంకా ఏమీ పోస్ట్ చేయలేదు</p>
            <p className="text-stone-400 text-sm mt-1">మొదటి తప్పుని పోస్ట్ చేయండి!</p>
            <Link
              href="/telugu-typos/new"
              className="inline-block mt-4 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              పోస్ట్ చేయండి
            </Link>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && posts.length > 0 && (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="break-inside-avoid mb-4">
                  <TypoCard post={post} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← వెనక్కి
                </button>
                <span className="px-4 py-2 text-stone-500 text-sm">
                  {page} / {totalPages}
                </span>
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
