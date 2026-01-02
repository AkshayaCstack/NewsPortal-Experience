import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Toggle save (save/unsave)
export async function POST(req: Request) {
  const { user_id, content_type_uid, entry_uid } = await req.json()

  if (!user_id || !content_type_uid || !entry_uid) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user_id)
    .eq('content_type_uid', content_type_uid)
    .eq('entry_uid', entry_uid)
    .single()

  if (existing) {
    // Unsave
    await supabase.from('saved_items').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  }

  // Save
  await supabase.from('saved_items').insert({
    user_id,
    content_type_uid,
    entry_uid
  })

  return NextResponse.json({ saved: true })
}

// Check if saved (for initial UI state)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const content_type_uid = searchParams.get('content_type_uid')
  const entry_uid = searchParams.get('entry_uid')

  if (!user_id || !content_type_uid || !entry_uid) {
    return NextResponse.json({ saved: false })
  }

  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user_id)
    .eq('content_type_uid', content_type_uid)
    .eq('entry_uid', entry_uid)
    .single()

  return NextResponse.json({ saved: !!data })
}

// Get all saved items for a user (for profile page)
export async function PUT(req: Request) {
  const { user_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data || [] })
}

