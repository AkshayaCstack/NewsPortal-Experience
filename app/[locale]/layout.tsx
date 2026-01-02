import type { Metadata } from "next";
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

  return (
    <html lang={locale}>
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

