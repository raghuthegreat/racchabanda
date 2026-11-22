// The dictionary's footer: the same markup as yaasa templates/index.html <footer> and the blog's
// components/Footer.js (styles in /Static/css/site.css). The feedback form lives on the
// dictionary's pages, so its links open it there.
export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-links">
        <a href="/maagurinchi">మా గురించి</a>
        <a href="/?feedback=1">సంప్రదించండి</a>
        <a href="/?feedback=1">Feedback</a>
      </nav>
      <nav className="site-footer-social" aria-label="Social">
        <a href="https://fb.com/yaasalu" title="Facebook" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
        <a href="https://instagram.com/yaasalu" title="Instagram" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        <a href="https://twitter.com/yaasalu2" title="Twitter" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
        <a href="https://www.youtube.com/channel/UCGTWtPimTocvDGa5xSZi_uA" title="YouTube" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
      </nav>
      <div className="footer-copyright">© 2020–{new Date().getFullYear()} <a href="https://yaasalu.com/">yaasalu.com</a></div>
    </footer>
  )
}
