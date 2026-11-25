import Script from 'next/script'

import './forum.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoginPopup from '@/components/LoginPopup'
import { currentMe } from '@/lib/me'

// The forum wears the dictionary's brand: its header and footer are the site's own markup,
// styled by the site's files (Bootstrap 5.1, Font Awesome, /Static/css/site.css and brand.css,
// served by the yaasalu site on the same domain), plus app/forum.css for the forum's parts.
// Unlike the blog, these /Static links carry no content hash (this app is built on Vercel,
// without the site's files), so after a brand change browsers may keep the old css for a while.

export const metadata = {
  metadataBase: new URL('https://www.yaasalu.com'),
  title: 'రచ్చబండ · యాసలు',
  description: 'ఊరంతా కూర్చుని మాట్లాడుకునే చోటు: తెలుగు పదాలు, ఊరి మాటల గురించి చర్చలు. Racchabanda, the Yaasalu forum.',
  openGraph: { siteName: 'యాసలు | Yaasalu', locale: 'te_IN', type: 'website' },
}

// Every page knows who is looking (the header, reply boxes), so pages are rendered per request
export const dynamic = 'force-dynamic'

const GA_ID = 'G-C401QLB5BC'

export default async function RootLayout({ children }) {
  const me = await currentMe()
  return (
    <html lang="te">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anek+Telugu:wght@500;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossOrigin="anonymous" />
        {/* No crossOrigin, exactly as the site loads it: Font Awesome only sends its CORS header to
            requests that ask with an Origin, and Safari reuses the site's plain cached copy for a
            crossOrigin request, finds no CORS header and drops the stylesheet (blank icons on phones) */}
        {/* Icons: the site's own trimmed Font Awesome Free (yaasa scripts/build_icons.py) */}
        <link href="/Static/css/icons.css" rel="stylesheet" />
        <link href="/Static/css/site.css" rel="stylesheet" />
        <link href="/Static/css/brand.css" rel="stylesheet" />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}');`}
        </Script>
      </head>
      <body>
        <Header me={me} />
        <main className="site-main rb">{children}</main>
        <Footer />
        {!me.user && <LoginPopup />}
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        {/* The site's Telugu typing for the forum's text boxes (class yc-text), like its comment box */}
        <Script src="https://cdn.jsdelivr.net/npm/@indic-transliteration/sanscript@1.3.3/sanscript.min.js" strategy="afterInteractive" />
        <Script src="/Static/scripts/telugu-typing.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
