"use client";

import { usePathname, useRouter } from "next/navigation";
import { i18nConfig, getLocaleName, type Locale } from "@/i18n.config";

interface LanguageSwitcherProps {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Set cookie to remember preference
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="language-switcher">
      {i18nConfig.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`lang-btn ${currentLocale === locale ? 'active' : ''}`}
          title={getLocaleName(locale)}
        >
          {locale === 'en-us' ? 'EN' : 'த'}
        </button>
      ))}
    </div>
  );
}

