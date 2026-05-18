'use client'

import { useState } from 'react'
import BilingualInput from '@/components/shared/BilingualInput'
import { createDefinition } from '@/lib/api'

const REGIONS = [
  { value: '', label: 'All regions · అన్ని ప్రాంతాలు' },
  { value: 'uttarandhra', label: 'ఉత్తరాంధ్ర · Uttarandhra' },
  { value: 'rayalaseema', label: 'రాయలసీమ · Rayalaseema' },
  { value: 'telangana', label: 'తెలంగాణ · Telangana' },
  { value: 'kosta', label: 'కోస్తా · Kosta' },
  { value: 'diaspora', label: 'డయాస్పోరా · Diaspora' },
]

export default function DefinitionForm({ postId, onDefinitionAdded }) {
  const [form, setForm] = useState({ definition: '', example: '', region: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.definition.trim()) return
    setLoading(true)
    setError(null)
    try {
      const def = await createDefinition(postId, {
        definition: form.definition.trim(),
        example: form.example.trim() || undefined,
        region: form.region || undefined,
      })
      setForm({ definition: '', example: '', region: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (onDefinitionAdded) onDefinitionAdded(def)
    } catch (err) {
      setError(err.message || 'Failed to submit definition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        నిర్వచనం జోడించండి · Add a Definition
      </h3>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          నిర్వచనం విజయవంతంగా జోడించబడింది! · Definition added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <BilingualInput
          label="నిర్వచనం · Definition"
          name="definition"
          placeholder="ఈ పదానికి నిర్వచనం రాయండి..."
          value={form.definition}
          onChange={handleChange('definition')}
          multiline
          rows={3}
          required
        />

        <BilingualInput
          label="ఉదాహరణ · Example sentence (optional)"
          name="example"
          placeholder="వాక్యంలో ఉపయోగం చూపించండి..."
          value={form.example}
          onChange={handleChange('example')}
          multiline
          rows={2}
        />

        <div className="space-y-1.5">
          <label htmlFor="def-region" className="block text-sm font-medium text-slate-700">
            ప్రాంతం · Region
          </label>
          <select
            id="def-region"
            value={form.region}
            onChange={handleChange('region')}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !form.definition.trim()}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'నిర్వచనం పంపించండి · Submit Definition'}
        </button>
      </form>
    </div>
  )
}
