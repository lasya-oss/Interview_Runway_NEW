"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { hasAnalyticsConsent } from "@/app/lib/analytics";

const META_PIXEL_ID = "2049815335681613";

const CONSENT_CHANGED_EVENT = "interviewrunway:analytics-consent-changed";

// Exact Meta Pixel base code, loaded only after the visitor allows analytics
// (see AnalyticsConsent). Before consent, nothing is sent to Meta.
const META_PIXEL_CODE = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;

export function MetaPixel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => setEnabled(hasAnalyticsConsent());
    update();
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, update);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {META_PIXEL_CODE}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
