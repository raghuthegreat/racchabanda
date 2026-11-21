// The dictionary's header: the same markup as yaasa templates/index.html <header> and the blog's
// components/Header.js, styled by the site's files. Keep them in step. Differences on the forum:
// the line under యాసలు says రచ్చబండ, the రచ్చబండ menu item is marked current, and who is logged in
// comes from the server (lib/site.js getMe), so there is no "లాగిన్" flash. Links to the rest of
// the site are plain <a> (outside this app's /racchabanda basePath).

const REGIONS = [
  ['ఉత్తరాంధ్ర', ['శ్రీకాకుళం', 'విజయనగరం', 'బొబ్బిలి']],
  ['కోస్తా', ['గోదావరి', 'కృష్ణ', 'నెల్లూరు']],
  ['తెలంగాణ', ['మెదక్', 'సంగారెడ్డి', 'జగిత్యాల', 'నాగర్ కర్నూలు']],
  ['రాయలసీమ', ['చిత్తూరు', 'నంద్యాల', 'కడప', 'అనంతపురం']],
  ['తమిళనాడు', [['హోసూరు', 'హోసూరు Hosuru'], ['సేలం', 'సేలం Selam']]],
  ['ఒడిశా', [['బరంపురం', 'బరంపురం Barampuram']]],
  ['కర్ణాటక', [['కోలార్', 'కోలార్ Kolar'], ['పావుగడ', 'పావుగడ Paavugada']]],
  [['మలేషియా', 'మలేషియా Malaysia'], []],
  [['శ్రీలంక', 'శ్రీలంక Sri Lanka'], []],
]
const link = (r) => (Array.isArray(r) ? r : [r, r])

export default function Header({ me }) {
  const user = me && me.user
  const unseen = (me && me.unseen) || 0
  const pic = user && user.pic && user.pic.startsWith('http') ? user.pic : null

  return (
    <header className="site-header" style={{ marginTop: '-20px' }}>
      <div className="px-3 py-2 site-bar">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <a href="/" className="site-brand d-flex align-items-center my-1 my-lg-0 me-lg-auto text-decoration-none">
              <img src="/Static/images/yaasalu-granary.svg" alt="" width="48" height="48" />
              <span><span className="site-brand-name">యాసలు</span><span className="site-brand-tag">రచ్చబండ</span></span>
            </a>
            <div className="site-phone-actions d-flex d-lg-none">
              <a href="/?add=forum_topbar_phone" className="site-add-mini" aria-label="పదం జోడించండి" title="పదం జోడించండి"><i className="fas fa-plus" aria-hidden="true"></i></a>
              {user && (
                <a className="site-bell" href="/notifications" aria-label={unseen ? `కొత్తవి (${unseen})` : 'కొత్తవి'}>
                  <i className="fas fa-bell" aria-hidden="true"></i>{unseen > 0 && <span className="site-bell-n">{unseen}</span>}
                </a>
              )}
              <button className="site-menu-btn" type="button" data-bs-toggle="collapse" data-bs-target="#siteNav"
                      aria-controls="siteNav" aria-expanded="false" aria-label="మెనూ"><i className="fas fa-bars"></i></button>
            </div>
            <div className="collapse d-lg-block site-nav" id="siteNav">
              <ul className="nav flex-column flex-lg-row align-items-lg-center my-2 my-lg-0 text-small">
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle text-white" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    ప్రాంతాలు
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    {REGIONS.map(([main, subs]) => {
                      const [id, label] = link(main)
                      return (
                        <li key={id}>
                          <a className="dropdown-item" href={`/region/${id}`}>{label}</a>
                          {subs.length > 0 && (
                            <ul className="submenu">
                              {subs.map((s) => {
                                const [sid, slabel] = link(s)
                                return <li key={sid}><a className="dropdown-item" href={`/region/${sid}`}>{slabel}</a></li>
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </li>
                <li className="nav-item" style={{ listStyleType: 'none' }}>
                  <a href="/requests" className="nav-link text-white">అభ్యర్థనలు</a>
                </li>
                <li className="nav-item" style={{ listStyleType: 'none' }}>
                  <a href="/racchabanda" className="nav-link text-white rb-nav-current" aria-current="page">రచ్చబండ</a>
                </li>
                <li className="nav-item" style={{ listStyleType: 'none' }}>
                  <a href="/contributors" className="nav-link text-white">రాసినవాళ్ళు</a>
                </li>
                <li className="nav-item" style={{ listStyleType: 'none' }}>
                  <a href="/blog/" className="nav-link text-white">Blog</a>
                </li>
                <li className="nav-item d-none d-lg-block" style={{ listStyleType: 'none' }}>
                  <a href="/?add=forum_topbar" className="site-add-btn"><i className="fas fa-plus" aria-hidden="true"></i> జోడించండి</a>
                </li>
                {user ? (
                  <li className="nav-item dropdown" style={{ listStyleType: 'none' }}>
                    <button className="btn dropdown-toggle site-user-btn" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      {pic
                        ? <img className="site-user-pic" src={pic} alt="" referrerPolicy="no-referrer" />
                        : <span className="site-user-pic site-user-initial" aria-hidden="true">{(user.name || '?').slice(0, 1)}</span>}
                      {' '}{user.name}{' '}
                      {unseen > 0 && <span className="badge rounded-pill bg-danger" title={`${unseen} కొత్తవి`}>{unseen}</span>}
                      <span className="caret"></span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end site-user-menu" aria-labelledby="dropdownMenuButton" lang="te">
                      <li><a className="dropdown-item" href="/notifications"><i className="fas fa-bell site-menu-icon" aria-hidden="true"></i> కొత్తవి
                        {unseen > 0 && <> <span className="badge rounded-pill bg-danger">{unseen}</span></>}</a></li>
                      <li><a className="dropdown-item" href={`/user/${user.id}`}>నా ప్రొఫైల్</a></li>
                      <li><a className="dropdown-item" href={`/user/${user.id}/favorites`}>నచ్చిన పదాలు</a></li>
                      <li><a className="dropdown-item" href={`/user/${user.id}/requests`}>నా అభ్యర్థనలు</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><a className="dropdown-item" href="/logout">లాగ్ అవుట్</a></li>
                    </ul>
                  </li>
                ) : (
                  <li className="nav-item" style={{ listStyleType: 'none' }}>
                    <a href="/login" id="signinbutton" className="nav-link text-white">
                      <i className="fab fa-google" aria-hidden="true"></i> లాగిన్
                    </a>
                  </li>
                )}
                <li className="nav-item d-lg-none" style={{ listStyleType: 'none' }}>
                  <a href="/shuffle" className="nav-link text-white"><i className="fas fa-random"></i> యాదృచ్ఛిక పదం</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
