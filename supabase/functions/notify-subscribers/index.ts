// Supabase Edge Function: notify-subscribers
// Receives Contentstack webhook when new article is published
// and notifies users who follow the author or categories

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Contentstack configuration
const CS_API_KEY = Deno.env.get('CONTENTSTACK_API_KEY') || 'bltfc6e7c82d527e9ba'
const CS_DELIVERY_TOKEN = Deno.env.get('CONTENTSTACK_DELIVERY_TOKEN') || ''
const CS_ENVIRONMENT = Deno.env.get('CONTENTSTACK_ENVIRONMENT') || 'development'

// Fetch full entry from Contentstack API
async function fetchFullEntry(entryUid: string, contentTypeUid: string, locale: string) {
  const url = `https://cdn.contentstack.io/v3/content_types/${contentTypeUid}/entries/${entryUid}?locale=${locale}&include[]=author&include[]=category`
  
  console.log('🔄 Fetching full entry from Contentstack:', url)
  
  const response = await fetch(url, {
    headers: {
      'api_key': CS_API_KEY,
      'access_token': CS_DELIVERY_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    console.error('❌ Contentstack API error:', response.status, await response.text())
    return null
  }
  
  const data = await response.json()
  return data.entry
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the Webhook data from Contentstack
    const body = await req.json()
    console.log('📥 Received webhook payload:', JSON.stringify(body, null, 2))
    
    // Contentstack webhook payload structure
    const webhookEntry = body.data?.entry
    const contentType = body.data?.content_type?.uid || 'news_article'
    const locale = body.data?.locale || 'en-us'
    
    if (!webhookEntry || !webhookEntry.uid) {
      console.log('❌ No valid entry found in payload')
      return new Response(
        JSON.stringify({ error: 'No entry data in webhook payload' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📄 Webhook entry UID:', webhookEntry.uid, '| Content Type:', contentType)

    // 2. Fetch full entry with references from Contentstack API
    const fullEntry = await fetchFullEntry(webhookEntry.uid, contentType, locale)
    
    if (!fullEntry) {
      console.log('⚠️ Could not fetch full entry, using webhook data')
    }
    
    const entry = fullEntry || webhookEntry
    console.log('📄 Full entry data:', JSON.stringify(entry, null, 2))

    // Extract UIDs from the entry (Author and all Categories)
    const authorUid = entry.author?.[0]?.uid || null
    const categoryUids: string[] = entry.category?.map((c: { uid: string }) => c.uid).filter(Boolean) || []
    
    console.log('👤 Author UID:', authorUid)
    console.log('📁 Category UIDs:', categoryUids)
    
    // Get entry details for notification
    const entryTitle = entry.title || entry.headline || 'New article'
    const entryUrl = entry.url || entry.uid
    
    console.log('📰 Entry title:', entryTitle, '| URL:', entryUrl)

    // Initialize Supabase Admin with Service Role (Bypasses RLS for automation)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Query 'follows' table for matching users
    // Build OR conditions for the query
    const orConditions: string[] = []
    
    if (authorUid) {
      orConditions.push(`and(target_type.eq.author,target_entry_id.eq.${authorUid})`)
    }
    
    if (categoryUids.length > 0) {
      // For multiple categories, we need to query each
      categoryUids.forEach(catUid => {
        orConditions.push(`and(target_type.eq.category,target_entry_id.eq.${catUid})`)
      })
    }

    if (orConditions.length === 0) {
      console.log('⚠️ No author or categories found in entry')
      return new Response(
        JSON.stringify({ success: true, message: 'No author or categories to notify' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Query conditions:', orConditions.join(','))

    const { data: followers, error: followError } = await supabase
      .from('follows')
      .select('user_id')
      .or(orConditions.join(','))

    console.log('👥 Followers found:', followers?.length || 0, followers)

    if (followError) {
      console.error('❌ Error querying follows:', followError)
      return new Response(
        JSON.stringify({ error: followError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (followers && followers.length > 0) {
      // Deduplicate: Don't notify the same user twice if they follow both author and category
      const uniqueUserIds = [...new Set(followers.map((f: { user_id: string }) => f.user_id))]

      // 3. Insert into notifications table (with locale for filtering)
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        message: `New article: "${entryTitle}" was just published!`,
        link: `/news/${entryUrl}`,
        is_read: false,
        locale: locale // Store the locale of the published content
      }))

      const { error: insertError } = await supabase.from('notifications').insert(notifications)
      
      if (insertError) {
        console.error('Error inserting notifications:', insertError)
        return new Response(
          JSON.stringify({ error: insertError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          notified: uniqueUserIds.length,
          message: `Notified ${uniqueUserIds.length} user(s)` 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, notified: 0, message: 'No followers to notify' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

