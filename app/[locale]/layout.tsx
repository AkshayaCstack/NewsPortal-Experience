import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/Providers";
import LivePreviewWrapper from "@/components/live-preview/LivePreviewWrapper";
import { i18nConfig, type Locale } from "@/i18n.config";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: {
    default: "NewzHub - Your Trusted News Source",
    template: "%s | NewzHub",
  },
  description: "Breaking news, in-depth analysis, and comprehensive coverage of the stories that matter most.",
  keywords: ["news", "breaking news", "world news", "politics", "technology", "sports"],
};

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!i18nConfig.locales.includes(locale as Locale)) {
    notFound();
  }

  const lyticsAccountId = process.env.NEXT_PUBLIC_LYTICS_ACCOUNT_ID;

  return (
    <html lang={locale}>
      <head>
        {/* Lytics Analytics Script v3 - Official SDK */}
        {lyticsAccountId && (
          <Script
            id="lytics-jstag"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(){"use strict";var o=window.jstag||(window.jstag={}),r=[];function n(e){o[e]=function(){for(var n=arguments.length,t=new Array(n),i=0;i<n;i++)t[i]=arguments[i];r.push([e,t])}}n("send"),n("mock"),n("identify"),n("pageView"),n("unblock"),n("getid"),n("setid"),n("loadEntity"),n("getEntity"),n("on"),n("once"),n("call"),o.loadScript=function(n,t,i){var e=document.createElement("script");e.async=!0,e.src=n,e.onload=t,e.onerror=i;var o=document.getElementsByTagName("script")[0],r=o&&o.parentNode||document.head||document.body,c=o||r.lastChild;return null!=c?r.insertBefore(e,c):r.appendChild(e),this},o.init=function n(t){return this.config=t,this.loadScript(t.src,function(){if(o.init===n)throw new Error("Load error!");o.init(o.config),function(){for(var n=0;n<r.length;n++){var t=r[n][0],i=r[n][1];o[t].apply(o,i)}r=void 0}()}),this}}();
                jstag.init({
                  src: 'https://c.lytics.io/api/tag/${lyticsAccountId}/latest.min.js'
                });
                jstag.pageView();
              `,
            }}
          />
        )}
      </head>
      <body>
        <Providers>
          <Header locale={locale} />
          {children}
          <Footer locale={locale} />
          {/* Live Preview - Only renders if NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE=true */}
          <LivePreviewWrapper />
        </Providers>
      </body>
    </html>
  );
}

