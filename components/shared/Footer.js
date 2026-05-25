import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-stone-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold text-amber-700">
              రచ్చబండ · Racchabanda
            </p>
            <p className="text-sm text-stone-500 mt-1">
              Telugu community forum — మీ అభిప్రాయాలు చెప్పండి
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <a
              href="https://yaasalu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-700 transition-colors"
            >
              yaasalu.com
            </a>
            <Link href="/request-a-word" className="hover:text-amber-700 transition-colors">
              మాట అడగండి
            </Link>
            <Link href="/telugu-typos" className="hover:text-amber-700 transition-colors">
              తప్పుల తడక
            </Link>
            <Link href="/regions" className="hover:text-amber-700 transition-colors">
              ప్రాంతాలు
            </Link>
            <Link href="/feedback" className="hover:text-amber-700 transition-colors">
              అభిప్రాయం
            </Link>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
          © {currentYear} Racchabanda · రచ్చబండ. Built with ❤ for the Telugu community.
        </div>
      </div>
    </footer>
  )
}
