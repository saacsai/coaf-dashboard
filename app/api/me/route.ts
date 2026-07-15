import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  // Validate the token by getting the user
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  // Use admin client to bypass RLS
  const { data: usuario } = await getSupabaseAdmin()
    .from('usuarios')
    .select('nome, perfil')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'sem-acesso' }, { status: 403 })
  }

  return NextResponse.json(usuario)
}
