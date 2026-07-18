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
    default: "InterviewRunway — Remote tech interview prep for India",
    template: "%s | InterviewRunway",
  },
  description:
    "Interview prep for engineers in India targeting remote and AI-adjacent US tech roles. Start with the ₹799 Vault.",
  applicationName: "InterviewRunway",
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
    title: "Remote + AI-adjacent tech interview prep, built for India",
    description: "Founder-designed prep. India pricing. Start with the ₹799 Vault.",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1733,
        height: 908,
        alt: "InterviewRunway — Remote and AI-adjacent tech interview prep for engineers in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote + AI-adjacent tech interview prep, built for India",
    description: "Founder-designed prep. India pricing. Start with the ₹799 Vault.",
    images: [`${siteUrl}/og.png`],
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
