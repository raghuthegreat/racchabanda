'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const REGIONS = [
  { slug: 'uttarandhra', telugu: 'ఉత్తరాంధ్ర', english: 'Uttarandhra' },
  { slug: 'rayalaseema', telugu: 'రాయలసీమ', english: 'Rayalaseema' },
  { slug: 'telangana', telugu: 'తెలంగాణ', english: 'Telangana' },
  { slug: 'kosta', telugu: 'కోస్తా', english: 'Kosta' },
  { slug: 'diaspora', telugu: 'డయాస్పోరా', english: 'Diaspora' },
]

export default function RacchabandaDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const linkClass =
    'flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors rounded-md'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-medium transition-colors text-sm"
      >
        <span>Racchabanda</span>
        <span className="telugu-text text-base leading-none">రచ్చబండ</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50">
          {/* Request a word */}
          <Link href="/request-a-word" className={linkClass} onClick={() => setOpen(false)}>
            <span className="text-lg">📝</span>
            <div>
              <div className="font-medium">మాట అడగండి</div>
              <div className="text-xs text-stone-400">Request a word</div>
            </div>
          </Link>

          {/* Telugu typos */}
          <Link href="/telugu-typos" className={linkClass} onClick={() => setOpen(false)}>
            <span className="text-lg">✍️</span>
            <div>
              <div className="font-medium">తప్పుల తడక</div>
              <div className="text-xs text-stone-400">Telugu typos</div>
            </div>
          </Link>

          {/* Regions header */}
          <div className="mt-1 mb-0.5">
            <Link href="/regions" className={linkClass} onClick={() => setOpen(false)}>
              <span className="text-lg">🗺️</span>
              <div>
                <div className="font-medium">ప్రాంతాలు</div>
                <div className="text-xs text-stone-400">Regions</div>
              </div>
            </Link>

            {/* Sub-regions */}
            <div className="pl-10 space-y-0.5">
              {REGIONS.map((r) => (
                <Link
                  key={r.slug}
                  href={`/regions/${r.slug}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 hover:bg-amber-50 hover:text-amber-700 rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="telugu-text text-base">{r.telugu}</span>
                  <span className="text-xs text-stone-400">· {r.english}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="my-1 border-t border-stone-100" />

          {/* Feedback */}
          <Link href="/feedback" className={linkClass} onClick={() => setOpen(false)}>
            <span className="text-lg">💬</span>
            <div>
              <div className="font-medium">అభిప్రాయం</div>
              <div className="text-xs text-stone-400">Feedback</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
