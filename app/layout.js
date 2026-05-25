import { Noto_Sans_Telugu } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/nav/Navbar'
import Footer from '@/components/shared/Footer'

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-telugu',
})

export const metadata = {
  title: 'రచ్చబండ · Racchabanda',
  description: 'Telugu community forum — రచ్చబండ. Request words, discuss Telugu typos, explore regions, and share feedback.',
  keywords: 'Telugu, language, forum, community, Racchabanda, రచ్చబండ',
}

export default function RootLayout({ children }) {
  return (
    <html lang="te" className={notoSansTelugu.variable}>
      <body className="bg-stone-50 text-slate-800 min-h-screen flex flex-col font-[var(--font-noto-telugu)]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
