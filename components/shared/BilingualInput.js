'use client'

import { useState, useRef, useEffect } from 'react'

export default function BilingualInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  multiline = false,
  required = false,
  rows = 4,
  className = '',
}) {
  const [teluguMode, setTeluguMode] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault()
        setTeluguMode((prev) => !prev)
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [])

  const inputClasses = `
    w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5
    text-slate-800 placeholder-stone-400
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
    transition-colors duration-150
    ${teluguMode ? 'text-lg font-[var(--font-noto-telugu)]' : 'text-base'}
    ${className}
  `

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef}
            id={name}
            name={name}
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={inputClasses}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={inputClasses}
          />
        )}

        {/* Mode indicator pill */}
        <span
          className={`absolute top-2.5 right-3 px-2 py-0.5 rounded-full text-xs font-semibold select-none pointer-events-none
            ${teluguMode
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-slate-100 text-slate-500 border border-slate-300'
            }`}
          aria-live="polite"
          aria-label={teluguMode ? 'Telugu input mode active' : 'English input mode active'}
        >
          {teluguMode ? 'తె' : 'En'}
        </span>
      </div>

      <p className="text-xs text-stone-500 flex items-center gap-1">
        <span>తెలుగు లో లేదా English లో టైప్ చేయండి</span>
        <span className="text-stone-400">·</span>
        <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-stone-600 font-mono text-xs">
          Ctrl+Q
        </kbd>
        <span>to switch</span>
      </p>
    </div>
  )
}
