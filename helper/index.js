import Stack from "@/contentstack-sdk";

/* -------------------------
   PAGE (HOME)
-------------------------- */
export async function getPageByURL(url) {
  const Query = Stack.ContentType("page")
    .Query()
    .where("url", url)
    .includeReference([
      "components.category_section.category.reference",
      "components.authors_section.author.reference", 
      "components.breaking_news.group.referenced_article",
      "components.breaking_news.group.referenced_article.author",
      "components.breaking_news.group.referenced_article.category",
      "components.articles.article_card.referenced_article",
      "components.articles.article_card.referenced_article.author",
      "components.articles.article_card.referenced_article.category"
    ])
    .toJSON();

  const result = await Query.find();
  return result[0]?.[0];
}

/* -------------------------
   HEADER
-------------------------- */
export async function getHeader() {
  const Query = Stack.ContentType("header")
    .Query()
    .includeReference(["navigation_menu.reference"])
    .toJSON();
    
  const [res] = await Query.find();
  return res?.[0];
}

/* -------------------------
   FOOTER
-------------------------- */
export async function getFooter() {
  const Query = Stack.ContentType("footer")
    .Query()
    .toJSON();
    
  const [res] = await Query.find();
  return res?.[0];
}

/* -------------------------
   ARTICLE DETAIL (by UID)
-------------------------- */
export async function getArticleBySlug(slug) {
  // slug is actually the uid when no url field exists
  const result = await Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category", "related_articles"])
    .toJSON()
    .find();
  
  // Find the article by uid

  
  return result[0]?.find(article => article.uid === slug);
}

/* -------------------------
   ALL ARTICLE SLUGS/UIDs (for static generation)
-------------------------- */
export async function getAllArticleSlugs() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .only(["uid"])
    .toJSON();

  const result = await Query.find();
  // Return UIDs as slugs since we're using uid-based routing
  return result[0]?.map(a => a.uid) || [];
}

/* -------------------------
   ALL ARTICLES
-------------------------- */
export async function getAllArticles() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   BREAKING NEWS ARTICLES
-------------------------- */
export async function getBreakingNews() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .where("is_breaking", true)
    .includeReference(["author", "category"])
    .descending("published_date")
    .limit(5)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   FEATURED ARTICLES
-------------------------- */
export async function getFeaturedArticles() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .where("is_featured", true)
    .includeReference(["author", "category"])
    .descending("published_date")
    .limit(6)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   ALL CATEGORIES
-------------------------- */
export async function getAllCategories() {
  const Query = Stack.ContentType("category")
    .Query()
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   FEATURED AUTHORS
-------------------------- */
export async function getFeaturedAuthors() {
  const Query = Stack.ContentType("author")
    .Query()
    .where("is_featured", true)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   GET AUTHOR BY UID
-------------------------- */
export async function getAuthorByUid(uid) {
  // Fetch all authors and find by UID (Contentstack UID is a system field)
  const Query = Stack.ContentType("author")
    .Query()
    .toJSON();

  const result = await Query.find();
  const authors = result[0] || [];
  return authors.find(author => author.uid === uid);
}

/* -------------------------
   GET ALL AUTHORS
-------------------------- */
export async function getAllAuthors() {
  const Query = Stack.ContentType("author")
    .Query()
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   GET ARTICLES BY AUTHOR
-------------------------- */
export async function getArticlesByAuthor(authorUid) {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  // Filter articles where author uid matches
  const articles = result[0] || [];
  return articles.filter(article => {
    const authors = article.author || [];
    return authors.some(a => a.uid === authorUid);
  });
}

/* -------------------------
   GET CATEGORY BY UID
-------------------------- */
export async function getCategoryByUid(uid) {
  // Fetch all categories and find by UID (Contentstack UID is a system field)
  const Query = Stack.ContentType("category")
    .Query()
    .toJSON();

  const result = await Query.find();
  const categories = result[0] || [];
  return categories.find(category => category.uid === uid);
}

/* -------------------------
   GET ARTICLES BY CATEGORY
-------------------------- */
export async function getArticlesByCategory(categoryUid) {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  // Filter articles where category uid matches
  const articles = result[0] || [];
  return articles.filter(article => {
    const categories = article.category || [];
    return categories.some(c => c.uid === categoryUid);
  });
}

/* -------------------------
   HELPER: Format date
-------------------------- */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/* -------------------------
   HELPER: Time ago
-------------------------- */
export function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/* -------------------------
   HELPER: Convert JSON RTE to HTML
   Contentstack Rich Text Editor returns JSON, we need to convert it
-------------------------- */
export function jsonRteToHtml(node) {
  if (!node) return '';
  
  // If it's already a string, return it
  if (typeof node === 'string') return node;
  
  // If it's an array, process each item
  if (Array.isArray(node)) {
    return node.map(jsonRteToHtml).join('');
  }
  
  // If it's not an object, return empty
  if (typeof node !== 'object') return '';
  
  // Process children first
  const children = node.children ? jsonRteToHtml(node.children) : '';
  
  // Handle different node types
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
      // For text nodes or unknown types
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

import Stack from "@/contentstack-sdk";

/* -------------------------
   PAGE (HOME)
-------------------------- */
export async function getPageByURL(url) {
  const Query = Stack.ContentType("page")
    .Query()
    .where("url", url)
    .includeReference([
      "components.category_section.category.reference",
      "components.authors_section.author.reference", 
      "components.breaking_news.group.referenced_article",
      "components.breaking_news.group.referenced_article.author",
      "components.breaking_news.group.referenced_article.category",
      "components.articles.article_card.referenced_article",
      "components.articles.article_card.referenced_article.author",
      "components.articles.article_card.referenced_article.category"
    ])
    .toJSON();

  const result = await Query.find();
  return result[0]?.[0];
}

/* -------------------------
   HEADER
-------------------------- */
export async function getHeader() {
  const Query = Stack.ContentType("header")
    .Query()
    .includeReference(["navigation_menu.reference"])
    .toJSON();
    
  const [res] = await Query.find();
  return res?.[0];
}

/* -------------------------
   FOOTER
-------------------------- */
export async function getFooter() {
  const Query = Stack.ContentType("footer")
    .Query()
    .toJSON();
    
  const [res] = await Query.find();
  return res?.[0];
}

/* -------------------------
   ARTICLE DETAIL (by UID)
-------------------------- */
export async function getArticleBySlug(slug) {
  // slug is actually the uid when no url field exists
  const result = await Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category", "related_articles"])
    .toJSON()
    .find();
  
  // Find the article by uid

  
  return result[0]?.find(article => article.uid === slug);
}

/* -------------------------
   ALL ARTICLE SLUGS/UIDs (for static generation)
-------------------------- */
export async function getAllArticleSlugs() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .only(["uid"])
    .toJSON();

  const result = await Query.find();
  // Return UIDs as slugs since we're using uid-based routing
  return result[0]?.map(a => a.uid) || [];
}

/* -------------------------
   ALL ARTICLES
-------------------------- */
export async function getAllArticles() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   BREAKING NEWS ARTICLES
-------------------------- */
export async function getBreakingNews() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .where("is_breaking", true)
    .includeReference(["author", "category"])
    .descending("published_date")
    .limit(5)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   FEATURED ARTICLES
-------------------------- */
export async function getFeaturedArticles() {
  const Query = Stack.ContentType("news_article")
    .Query()
    .where("is_featured", true)
    .includeReference(["author", "category"])
    .descending("published_date")
    .limit(6)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   ALL CATEGORIES
-------------------------- */
export async function getAllCategories() {
  const Query = Stack.ContentType("category")
    .Query()
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   FEATURED AUTHORS
-------------------------- */
export async function getFeaturedAuthors() {
  const Query = Stack.ContentType("author")
    .Query()
    .where("is_featured", true)
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   GET AUTHOR BY UID
-------------------------- */
export async function getAuthorByUid(uid) {
  // Fetch all authors and find by UID (Contentstack UID is a system field)
  const Query = Stack.ContentType("author")
    .Query()
    .toJSON();

  const result = await Query.find();
  const authors = result[0] || [];
  return authors.find(author => author.uid === uid);
}

/* -------------------------
   GET ALL AUTHORS
-------------------------- */
export async function getAllAuthors() {
  const Query = Stack.ContentType("author")
    .Query()
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   GET ARTICLES BY AUTHOR
-------------------------- */
export async function getArticlesByAuthor(authorUid) {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  // Filter articles where author uid matches
  const articles = result[0] || [];
  return articles.filter(article => {
    const authors = article.author || [];
    return authors.some(a => a.uid === authorUid);
  });
}

/* -------------------------
   GET CATEGORY BY UID
-------------------------- */
export async function getCategoryByUid(uid) {
  // Fetch all categories and find by UID (Contentstack UID is a system field)
  const Query = Stack.ContentType("category")
    .Query()
    .toJSON();

  const result = await Query.find();
  const categories = result[0] || [];
  return categories.find(category => category.uid === uid);
}

/* -------------------------
   GET ARTICLES BY CATEGORY
-------------------------- */
export async function getArticlesByCategory(categoryUid) {
  const Query = Stack.ContentType("news_article")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  // Filter articles where category uid matches
  const articles = result[0] || [];
  return articles.filter(article => {
    const categories = article.category || [];
    return categories.some(c => c.uid === categoryUid);
  });
}

/* -------------------------
   HELPER: Format date
-------------------------- */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/* -------------------------
   HELPER: Time ago
-------------------------- */
export function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/* -------------------------
   HELPER: Convert JSON RTE to HTML
   Contentstack Rich Text Editor returns JSON, we need to convert it
-------------------------- */
export function jsonRteToHtml(node) {
  if (!node) return '';
  
  // If it's already a string, return it
  if (typeof node === 'string') return node;
  
  // If it's an array, process each item
  if (Array.isArray(node)) {
    return node.map(jsonRteToHtml).join('');
  }
  
  // If it's not an object, return empty
  if (typeof node !== 'object') return '';
  
  // Process children first
  const children = node.children ? jsonRteToHtml(node.children) : '';
  
  // Handle different node types
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
      // For text nodes or unknown types
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
export async function getAllLiveBlogs() {
  const Query = Stack.ContentType("live_blog")
    .Query()
    .includeReference(["author", "category"])
    .descending("published_date")
    .toJSON();

  const result = await Query.find();
  return result[0] || [];
}

/* -------------------------
   LIVE BLOG: Get Live Blog by URL/Slug
-------------------------- */
export async function getLiveBlogBySlug(slug) {
  const result = await Stack.ContentType("live_blog")
    .Query()
    .includeReference(["author", "category"])
    .toJSON()
    .find();
  
  // Find by uid or url
  return result[0]?.find(blog => blog.uid === slug || blog.url === slug);
}

/* -------------------------
   LIVE BLOG: Get All Live Blog Slugs (for static generation)
-------------------------- */
export async function getAllLiveBlogSlugs() {
  const Query = Stack.ContentType("live_blog")
    .Query()
    .only(["uid", "url"])
    .toJSON();

  const result = await Query.find();
  return result[0]?.map(b => b.uid) || [];
}

/* -------------------------
   LIVE BLOG: Get Active Live Blogs (status = live)
-------------------------- */
export async function getActiveLiveBlogs() {
  const Query = Stack.ContentType("live_blog")
    .Query()
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
export function formatLiveTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/* -------------------------
   HELPER: Format date and time
-------------------------- */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

