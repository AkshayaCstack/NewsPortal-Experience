// Internationalization configuration
export const i18nConfig = {
  defaultLocale: 'en-us',
  locales: ['en-us', 'ta-in'],
  localeNames: {
    'en-us': 'English',
    'ta-in': 'தமிழ்' // Tamil
  },
  // Contentstack locale codes match our route locales
  contentstackLocales: {
    'en-us': 'en-us',
    'ta-in': 'ta-in'
  }
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

// Helper to check if a locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return i18nConfig.locales.includes(locale as Locale);
}

// Get locale display name
export function getLocaleName(locale: Locale): string {
  return i18nConfig.localeNames[locale] || locale;
}

