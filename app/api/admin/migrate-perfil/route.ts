import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/admin/migrate-perfil
// One-time migration: drops old CooperLiga perfil CHECK constraint and adds COAF 4.0 profiles
// Protected by SETUP_SECRET
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret')
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const steps: string[] = []

  // 1. Drop old constraint
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check;',
  })
  if (e1) {
    // Try direct approach via raw query
    const r1 = await supabase.from('usuarios').select('id').limit(1)
    steps.push(`drop constraint attempt: ${JSON.stringify(e1)}`)
  } else {
    steps.push('dropped old constraint')
  }

  // 2. Add new constraint with COAF 4.0 profiles
  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE usuarios ADD CONSTRAINT usuarios_perfil_check CHECK (perfil IN ('admin_saacs','gestora_coaf','tecnico_campo','agricultor_familiar','coordenador_cooperamais','operador_emissao_caf','admin','gestor','analista','operador','financeiro'));`,
  })
  steps.push(e2 ? `add constraint error: ${JSON.stringify(e2)}` : 'added new constraint')

  // 3. Insert or upsert the user row
  const { error: e3 } = await supabase
    .from('usuarios')
    .upsert({
      id: '37e0ebfb-50d0-4dfc-93ba-00767d7a70eb',
      nome: 'Luciano Maeda',
      email: 'luciano.maeda@saacs.com.br',
      perfil: 'admin_saacs',
      ativo: true,
    }, { onConflict: 'id' })
  steps.push(e3 ? `upsert error: ${JSON.stringify(e3)}` : 'user row inserted')

  return NextResponse.json({ steps })
}
