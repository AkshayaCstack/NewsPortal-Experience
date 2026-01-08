

interface EditTagEntry {
  uid?: string;
  _content_type_uid?: string;
  locale?: string;
  publish_details?: {
    locale?: string;
  };
  [key: string]: any;
}

/**
 * Generate edit tag data attributes for Contentstack Live Preview
 * 
 * @param entry - The entry object containing uid, _content_type_uid, and locale
 * @param fieldPath - The field path (e.g., 'title', 'body', 'components.0.hero_section.title')
 * @param contentTypeUid - Optional: Override the content type UID if not present in entry
 * @param locale - The requested locale (page locale). Used when entry locale is not available.
 * @returns Object with data attributes for Live Preview edit tags
 * 
 * BEHAVIOR:
 * - If entry.locale exists, use it (the entry's actual locale in CMS)
 * - Otherwise, fall back to the requested page locale
 * - This ensures edit tags always point to the correct localized entry
 * 
 * @example
 * // Simple field
 * <h1 {...getEditTagProps(article, 'headline', 'news_article', 'en-us')}>
 *   {article.headline}
 * </h1>
 * 
 * @example
 * // Nested field in modular block
 * <h2 {...getEditTagProps(page, 'components.0.hero_section.title', 'page', locale)}>
 *   {heroSection.title}
 * </h2>
 */
export function getEditTagProps(
  entry: EditTagEntry | null | undefined,
  fieldPath: string,
  contentTypeUid?: string,
  locale?: string
): Record<string, string> {
  // If Live Preview is not enabled, return empty object
  if (process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE !== 'true') {
    return {};
  }

  // Validate entry
  if (!entry || !entry.uid) {
    return {};
  }

  const ctUid = contentTypeUid || entry._content_type_uid;
  
  const entryLocale = locale || entry.locale || entry.publish_details?.locale || 'en-us';
  
  if (!ctUid) {
    console.warn('[EditTags] Content type UID not found for entry:', entry.uid);
    return {};
  }

  // Return data attributes for Contentstack Live Preview SDK
  // Format: content_type_uid.entry_uid.locale.field_path
  return {
    'data-cslp': `${ctUid}.${entry.uid}.${entryLocale}.${fieldPath}`,
  };
}

/**
 * Generate edit tag for an image field
 * 
 * @param entry - The entry object
 * @param fieldPath - Path to the image field
 * @param contentTypeUid - Content type UID
 * @param locale - Locale code (e.g., 'en-us')
 * @returns Object with data attributes for Live Preview edit tags
 */
export function getImageEditTagProps(
  entry: EditTagEntry | null | undefined,
  fieldPath: string,
  contentTypeUid?: string,
  locale?: string
): Record<string, string> {
  return getEditTagProps(entry, fieldPath, contentTypeUid, locale);
}

/**
 * Generate edit tag for a reference field
 * 
 * @param entry - The entry object
 * @param fieldPath - Path to the reference field
 * @param contentTypeUid - Content type UID
 * @param locale - Locale code (e.g., 'en-us')
 * @returns Object with data attributes for Live Preview edit tags
 */
export function getReferenceEditTagProps(
  entry: EditTagEntry | null | undefined,
  fieldPath: string,
  contentTypeUid?: string,
  locale?: string
): Record<string, string> {
  return getEditTagProps(entry, fieldPath, contentTypeUid, locale);
}

/**
 * Generate edit tag for a modular block item
 * 
 * @param entry - The entry object
 * @param blockIndex - Index of the modular block
 * @param blockType - Type of the block (e.g., 'hero_section')
 * @param fieldPath - Optional: specific field within the block
 * @param contentTypeUid - Content type UID
 * @param locale - Locale code (e.g., 'en-us')
 * @returns Object with data attributes for Live Preview edit tags
 */
export function getModularBlockEditTagProps(
  entry: EditTagEntry | null | undefined,
  blockIndex: number,
  blockType: string,
  fieldPath?: string,
  contentTypeUid?: string,
  locale?: string
): Record<string, string> {
  const fullPath = fieldPath 
    ? `components.${blockIndex}.${blockType}.${fieldPath}`
    : `components.${blockIndex}.${blockType}`;
  
  return getEditTagProps(entry, fullPath, contentTypeUid, locale);
}

/**
 * Check if Live Preview edit tags are enabled
 * 
 * @returns Boolean indicating if edit tags should be rendered
 */
export function isEditTagsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE === 'true';
}
