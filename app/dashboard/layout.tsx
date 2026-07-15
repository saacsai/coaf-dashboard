'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Drawer from '@/components/Drawer'
import type { Perfil } from '@/lib/supabase'

const SIDEBAR_W = '224px'
const PRIMARY   = '#073763'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading,      setLoading]     = useState(true)
  const [nome,         setNome]        = useState('')
  const [email,        setEmail]       = useState('')
  const [perfil,       setPerfil]      = useState<Perfil>('operador')
  const [drawerPerfil, setDrawerPerfil] = useState(false)
  const [menuMobile,   setMenuMobile]  = useState(false)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      setEmail(session.user.email || '')

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome, perfil')
        .eq('id', session.user.id)
        .single()

      if (!usuario) {
        await supabase.auth.signOut()
        window.location.href = '/login?erro=sem-acesso'
        return
      }

      setNome(usuario.nome)
      setPerfil(usuario.perfil as Perfil)
      setLoading(false)
    })
  }, [])

  function abrirDrawerPerfil() {
    setDrawerPerfil(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#EEF2F8' }}>
      <p className="text-sm text-gray-400">Carregando…</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#EEF2F8' }}>
      {/* Header mobile */}
      <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center px-4 gap-3"
        style={{ background: PRIMARY }}>
        <button
          onClick={() => setMenuMobile(true)}
          className="flex flex-col gap-1.5 p-1"
          aria-label="Abrir menu"
        >
          <span className="block w-5 h-0.5 bg-white/80 rounded" />
          <span className="block w-5 h-0.5 bg-white/80 rounded" />
          <span className="block w-5 h-0.5 bg-white/80 rounded" />
        </button>
        <span className="text-white font-bold text-sm tracking-wide">COAF 4.0</span>
      </div>

      <div className="print:hidden">
        <Sidebar
          nome={nome}
          email={email}
          perfil={perfil}
          onEditarPerfil={abrirDrawerPerfil}
          mobileAberto={menuMobile}
          onMobileFechar={() => setMenuMobile(false)}
        />
      </div>
      <main className="p-4 lg:p-8 pt-[72px] lg:pt-0 ml-0 lg:ml-[224px] print:ml-0 print:p-4" style={{ minHeight: '100vh' }}>
        {children}
      </main>

      <div className="print:hidden">
      <Drawer open={drawerPerfil} onClose={() => setDrawerPerfil(false)} title="Perfil">
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-medium">{nome}</p>
          <p className="text-xs text-gray-400">{email}</p>
          <p className="text-xs text-gray-400">Perfil: {perfil}</p>
          <div className="border-t border-gray-100 pt-3">
            <a href="/reset-password" onClick={() => setDrawerPerfil(false)}
              className="text-xs hover:underline" style={{ color: PRIMARY }}>
              Alterar senha →
            </a>
          </div>
        </div>
      </Drawer>
      </div>
    </div>
  )
}
