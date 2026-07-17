'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import Drawer from '@/components/Drawer'
import type { Perfil } from '@/lib/supabase'

const PRIMARY = '#073763'

const NIVEL_LABEL: Record<string, string> = {
  tecnico_campo: 'Técnico de Campo',
  agente_campo:  'Agente de Campo',
}

const NIVEL_BADGE: Record<string, string> = {
  tecnico_campo: 'bg-orange-100 text-orange-800',
  agente_campo:  'bg-amber-100 text-amber-800',
}

interface TecnicoRow {
  id: string
  nome: string
  email: string
  perfil: 'tecnico_campo' | 'agente_campo'
  whatsapp: string | null
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  municipio: string | null
  cargo: string | null
  ativo: boolean
  created_at: string
}

interface FormState {
  perfil: 'tecnico_campo' | 'agente_campo'
  nome: string
  email: string
  whatsapp: string
  cpf: string
  rg: string
  data_nascimento: string
  municipio: string
  cargo: string
}

const FORM_VAZIO: FormState = {
  perfil: 'tecnico_campo',
  nome: '',
  email: '',
  whatsapp: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  municipio: '',
  cargo: '',
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export default function TecnicosPage() {
  const [tecnicos, setTecnicos]       = useState<TecnicoRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [drawer, setDrawer]           = useState(false)
  const [editId, setEditId]           = useState<string | null>(null)
  const [salvando, setSalvando]       = useState(false)
  const [erro, setErro]               = useState('')
  const [form, setForm]               = useState<FormState>(FORM_VAZIO)
  const [busca, setBusca]             = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<'todos' | 'tecnico_campo' | 'agente_campo'>('todos')
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    let lista = tecnicos
    if (filtroPerfil !== 'todos') lista = lista.filter(t => t.perfil === filtroPerfil)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter(t =>
        t.nome.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.cpf || '').includes(q) ||
        (t.municipio || '').toLowerCase().includes(q)
      )
    }
    return lista
  }, [tecnicos, busca, filtroPerfil])

  async function carregar() {
    const { data } = await getSupabase()
      .from('usuarios')
      .select('id, nome, email, perfil, whatsapp, cpf, rg, data_nascimento, municipio, cargo, ativo, created_at')
      .in('perfil', ['tecnico_campo', 'agente_campo'])
      .order('nome')
    setTecnicos((data || []) as TecnicoRow[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirCriar() {
    setEditId(null)
    setForm(FORM_VAZIO)
    setErro('')
    setDrawer(true)
  }

  function abrirEditar(t: TecnicoRow) {
    setEditId(t.id)
    setForm({
      perfil: t.perfil,
      nome: t.nome,
      email: t.email,
      whatsapp: t.whatsapp || '',
      cpf: t.cpf || '',
      rg: t.rg || '',
      data_nascimento: t.data_nascimento || '',
      municipio: t.municipio || '',
      cargo: t.cargo || '',
    })
    setErro('')
    setDrawer(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Nome e e-mail são obrigatórios.')
      setSalvando(false)
      return
    }

    if (!editId) {
      // Cria auth user + registro em usuarios via API
      const { data: { session } } = await getSupabase().auth.getSession()
      const resCreate = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ nome: form.nome, email: form.email, perfil: form.perfil }),
      })
      const json = await resCreate.json()
      if (!resCreate.ok) { setErro(json.error || 'Erro ao criar técnico'); setSalvando(false); return }

      // Complementa com campos adicionais
      const newId: string = json.id
      const resPatch = await fetch(`/api/admin/usuarios/${newId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          whatsapp: form.whatsapp || null,
          cpf: form.cpf || null,
          rg: form.rg || null,
          data_nascimento: form.data_nascimento || null,
          municipio: form.municipio || null,
          cargo: form.cargo || null,
        }),
      })
      if (!resPatch.ok) {
        const pj = await resPatch.json()
        setErro(pj.error || 'Usuário criado, mas erro ao salvar dados complementares')
      }
    } else {
      const res = await fetch(`/api/admin/usuarios/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          perfil: form.perfil,
          whatsapp: form.whatsapp || null,
          cpf: form.cpf || null,
          rg: form.rg || null,
          data_nascimento: form.data_nascimento || null,
          municipio: form.municipio || null,
          cargo: form.cargo || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error || 'Erro ao atualizar'); setSalvando(false); return }
    }

    setDrawer(false)
    setSalvando(false)
    carregar()
  }

  async function toggleAtivo(t: TecnicoRow) {
    await getSupabase().from('usuarios').update({ ativo: !t.ativo }).eq('id', t.id)
    carregar()
  }

  async function handleExcluir(t: TecnicoRow) {
    const { data: { session } } = await getSupabase().auth.getSession()
    const res = await fetch(`/api/admin/usuarios/${t.id}`, {
      method: 'DELETE',
      headers: { ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }) },
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error || 'Erro ao excluir'); return }
    setExcluindoId(null)
    carregar()
  }

  function f(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = field === 'cpf' ? formatCPF(e.target.value) : e.target.value
      setForm(prev => ({ ...prev, [field]: val }))
    }
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Técnicos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Técnicos de campo e agentes vinculados ao COAF</p>
        </div>
        <button
          onClick={abrirCriar}
          className="text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          style={{ background: PRIMARY }}
        >
          + Novo técnico
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nome, e-mail, CPF ou município…"
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-[#073763]"
          />
        </div>
        <select
          value={filtroPerfil}
          onChange={e => setFiltroPerfil(e.target.value as typeof filtroPerfil)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white"
        >
          <option value="todos">Todos os perfis</option>
          <option value="tecnico_campo">Técnico de Campo</option>
          <option value="agente_campo">Agente de Campo</option>
        </select>
        {(busca || filtroPerfil !== 'todos') && (
          <button
            onClick={() => { setBusca(''); setFiltroPerfil('todos') }}
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Limpar
          </button>
        )}
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">
            {(busca || filtroPerfil !== 'todos') ? `${filtrados.length} de ${tecnicos.length}` : `${tecnicos.length} técnico${tecnicos.length !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">WhatsApp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Município</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cargo/Formação</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    {busca || filtroPerfil !== 'todos' ? 'Nenhum técnico encontrado.' : 'Nenhum técnico cadastrado.'}
                  </td>
                </tr>
              ) : filtrados.map(t => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{t.nome}</div>
                    <div className="text-xs text-gray-400">{t.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NIVEL_BADGE[t.perfil]}`}>
                      {NIVEL_LABEL[t.perfil]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.cpf || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{t.whatsapp || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{t.municipio || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.cargo || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {excluindoId === t.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confirmar exclusão?</span>
                        <button onClick={() => handleExcluir(t)} className="text-xs text-red-600 hover:underline font-medium">Sim</button>
                        <button onClick={() => setExcluindoId(null)} className="text-xs text-gray-400 hover:underline">Não</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => abrirEditar(t)} className="text-xs hover:underline" style={{ color: PRIMARY }}>Editar</button>
                        <button
                          onClick={() => toggleAtivo(t)}
                          className="text-xs hover:underline text-gray-500"
                        >
                          {t.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => setExcluindoId(t.id)} className="text-xs text-red-500 hover:underline">Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title={editId ? 'Editar Técnico' : 'Novo Técnico'}
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          {/* Perfil / nível */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Perfil *</label>
            <select
              value={form.perfil}
              onChange={f('perfil')}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white"
            >
              <option value="tecnico_campo">Técnico de Campo</option>
              <option value="agente_campo">Agente de Campo</option>
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
            <input
              type="text"
              value={form.nome}
              onChange={f('nome')}
              required
              autoFocus
              placeholder="Ex.: João da Silva"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
            />
          </div>

          {/* E-mail (somente na criação, depois é imutável) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              E-mail {!editId && '*'}
              {editId && <span className="text-gray-400 font-normal"> (não editável)</span>}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={f('email')}
              required={!editId}
              disabled={!!editId}
              placeholder="tecnico@exemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] disabled:bg-gray-50 disabled:text-gray-400"
            />
            {!editId && (
              <p className="text-xs text-gray-400 mt-1">O técnico receberá um e-mail para definir sua senha.</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={f('whatsapp')}
              placeholder="(62) 99999-9999"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
            />
          </div>

          {/* CPF + RG */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={f('cpf')}
                inputMode="numeric"
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">RG</label>
              <input
                type="text"
                value={form.rg}
                onChange={f('rg')}
                placeholder="0000000-0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
          </div>

          {/* Data nascimento + Município */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={f('data_nascimento')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Município</label>
              <input
                type="text"
                value={form.municipio}
                onChange={f('municipio')}
                placeholder="Ex.: Goiânia"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
          </div>

          {/* Cargo / Formação */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cargo / Formação</label>
            <input
              type="text"
              value={form.cargo}
              onChange={f('cargo')}
              placeholder="Ex.: Eng. Agrônomo, Técnico Agrícola…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
            />
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ background: PRIMARY }}
            >
              {salvando ? 'Salvando…' : editId ? 'Salvar' : 'Criar técnico'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
