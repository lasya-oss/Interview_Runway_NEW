import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import { AeroRuntime } from "@/app/components/aero-runtime";
import { AnalyticsConsent } from "@/app/components/analytics-consent";
import { MetaPixel } from "@/app/components/meta-pixel";
import { BackToTop } from "@/app/components/back-to-top";
import "./globals.css";

const siteUrl = "https://interviewrunway.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "InterviewRunway — Turn experience into interview signal",
    template: "%s | InterviewRunway",
  },
  description:
    "Turn engineering experience into recruiter-visible evidence and rehearse it under pressure for remote and AI-adjacent roles.",
  applicationName: "InterviewRunway",
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  keywords: [
    "remote interview preparation India",
    "AI company interview prep",
    "software engineer interview prep India",
    "system design interview",
    "DSA interview preparation",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "InterviewRunway",
    title: "Turn your experience into interview signal",
    description: "Foundation builds the flight plan. The Second Seat brings live AI practice and expert guidance. Human Calibration resolves the remaining gap.",
    images: [
      {
        url: `${siteUrl}/og-three-stage.png`,
        width: 1734,
        height: 907,
        alt: "InterviewRunway — Three stages, one connected interview signal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn your experience into interview signal",
    description: "Foundation, the live AI Second Seat, and evidence-led Human Calibration for engineers in India.",
    images: [`${siteUrl}/og-three-stage.png`],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07111b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body><AeroRuntime />{children}<BackToTop /><AnalyticsConsent /><MetaPixel /></body>
    </html>
  );
}
