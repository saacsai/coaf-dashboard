'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import AvatarMenu from './AvatarMenu'
import type { Perfil } from '@/lib/supabase'

const PRIMARY   = '#073763'
const ACCENT    = '#a4c2f4'
const SIDEBAR_W = '224px'

function Icon({ d, d2, d3, circle }: {
  d: string
  d2?: string
  d3?: string
  circle?: { cx: number; cy: number; r: number }
}) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {d2 && <path d={d2} />}
      {d3 && <path d={d3} />}
      {circle && <circle cx={circle.cx} cy={circle.cy} r={circle.r} />}
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  // GESTORA — Vendas
  contratos:        <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  clientes:         <Icon d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18H6z" d2="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" d3="M10 7h4M10 11h4M10 15h4" />,
  // GESTORA — Compras
  fornecedores:     <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" d2="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />,
  despesas:         <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" d2="M9 12h6M9 16h4" />,
  // GESTORA — Financeiro
  financeiro:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  fates:            <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  // GESTORA — Legal
  consentimentos:   <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" d2="M9 12l2 2 4-4" />,
  // GESTORA — Cooperados
  cooperados:       <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" circle={{ cx: 9, cy: 7, r: 4 }} />,
  // GESTORA — Parâmetros
  parametros:       <Icon d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  // TÉCNICO — Campo
  campo:            <Icon d="M12 22V12" d2="M12 12C10 8 5 8 5 4a7 7 0 0 1 14 0c0 4-5 4-7 8z" />,
  nf_produtor:      <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M8 13h5M8 17h3" d3="M15 13l2 2-2 2" />,
  // CAF (ambos perfis)
  solicitacoes_caf: <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" d2="M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" d3="M9 12h6M9 16h4" />,
  autodeclaracoes:  <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" d2="M8 11h8M8 15h5" />,
  // ADMIN
  usuarios:         <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" circle={{ cx: 9, cy: 7, r: 4 }} />,
  // BIA
  bia:              <Icon d="M12 8V4H8M12 8c-3.87 0-6 2-6 4v4h12v-4c0-2-2.13-4-6-4zM2 14h3M19 14h3M6 18v2M18 18v2" d2="M9 14h.01M15 14h.01" />,
}

interface NavItem {
  href:    string
  label:   string
  iconKey: string
  perfis:  Perfil[]
}

interface NavSection {
  id:    string
  label: string
  items: NavItem[]
}

const GESTORA:    Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais']
const OPERACIONAL: Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais', 'operador_emissao_caf']
const TECNICO:    Perfil[] = ['tecnico_campo']
const CAF_TODOS:  Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais', 'operador_emissao_caf', 'tecnico_campo']
const ADMIN_ONLY: Perfil[] = ['admin_saacs']

const NAV_SECTIONS: NavSection[] = [
  // ── GESTORA ──────────────────────────────────────────────────────────
  {
    id: 'vendas',
    label: 'VENDAS',
    items: [
      { href: '/dashboard/contratos', label: 'Contratos PNAE', iconKey: 'contratos',  perfis: OPERACIONAL },
      { href: '/dashboard/clientes',  label: 'Clientes',       iconKey: 'clientes',   perfis: GESTORA },
    ],
  },
  {
    id: 'compras',
    label: 'COMPRAS',
    items: [
      { href: '/dashboard/fornecedores', label: 'Fornecedores', iconKey: 'fornecedores', perfis: GESTORA },
      { href: '/dashboard/despesas',     label: 'Despesas',     iconKey: 'despesas',     perfis: GESTORA },
    ],
  },
  {
    id: 'financeiro',
    label: 'FINANCEIRO',
    items: [
      { href: '/dashboard/financeiro', label: 'Conta Corrente', iconKey: 'financeiro', perfis: GESTORA },
      { href: '/dashboard/fates',      label: 'FATES',          iconKey: 'fates',      perfis: GESTORA },
    ],
  },
  {
    id: 'legal',
    label: 'LEGAL',
    items: [
      { href: '/dashboard/consentimentos', label: 'Consentimentos', iconKey: 'consentimentos', perfis: OPERACIONAL },
    ],
  },
  {
    id: 'cooperados-gestora',
    label: 'COOPERADOS',
    items: [
      { href: '/dashboard/cooperados', label: 'Cooperados', iconKey: 'cooperados', perfis: GESTORA },
    ],
  },
  // ── TÉCNICO ──────────────────────────────────────────────────────────
  {
    id: 'campo',
    label: 'CAMPO',
    items: [
      { href: '/dashboard/campo',             label: 'Caderno de Campo', iconKey: 'campo',       perfis: TECNICO },
      { href: '/dashboard/campo/nf-produtor', label: 'NF do Produtor',  iconKey: 'nf_produtor', perfis: TECNICO },
    ],
  },
  {
    id: 'cooperados-tecnico',
    label: 'COOPERADOS',
    items: [
      { href: '/dashboard/cooperados', label: 'Cooperados', iconKey: 'cooperados', perfis: TECNICO },
    ],
  },
  // ── AMBOS ────────────────────────────────────────────────────────────
  {
    id: 'caf',
    label: 'EMISSÃO CAF',
    items: [
      { href: '/dashboard/caf/solicitacoes',    label: 'Solicitações',    iconKey: 'solicitacoes_caf', perfis: CAF_TODOS },
      { href: '/dashboard/caf/autodeclaracoes', label: 'Autodeclarações', iconKey: 'autodeclaracoes', perfis: CAF_TODOS },
    ],
  },
]

interface Props {
  nome:            string
  email:           string
  perfil:          Perfil
  onEditarPerfil:  () => void
  mobileAberto?:   boolean
  onMobileFechar?: () => void
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

export default function Sidebar({ nome, email, perfil, onEditarPerfil, mobileAberto = false, onMobileFechar }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await getSupabase().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Backdrop mobile */}
      {mobileAberto && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onMobileFechar}
        />
      )}

      <aside
        style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W, background: PRIMARY }}
        className={`fixed left-0 top-0 h-screen flex flex-col z-30 transition-transform duration-200 ease-in-out
          ${mobileAberto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div style={{ paddingTop: 28, paddingBottom: 24, paddingLeft: 32, paddingRight: 32 }}>
          <Image src="/logo_coaf.png" alt="COAF 4.0" width={160} height={49} className="object-contain w-full" priority />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

        {/* Nav com seções */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => {
            const itens = section.items.filter(n => n.perfis.includes(perfil))
            if (itens.length === 0) return null
            return (
              <div key={section.id} className={si > 0 ? 'mt-2' : ''}>
                <p className="px-3 mb-0.5 text-[10px] font-semibold tracking-widest" style={{ color: 'rgba(164,194,244,0.5)' }}>
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {itens.map(item => {
                    const ativo = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          background: ativo ? 'rgba(255,255,255,0.15)' : 'transparent',
                          color:      ativo ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                          fontWeight: ativo ? 600 : 400,
                        }}
                      >
                        <span className="flex-shrink-0">{ICONS[item.iconKey]}</span>
                        <span className="text-[13px]">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

        {/* BIA */}
        <div className="px-3 py-1.5">
          <button
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ background: 'rgba(164,194,244,0.15)', color: ACCENT }}
            disabled title="Em breve"
          >
            <span className="flex-shrink-0">{ICONS.bia}</span>
            <span className="flex-1 text-left text-[13px]">BIA</span>
            <span className="text-[10px] rounded px-1.5 py-0.5" style={{ background: 'rgba(164,194,244,0.2)', color: ACCENT }}>
              em breve
            </span>
          </button>
        </div>

        {/* Usuário */}
        <div className="px-2 pb-2">
          <AvatarMenu
            nomeExibido={nome || email}
            email={email}
            initials={iniciais(nome || email)}
            perfil={perfil}
            dark
            onEditarPerfil={onEditarPerfil}
            onGerenciarPlano={() => {}}
            onUsoCredits={() => {}}
            onSair={handleLogout}
          />
        </div>

        <div className="flex justify-center pb-3">
          <Image src="/logo_saacs_sem_slogan.png" alt="SAACS" width={83} height={22} className="object-contain opacity-50" />
        </div>
      </aside>
    </>
  )
}
