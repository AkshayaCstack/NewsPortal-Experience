import Stack from "@/contentstack-sdk";
import Personalize from "@contentstack/personalize-edge-sdk";

// Default locale
const DEFAULT_LOCALE = 'en-us';

/* -------------------------
   HELPER: Convert variant param to aliases
-------------------------- */
function getVariantAliases(variantParam) {
  if (!variantParam) return [];
  // Use the SDK's built-in converter
  return Personalize.variantParamToVariantAliases(variantParam);
}

/* -------------------------
   PAGE (by URL) - Supports Personalization Variants
-------------------------- */
export async function getPageByURL(url, locale = DEFAULT_LOCALE, variantParam = null) {
  try {
    console.log('=== [Helper] PAGE FETCH DEBUG ===');
    console.log('[Helper] URL:', url);
    console.log('[Helper] Locale:', locale);
    console.log('[Helper] Variant param received:', variantParam);
    
    let Query = Stack.ContentType("page")
      .Query()
      .language(locale)
      .where("url", url)
      .includeReference([
        "components.category_section.category.reference",
        "components.authors_section.author.reference"
      ]);

    if (variantParam) {
      // Convert variant param (e.g., "0_1") to variant aliases (e.g., ["cs_personalize_0_1"])
      // The SDK's variantParamToVariantAliases method handles this conversion
      const aliases = Personalize.variantParamToVariantAliases(variantParam);
      
      console.log('[Helper] Converted variant param to aliases:', aliases);
      
      if (aliases && aliases.length > 0) {
        // The SDK .variants() method applies the x-cs-variant-uid header automatically
        Query = Query.variants(aliases); 
        console.log('[Helper] Applied variants to query');
      } else {
        console.log('[Helper] No valid aliases - fetching BASE entry');
      }
    } else {
      console.log('[Helper] No variant param - fetching BASE entry');
    }

    const result = await Query.toJSON().find();
    const page = result[0]?.[0];
    
    console.log('[Helper] Page found:', !!page);
    console.log('[Helper] Page title:', page?.title);
    console.log('[Helper] Components count:', page?.components?.length);
    console.log('[Helper] Component keys:', page?.components?.map(c => Object.keys(c)));
    console.log('=== [Helper] END DEBUG ===');
    
    return page;
  
  } catch (error) {
    console.error('[Helper] Error fetching page:', error);
    return null;
  }
}

/* -------------------------
   SIMPLE TEXT ENTRIES
   For UI text like "See more", "Subscribe", etc.
-------------------------- */
export async function getSimpleText(title, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("labels")
      .Query()
      .language(locale)
      .where("title", title)
      .toJSON();

    const result = await Query.find();
    return result[0]?.[0]?.title || title;
  } catch (error) {
    console.error('Error fetching simple text:', error);
    return title;
  }
}

/* -------------------------
   GET ALL SIMPLE TEXTS
-------------------------- */
export async function getAllSimpleTexts(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("labels")
      .Query()
      .language(locale)
      .toJSON();

    const result = await Query.find();
    const texts = result[0] || [];
    // Return as key-value object for easy access
    const textMap = {};
    texts.forEach(t => {
      textMap[t.title] = t.title;
    });
    return textMap;
  } catch (error) {
    console.error('Error fetching simple texts:', error);
    return {};
  }
}

/* -------------------------
   HEADER
-------------------------- */
export async function getHeader(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("header")
      .Query()
      .language(locale)
      .includeReference(["navigation_menu.reference"])
      .toJSON();
      
    const [res] = await Query.find();
    return res?.[0];
  } catch (error) {
    console.error('Error fetching header:', error);
    return null;
  }
}

/* -------------------------
   FOOTER
-------------------------- */
export async function getFooter(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("footer")
      .Query()
      .language(locale)
      .toJSON();
      
    const [res] = await Query.find();
    return res?.[0];
  } catch (error) {
    console.error('Error fetching footer:', error);
    return null;
  }
}

/* -------------------------
   ARTICLE DETAIL (by UID)
-------------------------- */
export async function getArticleBySlug(slug, locale = DEFAULT_LOCALE) {
  try {
    const result = await Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .includeReference(["author", "category", "related_articles"])
      .toJSON()
      .find();
    
    // Find the article by uid
    return result[0]?.find(article => article.uid === slug);
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

/* -------------------------
   ALL ARTICLE SLUGS/UIDs (for static generation)
-------------------------- */
export async function getAllArticleSlugs(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .only(["uid"])
      .toJSON();

    const result = await Query.find();
    return result[0]?.map(a => a.uid) || [];
  } catch (error) {
    console.error('Error fetching article slugs:', error);
    return [];
  }
}

/* -------------------------
   ALL ARTICLES
-------------------------- */
export async function getAllArticles(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .descending("published_date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

/* -------------------------
   BREAKING NEWS ARTICLES
-------------------------- */
export async function getBreakingNews(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .where("is_breaking", true)
      .includeReference(["author", "category"])
      .descending("published_date")
      .limit(5)
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    return [];
  }
}

/* -------------------------
   FEATURED ARTICLES
-------------------------- */
export async function getFeaturedArticles(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .where("is_featured", true)
      .includeReference(["author", "category"])
      .descending("published_date")
      .limit(6)
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }
}

/* -------------------------
   ALL CATEGORIES
-------------------------- */
export async function getAllCategories(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("category")
      .Query()
      .language(locale)
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/* -------------------------
   FEATURED AUTHORS
-------------------------- */
export async function getFeaturedAuthors(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("author")
      .Query()
      .language(locale)
      .where("is_featured", true)
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching featured authors:', error);
    return [];
  }
}

/* -------------------------
   GET AUTHOR BY UID
-------------------------- */
export async function getAuthorByUid(uid, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("author")
      .Query()
      .language(locale)
      .toJSON();

    const result = await Query.find();
    const authors = result[0] || [];
    return authors.find(author => author.uid === uid);
  } catch (error) {
    console.error('Error fetching author:', error);
    return null;
  }
}

/* -------------------------
   GET ALL AUTHORS
-------------------------- */
export async function getAllAuthors(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("author")
      .Query()
      .language(locale)
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

/* -------------------------
   GET ARTICLES BY AUTHOR
-------------------------- */
export async function getArticlesByAuthor(authorUid, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .descending("published_date")
      .toJSON();

    const result = await Query.find();
    const articles = result[0] || [];
    return articles.filter(article => {
      const authors = article.author || [];
      return authors.some(a => a.uid === authorUid);
    });
  } catch (error) {
    console.error('Error fetching articles by author:', error);
    return [];
  }
}

/* -------------------------
   GET CATEGORY BY UID
-------------------------- */
export async function getCategoryByUid(uid, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("category")
      .Query()
      .language(locale)
      .toJSON();

    const result = await Query.find();
    const categories = result[0] || [];
    return categories.find(category => category.uid === uid);
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

/* -------------------------
   GET ARTICLES BY CATEGORY
-------------------------- */
export async function getArticlesByCategory(categoryUid, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("news_article")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .descending("published_date")
      .toJSON();

    const result = await Query.find();
    const articles = result[0] || [];
    return articles.filter(article => {
      const categories = article.category || [];
      return categories.some(c => c.uid === categoryUid);
    });
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }
}

/* -------------------------
   HELPER: Format date
-------------------------- */
export function formatDate(dateString, locale = 'en-US') {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Map our locale codes to browser locale codes
  const browserLocale = locale === 'ta-in' ? 'ta-IN' : 'en-US';
  return date.toLocaleDateString(browserLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/* -------------------------
   HELPER: Time ago
-------------------------- */
export function timeAgo(dateString, locale = 'en-us') {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Tamil translations for time ago
  if (locale === 'ta-in') {
    if (diffMins < 60) return `${diffMins} நிமிடங்கள் முன்பு`;
    if (diffHours < 24) return `${diffHours} மணி நேரம் முன்பு`;
    if (diffDays < 7) return `${diffDays} நாட்கள் முன்பு`;
    return formatDate(dateString, locale);
  }
  
  // English (default)
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString, locale);
}

/* -------------------------
   HELPER: Convert JSON RTE to HTML
-------------------------- */
export function jsonRteToHtml(node) {
  if (!node) return '';
  
  if (typeof node === 'string') return node;
  
  if (Array.isArray(node)) {
    return node.map(jsonRteToHtml).join('');
  }
  
  if (typeof node !== 'object') return '';
  
  const children = node.children ? jsonRteToHtml(node.children) : '';
  
  switch (node.type) {
    case 'doc':
      return children;
    case 'p':
      return `<p>${children}</p>`;
    case 'h1':
      return `<h1>${children}</h1>`;
    case 'h2':
      return `<h2>${children}</h2>`;
    case 'h3':
      return `<h3>${children}</h3>`;
    case 'h4':
      return `<h4>${children}</h4>`;
    case 'h5':
      return `<h5>${children}</h5>`;
    case 'h6':
      return `<h6>${children}</h6>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'ul':
      return `<ul>${children}</ul>`;
    case 'ol':
      return `<ol>${children}</ol>`;
    case 'li':
      return `<li>${children}</li>`;
    case 'a':
    case 'link':
      const href = node.attrs?.url || node.attrs?.href || '#';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${children}</a>`;
    case 'img':
    case 'image':
      const src = node.attrs?.src || node.attrs?.url || '';
      const alt = node.attrs?.alt || '';
      return `<img src="${src}" alt="${alt}" />`;
    case 'hr':
      return '<hr />';
    case 'br':
      return '<br />';
    case 'code':
      return `<code>${children}</code>`;
    case 'pre':
      return `<pre>${children}</pre>`;
    case 'strong':
    case 'bold':
      return `<strong>${children}</strong>`;
    case 'em':
    case 'italic':
      return `<em>${children}</em>`;
    case 'u':
    case 'underline':
      return `<u>${children}</u>`;
    case 'strike':
    case 'strikethrough':
      return `<s>${children}</s>`;
    case 'span':
      return `<span>${children}</span>`;
    case 'div':
      return `<div>${children}</div>`;
    default:
      if (node.text) {
        let text = node.text;
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        if (node.underline) text = `<u>${text}</u>`;
        if (node.strikethrough) text = `<s>${text}</s>`;
        if (node.code) text = `<code>${text}</code>`;
        return text;
      }
      return children;
  }
}

/* -------------------------
   HELPER: Extract plain text from JSON RTE
-------------------------- */
export function jsonRteToText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(jsonRteToText).join('');
  if (typeof node !== 'object') return '';
  
  if (node.text) return node.text;
  if (node.children) return jsonRteToText(node.children);
  return '';
}

/* -------------------------
   LIVE BLOG: Get All Live Blogs
-------------------------- */
export async function getAllLiveBlogs(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("live_blog")
    .Query()
    .language(locale)
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   LIVE BLOG: Get Live Blog by URL/Slug
-------------------------- */
export async function getLiveBlogBySlug(slug, locale = DEFAULT_LOCALE) {
  const result = await Stack.ContentType("live_blog")
    .Query()
    .language(locale)
    .includeReference(["author", "category"])
    .toJSON()
    .find();
  
  return result[0]?.find(blog => blog.uid === slug || blog.url === slug);
}

/* -------------------------
   LIVE BLOG: Get All Live Blog Slugs
-------------------------- */
export async function getAllLiveBlogSlugs(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("live_blog")
    .Query()
    .language(locale)
    .only(["uid", "url"])
    .toJSON();

  const result = await Query.find();
  return result[0]?.map(b => b.uid) || [];
}

/* -------------------------
   LIVE BLOG: Get Active Live Blogs
-------------------------- */
export async function getActiveLiveBlogs(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("live_blog")
    .Query()
    .language(locale)
    .where("status", "live")
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   HELPER: Format time for live blog
-------------------------- */
export function formatLiveTime(dateString, locale = 'en-us') {
  if (!dateString) return '';
  const date = new Date(dateString);
  const browserLocale = locale === 'ta-in' ? 'ta-IN' : 'en-US';
  return date.toLocaleTimeString(browserLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/* -------------------------
   HELPER: Format date and time
-------------------------- */
export function formatDateTime(dateString, locale = 'en-us') {
  if (!dateString) return '';
  const date = new Date(dateString);
  const browserLocale = locale === 'ta-in' ? 'ta-IN' : 'en-US';
  return date.toLocaleDateString(browserLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/* -------------------------
   PODCASTS: Get All Podcasts
-------------------------- */
export async function getAllPodcasts(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .descending("publish_date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return [];
  }
}

/* -------------------------
   PODCASTS: Get Featured Podcasts
-------------------------- */
export async function getFeaturedPodcasts(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast")
      .Query()
      .language(locale)
      .where("is_featured", true)
      .includeReference(["author", "category"])
      .descending("publish_date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error("Error fetching featured podcasts:", error);
    return [];
  }
}

/* -------------------------
   PODCASTS: Get Podcast by UID
-------------------------- */
export async function getPodcastByUid(uid, locale = DEFAULT_LOCALE) {
  try {
    const result = await Stack.ContentType("podcast")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .toJSON()
      .find();
    
    return result[0]?.find(podcast => podcast.uid === uid);
  } catch (error) {
    console.error("Error fetching podcast:", uid, error);
    return null;
  }
}

/* -------------------------
   PODCASTS: Get All Podcast UIDs
-------------------------- */
export async function getAllPodcastUids(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast")
      .Query()
      .language(locale)
      .only(["uid"])
      .toJSON();

    const result = await Query.find();
    return result[0]?.map(p => p.uid) || [];
  } catch (error) {
    console.error("Error fetching podcast UIDs:", error);
    return [];
  }
}

/* -------------------------
   PODCAST EPISODES: Get All Episodes
-------------------------- */
export async function getAllPodcastEpisodes(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast_episode")
      .Query()
      .language(locale)
      .includeReference(["author"]) // author references the podcast
      .descending("publish_date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error("Error fetching podcast episodes:", error);
    return [];
  }
}

/* -------------------------
   PODCAST EPISODES: Get Episodes by Podcast UID
-------------------------- */
export async function getEpisodesByPodcast(podcastUid, locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast_episode")
      .Query()
      .language(locale)
      .includeReference(["author"]) // author references the podcast
      .descending("publish_date")
      .toJSON();

    const result = await Query.find();
    const episodes = result[0] || [];
    
    // Filter episodes that belong to the specified podcast
    return episodes.filter(episode => {
      const podcast = episode.author?.[0] || episode.author;
      return podcast?.uid === podcastUid;
    });
  } catch (error) {
    console.error("Error fetching episodes for podcast:", podcastUid, error);
    return [];
  }
}

/* -------------------------
   PODCAST EPISODES: Get Episode by UID
-------------------------- */
export async function getEpisodeByUid(uid, locale = DEFAULT_LOCALE) {
  try {
    const result = await Stack.ContentType("podcast_episode")
      .Query()
      .language(locale)
      .includeReference(["author"])
      .toJSON()
      .find();
    
    return result[0]?.find(episode => episode.uid === uid);
  } catch (error) {
    console.error("Error fetching episode:", uid, error);
    return null;
  }
}

/* -------------------------
   PODCAST EPISODES: Get All Episode UIDs
-------------------------- */
export async function getAllEpisodeUids(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast_episode")
      .Query()
      .language(locale)
      .only(["uid"])
      .toJSON();

    const result = await Query.find();
    return result[0]?.map(e => e.uid) || [];
  } catch (error) {
    console.error("Error fetching episode UIDs:", error);
    return [];
  }
}

/* -------------------------
   PODCAST EPISODES: Get Free Episodes
-------------------------- */
export async function getFreeEpisodes(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("podcast_episode")
      .Query()
      .language(locale)
      .where("isfree", true)
      .includeReference(["author"])
      .descending("publish_date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error("Error fetching free episodes:", error);
    return [];
  }
}

/* -------------------------
   VIDEOS: Get All Videos
-------------------------- */
export async function getAllVideos(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("videos")
    .Query()
    .language(locale)
    .includeReference(["category"])
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   VIDEOS: Get Featured Videos
-------------------------- */
export async function getFeaturedVideos(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("videos")
      .Query()
      .language(locale)
      .where("is_featured", true)
      .includeReference(["category"])
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    return [];
  }
}

/* -------------------------
   VIDEOS: Get Video by UID
-------------------------- */
export async function getVideoByUid(uid, locale = DEFAULT_LOCALE) {
  const result = await Stack.ContentType("videos")
    .Query()
    .language(locale)
    .includeReference(["category"])
    .toJSON()
    .find();
  
  return result[0]?.find(video => video.uid === uid);
}

/* -------------------------
   HELPER: Extract YouTube Video ID
-------------------------- */
export function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/* -------------------------
   MAGAZINE: Get All Magazines
-------------------------- */
export async function getAllMagazines(locale = DEFAULT_LOCALE) {
  try {
    const Query = Stack.ContentType("magazine")
      .Query()
      .language(locale)
      .includeReference(["author", "category"])
      .descending("date")
      .toJSON();

    const result = await Query.find();
    return result[0] || [];
  } catch (error) {
    console.error('Error fetching magazines:', error);
    return [];
  }
}

/* -------------------------
   MAGAZINE: Get Free Magazines
-------------------------- */
export async function getFreeMagazines(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("magazine")
    .Query()
    .language(locale)
    .where("access_level", "free")
    .includeReference(["author", "category"])
    .descending("date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   MAGAZINE: Get Premium Magazines
-------------------------- */
export async function getPremiumMagazines(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("magazine")
    .Query()
    .language(locale)
    .where("access_level", "subscription")
    .includeReference(["author", "category"])
    .descending("date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   MAGAZINE: Get Magazine by UID
-------------------------- */
export async function getMagazineByUid(uid, locale = DEFAULT_LOCALE) {
  const result = await Stack.ContentType("magazine")
    .Query()
    .language(locale)
    .includeReference(["author", "category"])
    .toJSON()
    .find();
  
  return result[0]?.find(mag => mag.uid === uid);
}

/* -------------------------
   MAGAZINE: Get All Magazine UIDs
-------------------------- */
export async function getAllMagazineUids(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType("magazine")
    .Query()
    .language(locale)
    .only(["uid"])
    .toJSON();

  const result = await Query.find();
  return result[0]?.map(m => m.uid) || [];
}

/* -------------------------
   HELPER: Format Duration
-------------------------- */
export function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/* -------------------------
   EDITORIAL QUOTES: Hardcoded Quotes (No CMS content type yet)
-------------------------- */
const EDITORIAL_QUOTES = {
  'en-us': [
    {
      quote_text: "The truth is rarely pure and never simple.",
      author_name: "Oscar Wilde",
      author_role: "Writer & Playwright"
    },
    {
      quote_text: "Journalism is printing what someone else does not want printed. Everything else is public relations.",
      author_name: "George Orwell",
      author_role: "Author & Journalist"
    },
    {
      quote_text: "The duty of a journalist is to tell the truth. Journalism means you go back to the actual facts.",
      author_name: "Pete Hamill",
      author_role: "Journalist & Author"
    },
    {
      quote_text: "In a time of universal deceit, telling the truth is a revolutionary act.",
      author_name: "George Orwell",
      author_role: "Author & Journalist"
    },
    {
      quote_text: "The press is the best instrument for enlightening the mind of man.",
      author_name: "Thomas Jefferson",
      author_role: "Founding Father"
    }
  ],
  'ta-in': [
    {
      quote_text: "உண்மை எப்போதும் தூய்மையானது அல்ல, எளிமையானதும் அல்ல.",
      author_name: "ஆஸ்கர் வைல்ட்",
      author_role: "எழுத்தாளர் & நாடக ஆசிரியர்"
    },
    {
      quote_text: "பத்திரிகை என்பது வேறு யாரோ அச்சிட விரும்பாததை அச்சிடுவது. மற்ற அனைத்தும் மக்கள் தொடர்புகள்.",
      author_name: "ஜார்ஜ் ஆர்வெல்",
      author_role: "ஆசிரியர் & பத்திரிகையாளர்"
    },
    {
      quote_text: "ஒரு பத்திரிகையாளரின் கடமை உண்மையைச் சொல்வது. பத்திரிகை என்றால் உண்மையான உண்மைகளுக்குத் திரும்புவது.",
      author_name: "பீட் ஹாமில்",
      author_role: "பத்திரிகையாளர் & ஆசிரியர்"
    },
    {
      quote_text: "உலகளாவிய வஞ்சகத்தின் காலத்தில், உண்மையைச் சொல்வது ஒரு புரட்சிகர செயல்.",
      author_name: "ஜார்ஜ் ஆர்வெல்",
      author_role: "ஆசிரியர் & பத்திரிகையாளர்"
    },
    {
      quote_text: "மனிதனின் மனதை அறிவூட்டுவதற்கான சிறந்த கருவி பத்திரிகை.",
      author_name: "தாமஸ் ஜெபர்சன்",
      author_role: "நிறுவன தந்தை"
    }
  ]
};

export async function getEditorialQuotes(locale = DEFAULT_LOCALE) {
  return EDITORIAL_QUOTES[locale] || EDITORIAL_QUOTES['en-us'];
}

/* -------------------------
   EDITORIAL QUOTES: Get Random Quote
-------------------------- */
export async function getRandomEditorialQuote(locale = DEFAULT_LOCALE) {
  const quotes = EDITORIAL_QUOTES[locale] || EDITORIAL_QUOTES['en-us'];
  if (quotes.length === 0) return null;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/* -------------------------
   EDITORIAL QUOTES: Get Featured Quote
-------------------------- */
export async function getFeaturedEditorialQuote(locale = DEFAULT_LOCALE) {
  // Return the first quote as the "featured" one
  const quotes = EDITORIAL_QUOTES[locale] || EDITORIAL_QUOTES['en-us'];
  return quotes[0] || null;
}
