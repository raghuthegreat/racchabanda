'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BilingualInput from '@/components/shared/BilingualInput';
import { createPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const FEEDBACK_TYPES = [
  { value: 'bug', label: '🐛 Bug Report', telugu: 'తప్పు నివేదన', desc: 'Something is broken' },
  { value: 'feature', label: '✨ Feature Request', telugu: 'కొత్త feature', desc: 'Suggest an improvement' },
  { value: 'section_request', label: '📋 New Section', telugu: 'కొత్త విభాగం', desc: 'Request a new forum section' },
  { value: 'word_quality', label: '📖 Word Quality', telugu: 'పదం నాణ్యత', desc: 'Issue with a word on Yaasalu' },
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [postType, setPostType] = useState('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [wordUrl, setWordUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError('శీర్షిక అవసరం'); return; }
    if (postType === 'word_quality' && !wordUrl.trim()) {
      setError('Word quality feedback కు Yaasalu word URL అవసరం');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await createPost({
        title: title.trim(),
        body: body.trim() || null,
        post_type: postType,
        category_slug: 'feedback',
        yaasalu_word_url: postType === 'word_quality' ? wordUrl.trim() : undefined,
      });
      router.push('/feedback');
    } catch (e) {
      setError(e.message || 'Submit చేయడంలో సమస్య. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-3">🔐</p>
          <p className="text-slate-700 font-medium mb-2">Login అవ్వాలి</p>
          <p className="text-stone-500 text-sm mb-4">Feedback ఇవ్వడానికి login చేయండి</p>
          <a href="https://yaasalu.com/login" className="inline-block bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            Login చేయండి
          </a>
        </div>
      </div>
    );
  }

  const selectedType = FEEDBACK_TYPES.find((t) => t.value === postType);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/feedback" className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-1 mb-6">
          ← అభిప్రాయానికి వెళ్ళు
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">అభిప్రాయం చెప్పండి</h1>
          <p className="text-stone-500 text-sm mb-6">Bug, feature request, లేదా word quality issue — మాకు చెప్పండి</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Feedback type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                రకం <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPostType(t.value)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      postType === t.value
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-stone-200 hover:border-stone-300 text-slate-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className={`text-xs mt-0.5 ${postType === t.value ? 'text-amber-600' : 'text-stone-400'}`}>
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Word URL — only for word_quality */}
            {postType === 'word_quality' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Yaasalu Word URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={wordUrl}
                  onChange={(e) => setWordUrl(e.target.value)}
                  placeholder="https://yaasalu.com/yaasa/[word]"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-stone-400 mt-1">
                  Word page URL paste చేయండి
                </p>
              </div>
            )}

            {/* Title */}
            <BilingualInput
              label={<>శీర్షిక <span className="text-red-500">*</span></>}
              placeholder={
                postType === 'bug' ? 'ఏం తప్పు జరుగుతోంది?' :
                postType === 'feature' ? 'ఏం చేయాలని ఉంది?' :
                postType === 'section_request' ? 'ఏ విభాగం కావాలి?' :
                'ఏ పదం గురించి?'
              }
              value={title}
              onChange={setTitle}
              required
            />

            {/* Body */}
            <BilingualInput
              label="వివరాలు (optional)"
              placeholder="మరిన్ని వివరాలు చెప్పండి..."
              value={body}
              onChange={setBody}
              multiline
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                {submitting ? 'Submit అవుతోంది...' : 'Submit చేయండి'}
              </button>
              <Link
                href="/feedback"
                className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
              >
                రద్దు చేయి
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
