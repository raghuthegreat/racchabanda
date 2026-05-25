'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BilingualInput from '@/components/shared/BilingualInput'
import { createPost } from '@/lib/api'

const REGIONS = [
  { value: '', label: 'ప్రాంతం ఎంచుకోండి · Select region' },
  { value: 'uttarandhra', label: 'ఉత్తరాంధ్ర · Uttarandhra' },
  { value: 'rayalaseema', label: 'రాయలసీమ · Rayalaseema' },
  { value: 'telangana', label: 'తెలంగాణ · Telangana' },
  { value: 'kosta', label: 'కోస్తా · Kosta' },
  { value: 'diaspora', label: 'డయాస్పోరా · Diaspora' },
]

export default function NewWordRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    word_transliteration: '',
    word_telugu: '',
    region: '',
    context: '',
    example_sentence: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.word_transliteration.trim()) return
    setLoading(true)
    setError(null)

    try {
      const title = form.word_transliteration.trim()
      const post = await createPost({
        category: 'request-a-word',
        title,
        word_transliteration: form.word_transliteration.trim(),
        word_telugu: form.word_telugu.trim() || undefined,
        region: form.region || undefined,
        body: form.context.trim() || undefined,
        example_sentence: form.example_sentence.trim() || undefined,
      })
      router.push(`/request-a-word/${post.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/request-a-word" className="hover:text-amber-700 transition-colors">
          మాట అడగండి
        </Link>
        <span>›</span>
        <span className="text-slate-600">కొత్త పదం</span>
      </nav>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <h1 className="telugu-heading text-xl font-bold text-slate-900 mb-1">
          పదం అడగండి
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Request a word · Tell us what word you&apos;re looking for
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Word transliteration */}
          <div className="space-y-1.5">
            <label htmlFor="word_transliteration" className="block text-sm font-medium text-slate-700">
              పదం (Transliteration) <span className="text-red-500">*</span>
            </label>
            <input
              id="word_transliteration"
              name="word_transliteration"
              type="text"
              value={form.word_transliteration}
              onChange={handleChange('word_transliteration')}
              placeholder="e.g. Gurruvayyi, Chinnari..."
              required
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-slate-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-base"
            />
            <p className="text-xs text-stone-400">English లో పదం రాయండి (transliteration)</p>
          </div>

          {/* Word Telugu script */}
          <BilingualInput
            label="పదం (తెలుగు లిపి) · Telugu Script (optional)"
            name="word_telugu"
            placeholder="తెలుగులో రాయడానికి Ctrl+Q నొక్కండి..."
            value={form.word_telugu}
            onChange={handleChange('word_telugu')}
          />

          {/* Region */}
          <div className="space-y-1.5">
            <label htmlFor="region" className="block text-sm font-medium text-slate-700">
              ప్రాంతం · Region
            </label>
            <select
              id="region"
              value={form.region}
              onChange={handleChange('region')}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Context */}
          <BilingualInput
            label="సందర్భం · Context / Usage"
            name="context"
            placeholder="ఈ పదం ఎప్పుడు వాడతారు? Where/how is this word used?"
            value={form.context}
            onChange={handleChange('context')}
            multiline
            rows={3}
          />

          {/* Example sentence */}
          <BilingualInput
            label="ఉదాహరణ వాక్యం · Example sentence (optional)"
            name="example_sentence"
            placeholder="ఈ పదాన్ని వాక్యంలో వాడండి..."
            value={form.example_sentence}
            onChange={handleChange('example_sentence')}
            multiline
            rows={2}
          />

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.word_transliteration.trim()}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'పంపిస్తున్నారు...' : 'పదం పంపించండి · Submit'}
            </button>
            <Link
              href="/request-a-word"
              className="px-4 py-2.5 text-sm text-slate-600 hover:text-amber-700 transition-colors"
            >
              రద్దు చేయండి · Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
