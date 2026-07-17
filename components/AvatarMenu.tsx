'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Perfil } from '@/lib/supabase'

interface Props {
  nomeExibido:      string
  email:            string
  initials:         string
  perfil:           Perfil
  onEditarPerfil:   () => void
  onGerenciarPlano: () => void
  onUsoCredits:     () => void
  onSair:           () => void
  dark?:            boolean
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconChevron({ up }: { up: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  )
}

const GESTORA_ROLES: Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais']
// agente_campo e tecnico_campo não aparecem na seção SISTEMA do AvatarMenu

export default function AvatarMenu({ nomeExibido, email, initials, perfil, onEditarPerfil, onGerenciarPlano, onUsoCredits, onSair, dark = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const router          = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isGestora  = GESTORA_ROLES.includes(perfil)
  const isAdmin    = perfil === 'admin_saacs'

  function navTo(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          {/* Identidade */}
          <div className="px-3 py-2.5">
            <div className="text-sm font-semibold text-gray-900 truncate">{nomeExibido}</div>
            <div className="text-xs text-gray-500 truncate">{email}</div>
          </div>

          <div className="border-t border-gray-100 my-1" />

          {/* Perfil */}
          <button
            onClick={() => { setOpen(false); onEditarPerfil() }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
          >
            <span className="text-gray-400"><IconEdit /></span>
            Editar perfil
          </button>

          {/* Configurações — visíveis para gestora e admin */}
          {(isGestora || isAdmin) && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-widest text-gray-400">SISTEMA</p>
              {isGestora && (
                <button
                  onClick={() => navTo('/dashboard/parametros')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                >
                  <span className="text-gray-400"><IconSettings /></span>
                  Configurações
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => navTo('/dashboard/admin/usuarios')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                >
                  <span className="text-gray-400"><IconUsers /></span>
                  Usuários
                </button>
              )}
            </>
          )}

          <div className="border-t border-gray-100 my-1" />

          {/* Sair */}
          <button
            onClick={() => { setOpen(false); onSair() }}
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5"
          >
            <span className="text-red-400"><IconLogout /></span>
            Sair
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left"
        style={{ background: open ? (dark ? 'rgba(255,255,255,0.12)' : '#f9fafb') : 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.12)' : '#f9fafb')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? (dark ? 'rgba(255,255,255,0.12)' : '#f9fafb') : 'transparent')}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
          style={{ background: dark ? '#D4A0A0' : 'linear-gradient(135deg,#a855f7,#2dd4bf)', color: dark ? '#5C0F0F' : 'white' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: dark ? 'white' : '#1f2937' }}>{nomeExibido}</div>
          <div className="text-xs truncate" style={{ color: dark ? 'rgba(212,160,160,0.8)' : '#9ca3af' }}>{email}</div>
        </div>
        <span style={{ color: dark ? 'rgba(212,160,160,0.7)' : '#9ca3af' }}><IconChevron up={open} /></span>
      </button>
    </div>
  )
}
