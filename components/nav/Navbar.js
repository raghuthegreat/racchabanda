'use client'

import { useState } from 'react'
import Link from 'next/link'
import RacchabandaDropdown from './RacchabandaDropdown'
import { useAuth } from '@/lib/auth'
import { logout } from '@/lib/api'

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || 'https://yaasalu.com/login'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isLoggedIn, loading } = useAuth()

  async function handleLogout() {
    await logout()
    window.location.reload()
  }

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-2">

          {/* Left: Yaasalu logo + Racchabanda dropdown */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <a
              href="https://yaasalu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Yaasalu homepage"
            >
              <span className="text-sm font-semibold text-amber-700">యాసలు</span>
              <span className="hidden sm:inline text-xs text-stone-400">·</span>
              <span className="hidden sm:inline text-xs text-stone-500">Yaasalu</span>
            </a>

            <span className="text-stone-300">|</span>

            <RacchabandaDropdown />
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link
              href="/about"
              className="px-3 py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              మా గురించి
            </Link>

            <Link
              href="/regions"
              className="px-3 py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              ప్రాంతాలు
            </Link>

            <a
              href="https://yaasalu.com/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              Contributors
            </a>

            <a
              href="https://yaasalu.com/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              Blog
            </a>

            <Link
              href="/feedback"
              className="px-3 py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              సంప్రదించండి
            </Link>
          </nav>

          {/* Right: Log in + Add word */}
          <div className="flex items-center gap-2 shrink-0">
            {!loading && isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {user?.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-slate-600">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <a
                href={LOGIN_URL}
                className="hidden sm:inline-flex px-3 py-1.5 text-sm text-slate-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Log in
              </a>
            )}

            <Link
              href="/request-a-word/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">పదం జోడించండి</span>
              <span className="sm:hidden">జోడించు</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-600 hover:bg-stone-100 rounded-lg"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-stone-100 py-3 space-y-1">
            <Link
              href="/about"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              మా గురించి · About
            </Link>
            <Link
              href="/regions"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              ప్రాంతాలు · Regions
            </Link>
            <a
              href="https://yaasalu.com/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
            >
              Contributors
            </a>
            <a
              href="https://yaasalu.com/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
            >
              Blog
            </a>
            <Link
              href="/feedback"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              సంప్రదించండి · Contact
            </Link>
            <div className="px-4 pt-2">
              {!loading && isLoggedIn ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <a
                  href={LOGIN_URL}
                  className="block w-full text-center px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Log in
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
