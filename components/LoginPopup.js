'use client'
import { useEffect, useRef } from 'react'

// The site's login pop-up (yaasa templates/_login.html), the same markup, wording and styles
// (in app/forum.css), so logging in from the forum feels like the site. Keep them in step.
// Shown only to logged-out visitors (app/layout.js). Open it with window.yLogin(reason,
// {onGo, onCancel}), as on the site, or any link carrying data-login="<reason>"; links keep
// href="/login" so they work without JS. onGo runs just before leaving for Google (the forum
// keeps what was typed); the site's login then returns here (session referrer).
const WHY = {
  account: 'మీ ఊరి పదాలు జోడించడానికి, నచ్చినవి దాచుకోవడానికి లాగిన్ అవ్వండి.',
  forum_reply: 'జవాబు రాయడానికి లాగిన్ అవ్వండి. మీరు రాసింది అట్టి పెట్టి ఉంచాం; లాగిన్ అయ్యాక ఇక్కడే ఉంటుంది.',
  forum_thread: 'చర్చ మొదలుపెట్టడానికి లాగిన్ అవ్వండి. మీరు రాసింది అట్టి పెట్టి ఉంచాం; లాగిన్ అయ్యాక ఫారం మళ్ళీ నిండుతుంది.',
  forum_sticker: 'స్టిక్కర్ ఇవ్వడానికి లాగిన్ అవ్వండి.',
}

export default function LoginPopup() {
  const el = useRef(null)
  const why = useRef(null)
  const go = useRef(null)

  useEffect(() => {
    let cancel = null
    let going = false
    window.yLogin = (reason, opts = {}) => {
      why.current.textContent = WHY[reason] || WHY.account
      go.current.onclick = () => { going = true; if (opts.onGo) opts.onGo() }
      cancel = opts.onCancel || null
      going = false
      if (window.gtag) window.gtag('event', 'login_prompt', { reason })
      const Modal = window.bootstrap && window.bootstrap.Modal
      if (!Modal) {   // Bootstrap's script not loaded yet: go straight on, keeping what was typed
        if (opts.onGo) opts.onGo()
        window.location.href = '/login'
        return
      }
      Modal.getOrCreateInstance(el.current).show()
    }
    const onHidden = () => { const fn = cancel; cancel = null; if (fn && !going) fn() }
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('[data-login]')
      if (!a) return
      e.preventDefault()
      window.yLogin(a.getAttribute('data-login'))
    }
    const node = el.current
    node.addEventListener('hidden.bs.modal', onHidden)
    document.addEventListener('click', onClick)
    return () => {
      node.removeEventListener('hidden.bs.modal', onHidden)
      document.removeEventListener('click', onClick)
      delete window.yLogin
    }
  }, [])

  return (
    <div className="modal fade yl-modal" id="yl-login" tabIndex={-1} aria-labelledby="yl-title" aria-hidden="true" ref={el}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content yl" lang="te">
          <button type="button" className="btn-close yl-close" data-bs-dismiss="modal" aria-label="మూసివేయండి"></button>
          <img className="yl-mark" src="/Static/images/yaasalu-granary.svg" alt="" width={64} height={64} />
          <h2 className="yl-title" id="yl-title">ఒక్క క్లిక్‌తో లాగిన్ అవ్వండి</h2>
          <p className="yl-why" ref={why}></p>
          <a className="yl-google" href="/login" ref={go}>
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Google తో కొనసాగండి
          </a>
          <p className="yl-note">కొత్త పాస్‌వర్డ్ అక్కర్లేదు, మీ Gmail ఖాతా చాలు. మీ పదాల పక్కన మీ పేరు మాత్రమే కనిపిస్తుంది; మీ ఈమెయిల్ ఎవరికీ కనిపించదు.</p>
        </div>
      </div>
    </div>
  )
}
