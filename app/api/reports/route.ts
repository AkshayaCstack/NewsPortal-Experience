import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Contentstack Automation Webhook URL for email notifications
const CONTENTSTACK_AUTOMATION_WEBHOOK = 'https://app.contentstack.com/automations-api/run/886b850dca5f4ce590b4d13be5cc745a';

// Map simplified content types to Contentstack content type UIDs
const CONTENT_TYPE_MAP: Record<string, string> = {
  'article': 'news_article',
  'podcast': 'podcast',
  'video': 'video',
  'magazine': 'magazine',
  'live_blog': 'live_blog',
  'podcast_episode': 'podcast_episode',
  // Also support direct Contentstack UIDs
  'news_article': 'news_article',
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_type_uid, entry_uid, reason } = await req.json();

    if (!entry_uid || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Map to Contentstack content type UID
    const contentstackContentType = CONTENT_TYPE_MAP[content_type_uid] || content_type_uid || 'unknown';

    // Store report in Supabase
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      content_type_uid: contentstackContentType,
      entry_uid,
      reason
    });

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger Contentstack Automation webhook for email notification
    try {
      const webhookPayload = {
        user_id: user.id,
        user_email: user.email,
        entity_id: entry_uid,
        content_type_uid: contentstackContentType,
        issue: reason,
        reported_at: new Date().toISOString()
      };

      const webhookResponse = await fetch(CONTENTSTACK_AUTOMATION_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        console.warn('Contentstack Automation webhook failed:', await webhookResponse.text());
        // Don't fail the request if webhook fails - report is already saved
      } else {
        console.log('Contentstack Automation webhook triggered successfully');
      }
    } catch (webhookError) {
      console.error('Error triggering Contentstack Automation webhook:', webhookError);
      // Don't fail the request if webhook fails - report is already saved
    }

    return NextResponse.json({ reported: true });
  } catch (err) {
    console.error('Error in POST /api/reports:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
