'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import Drawer from '@/components/Drawer'
import type { Perfil } from '@/lib/supabase'

const PRIMARY = '#073763'

const PERFIS: Perfil[] = [
  'admin_saacs',
  'gestora_coaf',
  'tecnico_campo',
  'coordenador_cooperamais',
  'operador_emissao_caf',
]

const BADGE: Record<Perfil, string> = {
  admin_saacs:              'bg-blue-100 text-blue-800',
  gestora_coaf:             'bg-green-100 text-green-800',
  tecnico_campo:            'bg-orange-100 text-orange-800',
  coordenador_cooperamais:  'bg-purple-100 text-purple-800',
  operador_emissao_caf:     'bg-gray-100 text-gray-700',
  agricultor_familiar:      'bg-yellow-100 text-yellow-800',
}

const PERFIL_LABEL: Record<Perfil, string> = {
  admin_saacs:              'Admin SAACS',
  gestora_coaf:             'Gestora COAF',
  tecnico_campo:            'Técnico de Campo',
  coordenador_cooperamais:  'Coordenador CooperaMais',
  operador_emissao_caf:     'Operador Emissão CAF',
  agricultor_familiar:      'Agricultor Familiar',
}

interface UsuarioRow {
  id: string
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  created_at: string
}

interface FormState {
  nome: string
  email: string
  perfil: Perfil
}

const FORM_VAZIO: FormState = { nome: '', email: '', perfil: 'gestora_coaf' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios]   = useState<UsuarioRow[]>([])
  const [loading,  setLoading]    = useState(true)
  const [drawer,   setDrawer]     = useState(false)
  const [editId,   setEditId]     = useState<string | null>(null)
  const [salvando, setSalvando]   = useState(false)
  const [erro,     setErro]       = useState('')
  const [form,     setForm]       = useState<FormState>(FORM_VAZIO)
  const [busca,    setBusca]      = useState('')
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    if (!busca.trim()) return usuarios
    const q = busca.toLowerCase()
    return usuarios.filter(u =>
      u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [usuarios, busca])

  async function carregar() {
    const { data } = await getSupabase()
      .from('usuarios')
      .select('id, nome, email, perfil, ativo, created_at')
      .order('nome')
    setUsuarios((data || []) as UsuarioRow[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirCriar() {
    setEditId(null)
    setForm(FORM_VAZIO)
    setErro('')
    setDrawer(true)
  }

  function abrirEditar(u: UsuarioRow) {
    setEditId(u.id)
    setForm({ nome: u.nome, email: u.email, perfil: u.perfil })
    setErro('')
    setDrawer(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    if (!editId) {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ nome: form.nome, email: form.email, perfil: form.perfil }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error || 'Erro ao criar'); setSalvando(false); return }
    } else {
      const res = await fetch(`/api/admin/usuarios/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome, perfil: form.perfil }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error || 'Erro ao atualizar'); setSalvando(false); return }
    }

    setDrawer(false)
    setSalvando(false)
    carregar()
  }

  async function toggleAtivo(u: UsuarioRow) {
    await getSupabase().from('usuarios').update({ ativo: !u.ativo }).eq('id', u.id)
    carregar()
  }

  async function handleExcluir(u: UsuarioRow) {
    const { data: { session } } = await getSupabase().auth.getSession()
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'DELETE',
      headers: { ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }) },
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error || 'Erro ao excluir'); return }
    setExcluindoId(null)
    carregar()
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie o acesso ao sistema</p>
        </div>
        <button
          onClick={abrirCriar}
          className="text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          style={{ background: PRIMARY }}
        >
          + Novo usuário
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email…"
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-[#073763]"
          />
        </div>
        {busca && <button onClick={() => setBusca('')} className="text-xs text-gray-400 hover:text-gray-700">Limpar</button>}
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">
            {busca ? `${filtrados.length} de ${usuarios.length}` : `${usuarios.length} usuários`}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE[u.perfil] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PERFIL_LABEL[u.perfil] ?? u.perfil}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {excluindoId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500">Confirmar exclusão?</span>
                        <button onClick={() => handleExcluir(u)} className="text-xs font-semibold text-red-600 hover:text-red-800">Excluir</button>
                        <button onClick={() => setExcluindoId(null)} className="text-xs text-gray-400 hover:text-gray-700">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => abrirEditar(u)} className="text-xs font-medium hover:opacity-80" style={{ color: PRIMARY }}>Editar</button>
                        <button onClick={() => toggleAtivo(u)} className="text-xs text-gray-400 hover:text-gray-700">
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => setExcluindoId(u.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    {busca ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editId ? 'Editar usuário' : 'Novo usuário'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
            <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            {!editId ? (
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            ) : (
              <input type="email" value={form.email} disabled
                className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Perfil</label>
            <select value={form.perfil} onChange={e => setForm(p => ({ ...p, perfil: e.target.value as Perfil }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
              {PERFIS.map(p => (
                <option key={p} value={p}>{PERFIL_LABEL[p]}</option>
              ))}
            </select>
          </div>

          {!editId && (
            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              O usuário receberá um email para definir a própria senha.
            </p>
          )}

          {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setDrawer(false)}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: PRIMARY }}>
              {salvando ? 'Salvando…' : editId ? 'Salvar' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
