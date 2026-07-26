import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/google-auth";
import { GoogleSignIn } from "./google-sign-in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vivid Labs sign-in",
  description: "Secure access to the InterviewRunway workspace.",
  robots: { follow: false, index: false },
};

function safeReturnTo(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://interviewrunway.local");
    return url.origin === "https://interviewrunway.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: requestedReturnTo } = await searchParams;
  const returnTo = safeReturnTo(requestedReturnTo);
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (existingSession && (await verifySessionToken(existingSession))) {
    redirect(returnTo);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  return (
    <main className="vivid-sign-in">
      <div className="vivid-sign-in__atmosphere" aria-hidden="true">
        <i />
        <i />
        <span />
      </div>

      <section aria-labelledby="vivid-sign-in-title">
        <div className="vivid-sign-in__mark">
          <span>IR</span>
          <p>InterviewRunway</p>
        </div>
        <p className="vivid-sign-in__eyebrow">Vivid Labs · Secure workspace</p>
        <h1 id="vivid-sign-in-title">
          Authorized crew
          <em> only.</em>
        </h1>
        <p className="vivid-sign-in__lede">
          Sign in with your Vivid Labs Google Workspace account to enter the
          InterviewRunway operating environment.
        </p>

        <div className="vivid-sign-in__card">
          <div>
            <span>ACCESS POLICY</span>
            <strong>@vividlabsai.com</strong>
          </div>
          {clientId ? (
            <GoogleSignIn clientId={clientId} returnTo={returnTo} />
          ) : (
            <p role="alert">
              Google sign-in is not configured. Contact the Vivid Labs
              administrator.
            </p>
          )}
        </div>

        <p className="vivid-sign-in__footnote">
          Authentication is provided by Google. InterviewRunway never receives
          your Google password.
        </p>
      </section>
    </main>
  );
}
