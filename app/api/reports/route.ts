import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const { error } = await supabase.from('reports').insert({
      user_id: user.id, // Use authenticated user's ID
      content_type_uid,
      entry_uid,
      reason
    });

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reported: true });
  } catch (err) {
    console.error('Error in POST /api/reports:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
