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
  // — Venda —
  clientes:         <Icon d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18H6z" d2="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" d3="M10 7h4M10 11h4M10 15h4" />,
  produtos:         <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" circle={{ cx: 7, cy: 7, r: 1 }} />,
  pedidos_venda:    <Icon d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" d2="M3 6h18" d3="M16 10a4 4 0 0 1-8 0" />,
  nf_saida:         <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6" d3="M9 16l2-3 2 3M11 13v5" />,
  // — Compras —
  fornecedores:     <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" d2="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />,
  pedidos_compra:   (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  nf_entrada:       <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6" d3="M9 13l2 3 2-3M11 11v5" />,
  // — Operação —
  cooperados:       <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" circle={{ cx: 9, cy: 7, r: 4 }} />,
  tecnicos:         <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" d2="M16 11l2 2 4-4" circle={{ cx: 12, cy: 7, r: 4 }} />,
  disponibilidades: <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  despesas:         <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" d2="M9 12h6M9 16h4" />,
  cpr:              <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6" d3="M8 14h3M8 17h1l4-4" />,
  barter:           <Icon d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l-4-4M17 20l4-4" />,
  fates:            <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  // — Financeiro —
  contas_receber:   <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" d2="M7 10l5 5 5-5" d3="M12 15V3" />,
  contas_pagar:     <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" d2="M17 8l-5-5-5 5" d3="M12 3v12" />,
  conta_corrente:   (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  ),
  // — Legal —
  contratos:        <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  consentimentos:   <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" d2="M9 12l2 2 4-4" />,
  // — CAF (técnico) —
  caf:              <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" d2="M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" d3="M9 12h6M9 16h4" />,
  // — BIA —
  bia:              <Icon d="M12 8V4H8M12 8c-3.87 0-6 2-6 4v4h12v-4c0-2-2.13-4-6-4zM2 14h3M19 14h3M6 18v2M18 18v2" d2="M9 14h.01M15 14h.01" />,
  // — Admin —
  usuarios:         <Icon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" circle={{ cx: 9, cy: 7, r: 4 }} />,
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

const GESTORA:      Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais']
const COM_OPERADOR: Perfil[] = ['admin_saacs', 'gestora_coaf', 'coordenador_cooperamais', 'operador_emissao_caf']
const TECNICO:      Perfil[] = ['tecnico_campo', 'agente_campo']

const NAV_SECTIONS: NavSection[] = [
  // ── COOPERATIVA ──────────────────────────────────────────────────────
  {
    id: 'venda',
    label: 'VENDA',
    items: [
      { href: '/dashboard/clientes',      label: 'Clientes',         iconKey: 'clientes',      perfis: GESTORA },
      { href: '/dashboard/produtos',      label: 'Produtos',         iconKey: 'produtos',      perfis: GESTORA },
      { href: '/dashboard/pedidos-venda', label: 'Pedidos de Venda', iconKey: 'pedidos_venda', perfis: GESTORA },
      { href: '/dashboard/nf-saida',      label: 'NF de Saída',      iconKey: 'nf_saida',      perfis: GESTORA },
    ],
  },
  {
    id: 'compras',
    label: 'COMPRAS',
    items: [
      { href: '/dashboard/fornecedores',   label: 'Fornecedores',     iconKey: 'fornecedores',   perfis: GESTORA },
      { href: '/dashboard/pedidos-compra', label: 'Pedidos de Compra', iconKey: 'pedidos_compra', perfis: GESTORA },
      { href: '/dashboard/nf-entrada',     label: 'NF de Entrada',    iconKey: 'nf_entrada',     perfis: GESTORA },
    ],
  },
  {
    id: 'operacao',
    label: 'OPERAÇÃO',
    items: [
      { href: '/dashboard/cooperados',       label: 'Cooperados',       iconKey: 'cooperados',       perfis: COM_OPERADOR },
      { href: '/dashboard/tecnicos',         label: 'Técnicos',         iconKey: 'tecnicos',         perfis: GESTORA },
      { href: '/dashboard/disponibilidades', label: 'Disponibilidades', iconKey: 'disponibilidades', perfis: GESTORA },
      { href: '/dashboard/despesas',         label: 'Custos/Despesas',  iconKey: 'despesas',         perfis: GESTORA },
      { href: '/dashboard/cpr',              label: 'CPR',              iconKey: 'cpr',              perfis: GESTORA },
      { href: '/dashboard/barter',           label: 'Barter',           iconKey: 'barter',           perfis: GESTORA },
      { href: '/dashboard/fates',            label: 'FATES',            iconKey: 'fates',            perfis: GESTORA },
    ],
  },
  {
    id: 'financeiro',
    label: 'FINANCEIRO',
    items: [
      { href: '/dashboard/contas-receber', label: 'Contas a Receber', iconKey: 'contas_receber', perfis: GESTORA },
      { href: '/dashboard/contas-pagar',   label: 'Contas a Pagar',   iconKey: 'contas_pagar',   perfis: GESTORA },
      { href: '/dashboard/financeiro',     label: 'Conta Corrente',   iconKey: 'conta_corrente', perfis: GESTORA },
    ],
  },
  {
    id: 'legal',
    label: 'LEGAL',
    items: [
      { href: '/dashboard/contratos',      label: 'Contratos PNAE', iconKey: 'contratos',    perfis: COM_OPERADOR },
      { href: '/dashboard/consentimentos', label: 'Consentimentos', iconKey: 'consentimentos', perfis: COM_OPERADOR },
    ],
  },
  // ── AGRICULTOR (técnico operando como AF) ────────────────────────────
  {
    id: 'af-venda',
    label: 'VENDA',
    items: [
      { href: '/dashboard/af/clientes',      label: 'Clientes',         iconKey: 'clientes',      perfis: TECNICO },
      { href: '/dashboard/af/produtos',      label: 'Produtos',         iconKey: 'produtos',      perfis: TECNICO },
      { href: '/dashboard/af/pedidos-venda', label: 'Pedidos de Venda', iconKey: 'pedidos_venda', perfis: TECNICO },
      { href: '/dashboard/af/nf-saida',      label: 'NF de Saída',      iconKey: 'nf_saida',      perfis: TECNICO },
    ],
  },
  {
    id: 'af-compras',
    label: 'COMPRAS',
    items: [
      { href: '/dashboard/af/fornecedores', label: 'Fornecedores', iconKey: 'fornecedores', perfis: TECNICO },
    ],
  },
  {
    id: 'af-operacao',
    label: 'OPERAÇÃO',
    items: [
      { href: '/dashboard/af/disponibilidades', label: 'Disponibilidades', iconKey: 'disponibilidades', perfis: TECNICO },
      { href: '/dashboard/af/despesas',         label: 'Custos/Despesas',  iconKey: 'despesas',         perfis: TECNICO },
      { href: '/dashboard/af/caf',              label: 'CAF',              iconKey: 'caf',              perfis: TECNICO },
    ],
  },
  {
    id: 'af-financeiro',
    label: 'FINANCEIRO',
    items: [
      { href: '/dashboard/af/contas-receber', label: 'Contas a Receber', iconKey: 'contas_receber', perfis: TECNICO },
      { href: '/dashboard/af/contas-pagar',   label: 'Contas a Pagar',   iconKey: 'contas_pagar',   perfis: TECNICO },
      { href: '/dashboard/af/conta-corrente', label: 'Conta Corrente',   iconKey: 'conta_corrente', perfis: TECNICO },
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
