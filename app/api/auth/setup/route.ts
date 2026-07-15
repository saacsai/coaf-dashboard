import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/auth/setup
// Cria o primeiro usuário admin_saacs do sistema
// Protegido por SETUP_SECRET (env var)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret')
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email, senha, nome } = await req.json()
  if (!email || !senha || !nome) {
    return NextResponse.json({ error: 'email, senha e nome são obrigatórios' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Cria o usuário no auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // Insere na tabela usuarios
  const { error: dbError } = await supabase
    .from('usuarios')
    .insert({ id: userId, nome, email, perfil: 'admin_saacs' })

  if (dbError) {
    // Reverte o usuário criado no auth
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: userId, email, perfil: 'admin_saacs' })
}
