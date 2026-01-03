import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Toggle save (save/unsave)
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_type_uid, entry_uid } = await req.json();

    if (!content_type_uid || !entry_uid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type_uid', content_type_uid)
      .eq('entry_uid', entry_uid)
      .single();

    if (existing) {
      // Unsave
      const { error } = await supabase.from('saved_items').delete().eq('id', existing.id);
      if (error) {
        console.error('Error unsaving:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ saved: false });
    }

    // Save
    const { error } = await supabase.from('saved_items').insert({
      user_id: user.id, // Use authenticated user's ID
      content_type_uid,
      entry_uid
    });

    if (error) {
      console.error('Error saving:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('Error in POST /api/saves:', err);
    return NextResponse.json({ error: 'Failed to toggle save' }, { status: 500 });
  }
}

// Check if saved (for initial UI state)
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const content_type_uid = searchParams.get('content_type_uid');
    const entry_uid = searchParams.get('entry_uid');

    if (!user || !content_type_uid || !entry_uid) {
      return NextResponse.json({ saved: false });
    }

    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type_uid', content_type_uid)
      .eq('entry_uid', entry_uid)
      .single();

    return NextResponse.json({ saved: !!data });
  } catch (err) {
    console.error('Error in GET /api/saves:', err);
    return NextResponse.json({ saved: false });
  }
}

// Get all saved items for a user (for profile page)
export async function PUT(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('Error in PUT /api/saves:', err);
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 });
  }
}
