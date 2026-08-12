import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">EFDS</span>
            <span className="brand-copy">EFDS Society<small>Imperial College London</small></span>
          </Link>
          <p>A student-led society for people who want to understand the systems behind the numbers.</p>
        </div>
        <div className="footer-links">
          <Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link><Link href="/security">Security</Link><Link href="/events">Events</Link><Link href="/careers">Careers</Link><Link href="/login">Member login</Link>
        </div>
      </div>
    </footer>
  );
}
