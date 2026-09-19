import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AnalyticsSettingsButton } from "@/app/components/analytics-consent";
import { HeaderSignOutButton } from "@/app/components/header-sign-out";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/app/lib/google-auth";

const NAV_ITEMS = [
  { href: "/curriculum", label: "Curriculum" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo-login", label: "Try it" },
] as const;

async function readHeaderSessionLabel(): Promise<string | null> {
  try {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    const session = await verifySessionToken(token);
    if (!session) return null;
    return session.name?.trim() || session.email.split("@")[0] || null;
  } catch {
    return null;
  }
}

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="InterviewRunway home">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span>INTERVIEW<span>RUNWAY</span></span>
    </Link>
  );
}

const SIGN_IN_HREF = "/sign-in?return_to=/learn";

export async function Header() {
  const sessionLabel = await readHeaderSessionLabel();
  const sessionAction = sessionLabel
    ? <Link className="signin-link" href="/learn">{sessionLabel}</Link>
    : <Link className="signin-link" href={SIGN_IN_HREF}>Log in</Link>;
  const mobileSessionAction = sessionLabel
    ? <Link href="/learn">{sessionLabel}</Link>
    : <Link href={SIGN_IN_HREF}>Log in</Link>;
  const vaultAction = sessionLabel
    ? <Link className="compact-cta" href="/learn">Open workspace</Link>
    : (
      <Link className="compact-cta" href="/checkout/vault" data-analytics-event="checkout_started">
        Start with the Vault <span>₹799</span>
      </Link>
    );
  const mobileVaultAction = sessionLabel
    ? <Link href="/learn">Open workspace</Link>
    : <Link href="/checkout/vault">Start with the Vault · ₹799</Link>;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          {sessionAction}
          {sessionLabel ? <HeaderSignOutButton /> : null}
          {vaultAction}
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            {mobileSessionAction}
            {sessionLabel ? <HeaderSignOutButton mobile /> : null}
            {mobileVaultAction}
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
          <div><p>PRODUCT</p><Link href="/vault">The Vault</Link><Link href="/second-seat">The Second Seat</Link><Link href="/premium">1:1 Coaching</Link><Link href="/demo-login">Demo</Link></div>
          <div><p>EXPLORE</p><Link href="/pricing">Pricing</Link><Link href="/curriculum">Curriculum</Link><Link href="/about">About</Link><Link href="/proof">Evidence standard</Link></div>
          <div><p>LEGAL</p><Link href="/legal/refund">Refunds</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} InterviewRunway</span>
        <span>Seller: VividLabs AI · Paddle is merchant of record</span>
        <AnalyticsSettingsButton />
      </div>
    </footer>
  );
}

export function CtaLink({ href, children, event }: { href: string; children: ReactNode; event?: string }) {
  return <Link className="primary-cta" href={href} data-analytics-event={event}>{children}</Link>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  id,
  level = "h2",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  id?: string;
  level?: "h1" | "h2";
}) {
  const Heading = level;
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <Heading id={id}>{title}</Heading>
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
