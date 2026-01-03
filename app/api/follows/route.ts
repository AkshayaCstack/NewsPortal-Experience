import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_type, target_entry_id } = await req.json();

    if (!target_type || !target_entry_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', target_type)
      .eq('target_entry_id', target_entry_id)
      .single();

    if (existing) {
      return NextResponse.json({ followed: true, message: 'Already following' });
    }

    const { error } = await supabase.from('follows').insert({
      user_id: user.id, // Use authenticated user's ID
      target_type,
      target_entry_id
    });

    if (error) {
      console.error('Error following:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ followed: true });
  } catch (err) {
    console.error('Error in POST /api/follows:', err);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const target_type = searchParams.get('target_type');
    const target_entry_id = searchParams.get('target_entry_id');

    if (!target_type || !target_entry_id) {
      return NextResponse.json({ count: 0, following: false });
    }

    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', target_type)
      .eq('target_entry_id', target_entry_id);

    // Check if current user is following
    let following = false;
    if (user) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', target_type)
        .eq('target_entry_id', target_entry_id)
        .single();
      following = !!data;
    }

    return NextResponse.json({ count: count || 0, following });
  } catch (err) {
    console.error('Error in GET /api/follows:', err);
    return NextResponse.json({ count: 0, following: false });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_type, target_entry_id } = await req.json();

    if (!target_type || !target_entry_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', user.id) // Only delete own follows
      .eq('target_type', target_type)
      .eq('target_entry_id', target_entry_id);

    if (error) {
      console.error('Error unfollowing:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ followed: false });
  } catch (err) {
    console.error('Error in DELETE /api/follows:', err);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }
}
