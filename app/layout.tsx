import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import { AeroRuntime } from "@/app/components/aero-runtime";
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
    description: "Run the free Interview Signal Check, inspect a populated demo, and add preparation layers only when the evidence justifies them.",
    images: [
      {
        url: `${siteUrl}/og-v3.png`,
        width: 1731,
        height: 909,
        alt: "InterviewRunway — Turn engineering experience into interview signal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn your experience into interview signal",
    description: "Free signal check, populated product demos, and evidence-led interview preparation for engineers in India.",
    images: [`${siteUrl}/og-v3.png`],
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
      <body><AeroRuntime />{children}</body>
    </html>
  );
}
