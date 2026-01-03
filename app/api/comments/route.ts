import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_type_uid, entry_uid, body } = await req.json();

    if (!entry_uid || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('comments').insert({
      user_id: user.id, // Use authenticated user's ID
      content_type_uid,
      entry_uid,
      body
    }).select();

    if (error) {
      console.error('Error inserting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error in POST /api/comments:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const entry_uid = searchParams.get('entry_uid');
    
    if (!entry_uid) {
      return NextResponse.json([]);
    }
  
    // Fetch comments
    const { data, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('entry_uid', entry_uid)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json([]);
    }

    // Fetch profile data separately for each comment
    const commentsWithProfiles = await Promise.all(
      (data || []).map(async (comment: { id: string; body: string; created_at: string; user_id: string }) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', comment.user_id)
          .single();
        
        return {
          ...comment,
          profiles: profile || { name: 'Anonymous', avatar_url: null }
        };
      })
    );
  
    return NextResponse.json(commentsWithProfiles);
  } catch (err) {
    console.error('Error in GET /api/comments:', err);
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const comment_id = searchParams.get('id');

    if (!comment_id) {
      return NextResponse.json({ error: 'Missing comment id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment_id)
      .eq('user_id', user.id); // Only delete own comments

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/comments:', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
