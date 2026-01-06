import { NextRequest, NextResponse } from 'next/server';
import Stack from '@/contentstack-sdk';

// Fetch content details by UID and content type
export async function POST(req: NextRequest) {
  try {
    const { items, locale = 'en-us' } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    const results: Record<string, { title: string; image?: string; slug?: string }> = {};

    // Map content types to their actual Contentstack content type UIDs
    const contentTypeMap: Record<string, string> = {
      article: 'news_article',
      news_article: 'news_article',
      video: 'video',
      podcast: 'podcast',
      magazine: 'magazine',
      live_blog: 'live_blog',
      author: 'author',
      category: 'category',
    };

    // Group items by content type for efficient fetching
    const groupedItems: Record<string, string[]> = {};
    for (const item of items) {
      const contentType = contentTypeMap[item.content_type] || item.content_type;
      if (!groupedItems[contentType]) {
        groupedItems[contentType] = [];
      }
      groupedItems[contentType].push(item.entry_uid);
    }

    // Fetch each content type's entries
    for (const [contentType, uids] of Object.entries(groupedItems)) {
      try {
        // Fetch entries matching the UIDs
        const query = Stack.ContentType(contentType)
          .Query()
          .language(locale)
          .containedIn('uid', uids);

        const result = await query.toJSON().find();
        const entries = result[0] || [];

        for (const entry of entries) {
          // Extract title based on content type
          let title = '';
          let image = '';
          let slug = '';

          switch (contentType) {
            case 'news_article':
              title = entry.title || entry.headline || 'Untitled Article';
              image = entry.hero_image?.url || entry.featured_image?.url || '';
              slug = entry.url || entry.uid;
              break;
            case 'video':
              title = entry.title || 'Untitled Video';
              image = entry.thumbnail?.url || '';
              slug = entry.uid;
              break;
            case 'podcast':
              title = entry.title || entry.show_title || 'Untitled Podcast';
              image = entry.cover_image?.url || entry.artwork?.url || '';
              slug = entry.uid;
              break;
            case 'magazine':
              title = entry.title || entry.issue_title || 'Untitled Magazine';
              image = entry.cover_image?.url || '';
              slug = entry.uid;
              break;
            case 'live_blog':
              title = entry.title || entry.event_title || 'Untitled Live Blog';
              image = entry.hero_image?.url || '';
              slug = entry.url || entry.uid;
              break;
            case 'author':
              title = entry.name || entry.full_name || entry.title || 'Unknown Author';
              image = entry.profile_image?.url || entry.avatar?.url || entry.photo?.url || '';
              slug = entry.uid;
              break;
            case 'category':
              title = entry.title || entry.name || 'Unknown Category';
              image = entry.icon?.url || '';
              slug = entry.uid;
              break;
            default:
              title = entry.title || entry.name || 'Untitled';
              image = entry.image?.url || '';
              slug = entry.uid;
          }

          results[entry.uid] = { title, image, slug };
        }
      } catch (err) {
        console.error(`Error fetching ${contentType}:`, err);
      }
    }

    return NextResponse.json({ details: results });
  } catch (error) {
    console.error('Error fetching content details:', error);
    return NextResponse.json({ error: 'Failed to fetch content details' }, { status: 500 });
  }
}

