import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { user_id, content_type_uid, entry_uid, body } = await req.json()

    const { data, error } = await supabase.from('comments').insert({
      user_id,
      content_type_uid,
      entry_uid,
      body
    }).select()

    if (error) {
      console.error('Error inserting comment:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Error in POST /api/comments:', err)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const entry_uid = searchParams.get('entry_uid')
    
    if (!entry_uid) {
      return NextResponse.json([])
    }
  
    // First try with profiles join
    const { data, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('entry_uid', entry_uid)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json([])
    }

    // Fetch profile data separately for each comment
    const commentsWithProfiles = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', comment.user_id)
          .single()
        
        return {
          ...comment,
          profiles: profile || { name: 'Anonymous', avatar_url: null }
        }
      })
    )
  
    return NextResponse.json(commentsWithProfiles)
  } catch (err) {
    console.error('Error in GET /api/comments:', err)
    return NextResponse.json([])
  }
}
  