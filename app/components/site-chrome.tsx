import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/vault", label: "Vault" },
  { href: "/proof", label: "Results" },
  { href: "/premium", label: "1:1 Coaching" },
  { href: "/about", label: "About" },
] as const;

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="InterviewRunway home">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span>INTERVIEW<span>RUNWAY</span></span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="signin-link" href="/ai-prep">Vault sign in</Link>
          <Link className="compact-cta" href="/checkout/vault" data-analytics-event="checkout_started">
            Get the Vault <span>₹799</span>
          </Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            <Link href="/ai-prep">Vault sign in</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Brand />
          <p>Interview prep for engineers in India targeting remote and AI-adjacent tech roles.</p>
        </div>
        <div className="footer-links">
          <div><p>PRODUCT</p><Link href="/vault">The Vault</Link><Link href="/ai-prep">AI Prep</Link><Link href="/premium">1:1 Coaching</Link></div>
          <div><p>TRUST</p><Link href="/about">About</Link><Link href="/proof">Results policy</Link><Link href="/compare/interview-kickstart-alternative-india">Compare</Link></div>
          <div><p>LEGAL</p><Link href="/legal/refund">Refunds</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} InterviewRunway</span>
        <span>All prices shown in INR · Seller details added before payments go live</span>
      </div>
    </footer>
  );
}

export function CtaLink({ href, children, event }: { href: string; children: ReactNode; event?: string }) {
  return <Link className="primary-cta" href={href} data-analytics-event={event}>{children}</Link>;
}

export function SectionHeading({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id?: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function PageHero({ eyebrow, title, body, children, quiet = false, motif = "airfoil" }: { eyebrow: string; title: ReactNode; body: string; children?: ReactNode; quiet?: boolean; motif?: "airfoil" | "instruments" | "turbine" | "calibrator" | "signal" }) {
  return (
    <section className={`page-hero section-pad ${quiet ? "page-hero-quiet" : ""} page-hero-${motif}`}>
      {!quiet ? <div className={`page-hero-motif motif-${motif}`} aria-hidden="true"><i /><i /><i /><span /></div> : null}
      <div className="container page-hero-inner">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
      </div>
    </section>
  );
}

export function PageShell({ children, mobilePurchase = false }: { children: ReactNode; mobilePurchase?: boolean }) {
  return <div className={`site-shell ${mobilePurchase ? "has-mobile-purchase" : ""}`}><Header /><main>{children}</main><Footer />{mobilePurchase ? <MobilePurchaseBar /> : null}</div>;
}

export function MobilePurchaseBar() {
  return (
    <div className="mobile-purchase" role="region" aria-label="Vault purchase">
      <div><span>THE VAULT</span><strong>₹799 <small>once</small></strong></div>
      <Link href="/checkout/vault" data-analytics-event="checkout_started">Get access <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
