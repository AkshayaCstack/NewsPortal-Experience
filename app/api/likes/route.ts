import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_type_uid, entry_uid } = await req.json();

    if (!entry_uid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type_uid', content_type_uid)
      .eq('entry_uid', entry_uid)
      .single();

    if (existing) {
      const { error } = await supabase.from('likes').delete().eq('id', existing.id);
      if (error) {
        console.error('Error unliking:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ liked: false });
    }

    const { error } = await supabase.from('likes').insert({
      user_id: user.id, // Use authenticated user's ID
      content_type_uid,
      entry_uid
    });

    if (error) {
      console.error('Error liking:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error('Error in POST /api/likes:', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const entry_uid = searchParams.get('entry_uid');
  
    if (!entry_uid) {
      return NextResponse.json({ count: 0, liked: false });
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_uid', entry_uid);

    // Check if current user has liked
    let liked = false;
    if (user) {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_uid', entry_uid)
        .single();
      liked = !!data;
    }
  
    return NextResponse.json({ count: count || 0, liked });
  } catch (err) {
    console.error('Error in GET /api/likes:', err);
    return NextResponse.json({ count: 0, liked: false });
  }
}
