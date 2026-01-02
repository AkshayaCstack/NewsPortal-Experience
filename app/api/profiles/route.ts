import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { id, name, avatar_url } = await req.json()

  await supabase.from('profiles').upsert({
    id,
    name,
    avatar_url
  })

  return NextResponse.json({ saved: true })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id!)
    .single()

  return NextResponse.json(data)
}
