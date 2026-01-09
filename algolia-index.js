const contentstack = require('contentstack');
const {algoliasearch} = require('algoliasearch');

// 1. CONFIGURATION
const STACK_CONFIG = {
  api_key: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
  delivery_token: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT
};

const ALGOLIA_CONFIG = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,    
  apiKey: process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_KEY, // Must be Admin Key to write
  indexName: 'news-portal'
};

const locales = ['en-us', 'ta-in'];
const contentTypes = ['news_article', 'podcast', 'live_blog', 'videos', 'magazine'];

// Initialize Clients
const Stack = contentstack.Stack(STACK_CONFIG);
const client = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.apiKey);

async function indexToAlgolia() {
  for (const locale of locales) {
    console.log(`--- Processing Locale: ${locale} ---`);
    
    for (const contentType of contentTypes) {
      try {
        // Fetch entries from Contentstack
        const entries = await Stack.ContentType(contentType).Query()
          .language(locale)
          .includeReference(['category']) // Matches your mapping
          .toJSON()
          .find();

        const formattedEntries = entries[0].map(entry => {
          // 2. MAPPING (Matches your provided screenshot image_0195f9.png)
          return {
            objectID: `${entry.uid}-${contentType}-${locale}`, // Unique ID
            title: entry.title,
            category_uid: entry.category?.[0]?.uid || null,
            is_featured: entry.is_featured || false,
            locale: entry.publish_details?.locale || locale,
            entry_uid: entry.uid,
            content_type: contentType,
            "published date": entry.publish_details?.time || new Date().toISOString()
          };
        });

        if (formattedEntries.length > 0) {
            // v5 SYNTAX: Pass indexName as the first argument
            await client.saveObjects({ 
              indexName: ALGOLIA_CONFIG.indexName, 
              objects: formattedEntries 
            });
            console.log(`✅ Indexed ${formattedEntries.length} entries from ${contentType} (${locale})`);
          }
      } catch (error) {
        console.error(`Error processing ${contentType} in ${locale}:`, error);
      }
    }
  }
}

indexToAlgolia();