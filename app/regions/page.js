'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard from '@/components/posts/PostCard';
import { getPosts } from '@/lib/api';

const REGIONS = [
  { slug: 'uttarandhra', name: 'Uttarandhra', telugu: 'ఉత్తరాంధ్ర', desc: 'Srikakulam · Vizianagaram · Visakhapatnam' },
  { slug: 'rayalaseema', name: 'Rayalaseema', telugu: 'రాయలసీమ', desc: 'Kurnool · Kadapa · Anantapur · Chittoor' },
  { slug: 'telangana',   name: 'Telangana',   telugu: 'తెలంగాణ',   desc: 'Hyderabad · Warangal · Nizamabad' },
  { slug: 'kosta',       name: 'Kosta',       telugu: 'కోస్తా',     desc: 'Krishna · Guntur · West & East Godavari' },
  { slug: 'diaspora',    name: 'Diaspora',    telugu: 'డయాస్పోరా', desc: 'Malaysia · Sri Lanka · US · UK · Fiji · South Africa' },
];

export default function RegionsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRegion, setActiveRegion] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = { page };
        if (activeRegion !== 'all') params.region = activeRegion;
        const data = await getPosts(params);
        setPosts(data.items);
        setTotalPages(data.pages);
      } catch (e) {
        setError('పోస్టులు లోడ్ చేయడంలో సమస్య · Could not load posts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeRegion, page]);

  function handleRegionChange(slug) {
    setActiveRegion(slug);
    setPage(1);
  }

  const activeRegionInfo = REGIONS.find((r) => r.slug === activeRegion);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">
            ప్రాంతాలు <span className="text-stone-400 font-normal text-lg ml-2">Region Groups</span>
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            మీ ప్రాంతపు భాష, జోకులు, గాసిప్ — అన్నీ ఇక్కడే
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Region tiles at top */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {REGIONS.map((region) => (
            <Link
              key={region.slug}
              href={`/regions/${region.slug}`}
              className="bg-white border border-stone-200 hover:border-amber-400 hover:shadow-sm rounded-xl p-4 text-center transition-all group"
            >
              <div className="text-lg font-bold text-slate-800 group-hover:text-amber-700">
                {region.telugu}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{region.name}</div>
            </Link>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => handleRegionChange('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeRegion === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-400'
            }`}
          >
            అన్నీ · All
          </button>
          {REGIONS.map((region) => (
            <button
              key={region.slug}
              onClick={() => handleRegionChange(region.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeRegion === region.slug
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-400'
              }`}
            >
              {region.telugu}
            </button>
          ))}
        </div>

        {/* Active region header */}
        {activeRegionInfo && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeRegionInfo.telugu} · {activeRegionInfo.name}
            </h2>
            <p className="text-stone-500 text-xs mt-0.5">{activeRegionInfo.desc}</p>
          </div>
        )}

        {loading && <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-stone-500 text-lg">ఇంకా పోస్టులు లేవు</p>
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
