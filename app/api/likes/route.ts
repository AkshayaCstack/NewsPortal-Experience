import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_id, content_type_uid, entry_uid } = await req.json()

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user_id)
    .eq('content_type_uid', content_type_uid)
    .eq('entry_uid', entry_uid)
    .single()

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id)
    return NextResponse.json({ liked: false })
  }

  await supabase.from('likes').insert({
    user_id,
    content_type_uid,
    entry_uid
  })

  return NextResponse.json({ liked: true })
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const entry_uid = searchParams.get('entry_uid')
  
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_uid', entry_uid!)
  
    return NextResponse.json({ count })
  }
  
