import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/Providers";
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
        {/* Lytics Analytics Script */}
        {lyticsAccountId && (
          <Script
            id="lytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(){
                  var t=window.lytics=window.lytics||[];
                  t.methods=["track","identify","page","ready"];
                  t.factory=function(n){
                    return function(){
                      var e=Array.prototype.slice.call(arguments);
                      e.unshift(n);
                      t.push(e);
                      return t;
                    }
                  };
                  for(var n=0;n<t.methods.length;n++){
                    var e=t.methods[n];
                    t[e]=t.factory(e);
                  }
                  t.load=function(){
                    var n=document.createElement("script");
                    n.type="text/javascript";
                    n.async=true;
                    n.src="https://c.lytics.io/api/tag/${lyticsAccountId}/latest.min.js";
                    var e=document.getElementsByTagName("script")[0];
                    e.parentNode.insertBefore(n,e);
                  };
                  t.load();
                }();
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
        </Providers>
      </body>
    </html>
  );
}

