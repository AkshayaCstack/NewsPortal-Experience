// Type declarations for helper functions

export function getPageByURL(
  url: string, 
  locale?: string, 
  variantParam?: string | null
): Promise<any>;

export function getSimpleText(title: string, locale?: string): Promise<string>;
export function getAllSimpleTexts(locale?: string): Promise<Record<string, string>>;
export function getHeader(locale?: string): Promise<any>;
export function getFooter(locale?: string): Promise<any>;
export function getArticleBySlug(slug: string, locale?: string): Promise<any>;
export function getAllArticleSlugs(locale?: string): Promise<string[]>;
export function getAllArticles(locale?: string): Promise<any[]>;
export function getBreakingNews(locale?: string): Promise<any[]>;
export function getFeaturedArticles(locale?: string): Promise<any[]>;
export function getAllCategories(locale?: string): Promise<any[]>;
export function getFeaturedAuthors(locale?: string): Promise<any[]>;
export function getAuthorByUid(uid: string, locale?: string): Promise<any>;
export function getAllAuthors(locale?: string): Promise<any[]>;
export function getArticlesByAuthor(authorUid: string, locale?: string): Promise<any[]>;
export function getCategoryByUid(uid: string, locale?: string): Promise<any>;
export function getArticlesByCategory(categoryUid: string, locale?: string): Promise<any[]>;
export function formatDate(dateString: string, locale?: string): string;
export function timeAgo(dateString: string, locale?: string): string;
export function jsonRteToHtml(node: any): string;
export function jsonRteToText(node: any): string;
export function getAllLiveBlogs(locale?: string): Promise<any[]>;
export function getLiveBlogBySlug(slug: string, locale?: string): Promise<any>;
export function getAllLiveBlogSlugs(locale?: string): Promise<string[]>;
export function getActiveLiveBlogs(locale?: string): Promise<any[]>;
export function formatLiveTime(dateString: string, locale?: string): string;
export function formatDateTime(dateString: string, locale?: string): string;
export function getAllPodcasts(locale?: string): Promise<any[]>;
export function getFeaturedPodcasts(locale?: string): Promise<any[]>;
export function getPodcastByUid(uid: string, locale?: string): Promise<any>;
export function getAllPodcastUids(locale?: string): Promise<string[]>;
export function getAllPodcastEpisodes(locale?: string): Promise<any[]>;
export function getEpisodesByPodcast(podcastUid: string, locale?: string): Promise<any[]>;
export function getEpisodeByUid(uid: string, locale?: string): Promise<any>;
export function getAllEpisodeUids(locale?: string): Promise<string[]>;
export function getFreeEpisodes(locale?: string): Promise<any[]>;
export function getAllVideos(locale?: string): Promise<any[]>;
export function getFeaturedVideos(locale?: string): Promise<any[]>;
export function getVideoByUid(uid: string, locale?: string): Promise<any>;
export function getYouTubeId(url: string): string | null;
export function getAllMagazines(locale?: string): Promise<any[]>;
export function getFreeMagazines(locale?: string): Promise<any[]>;
export function getPremiumMagazines(locale?: string): Promise<any[]>;
export function getMagazineByUid(uid: string, locale?: string): Promise<any>;
export function getAllMagazineUids(locale?: string): Promise<string[]>;
export function formatDuration(seconds: number): string;

// Editorial Quotes
export function getEditorialQuotes(locale?: string): Promise<any[]>;
export function getRandomEditorialQuote(locale?: string): Promise<any | null>;
export function getFeaturedEditorialQuote(locale?: string): Promise<any | null>;
