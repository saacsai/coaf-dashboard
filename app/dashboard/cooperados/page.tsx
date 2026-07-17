'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import Drawer from '@/components/Drawer'
import ImportarLote from '@/components/ImportarLote'
import type { AgricultorFamiliar } from '@/lib/supabase'

const PRIMARY = '#073763'

const VAZIO = {
  cpf:               '',
  nome:              '',
  data_nascimento:   '',
  sexo:              '' as 'M' | 'F' | '',
  telefone_whatsapp: '',
  email:             '',
  numero_matricula:  '',
  data_admissao:     '',
  data_desligamento: '',
  habilitado_pnae:   false,
}

const COLUNAS_IMPORT = [
  { key: 'cpf',               label: 'CPF' },
  { key: 'nome',              label: 'Nome' },
  { key: 'data_nascimento',   label: 'Data Nascimento' },
  { key: 'sexo',              label: 'Sexo' },
  { key: 'telefone_whatsapp', label: 'WhatsApp' },
  { key: 'email',             label: 'E-mail' },
  { key: 'numero_matricula',  label: 'Nº Matrícula' },
  { key: 'data_admissao',     label: 'Data Admissão' },
]

function formatCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function CooperadosPage() {
  const [cooperados,    setCooperados]    = useState<AgricultorFamiliar[]>([])
  const [loading,       setLoading]       = useState(true)
  const [drawer,        setDrawer]        = useState(false)
  const [editId,        setEditId]        = useState<string | null>(null)
  const [salvando,      setSalvando]      = useState(false)
  const [erro,          setErro]          = useState('')
  const [form,          setForm]          = useState(VAZIO)
  const [busca,         setBusca]         = useState('')
  const [filtroPNAE,    setFiltroPNAE]    = useState('')
  const [coafId,        setCoafId]        = useState<string | null>(null)

  useEffect(() => {
    getSupabase().from('coafs').select('id').limit(1).single().then(({ data }) => {
      if (data) setCoafId(data.id)
    })
  }, [])

  const cooperadosFiltrados = useMemo(() => {
    return cooperados.filter(c => {
      if (filtroPNAE === 'habilitado' && !c.habilitado_pnae) return false
      if (filtroPNAE === 'pendente' && c.habilitado_pnae) return false
      if (!busca.trim()) return true
      const q = busca.toLowerCase()
      return (
        c.nome.toLowerCase().includes(q) ||
        c.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    })
  }, [cooperados, busca, filtroPNAE])

  const set = (f: keyof typeof VAZIO) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }))

  async function carregar() {
    const { data } = await getSupabase()
      .from('agricultores_familiares')
      .select('*')
      .order('nome')
    setCooperados((data || []) as AgricultorFamiliar[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEditId(null); setForm(VAZIO); setErro(''); setDrawer(true)
  }

  function abrirEditar(c: AgricultorFamiliar) {
    setEditId(c.id)
    setForm({
      cpf:               c.cpf                   || '',
      nome:              c.nome,
      data_nascimento:   c.data_nascimento        || '',
      sexo:              (c.sexo                  || '') as 'M' | 'F' | '',
      telefone_whatsapp: c.telefone_whatsapp      || '',
      email:             c.email                  || '',
      numero_matricula:  c.numero_matricula        || '',
      data_admissao:     c.data_admissao           || '',
      data_desligamento: c.data_desligamento       || '',
      habilitado_pnae:   c.habilitado_pnae,
    })
    setErro(''); setDrawer(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!coafId) { setErro('COAF não identificada. Recarregue a página.'); return }
    setSalvando(true); setErro('')

    const payload = {
      coaf_id:           coafId,
      cpf:               form.cpf.replace(/\D/g, ''),
      nome:              form.nome,
      data_nascimento:   form.data_nascimento   || null,
      sexo:              form.sexo              || null,
      telefone_whatsapp: form.telefone_whatsapp || null,
      email:             form.email             || null,
      numero_matricula:  form.numero_matricula  || null,
      data_admissao:     form.data_admissao     || null,
      data_desligamento: form.data_desligamento || null,
      habilitado_pnae:   form.habilitado_pnae,
    }

    const { error } = editId
      ? await getSupabase().from('agricultores_familiares').update(payload).eq('id', editId)
      : await getSupabase().from('agricultores_familiares').insert(payload)

    if (error) { setErro(error.message); setSalvando(false); return }
    setDrawer(false); setSalvando(false); carregar()
  }

  async function handleImportar(rows: Record<string, string>[]) {
    if (!coafId) throw new Error('COAF não identificada.')
    const payload = rows.filter(r => r.cpf && r.nome).map(r => ({
      coaf_id:           coafId,
      cpf:               r.cpf.replace(/\D/g, ''),
      nome:              r.nome,
      data_nascimento:   r.data_nascimento   || null,
      sexo:              (r.sexo === 'M' || r.sexo === 'F') ? r.sexo : null,
      telefone_whatsapp: r.telefone_whatsapp || null,
      email:             r.email             || null,
      numero_matricula:  r.numero_matricula  || null,
      data_admissao:     r.data_admissao     || null,
    }))
    const { error } = await getSupabase()
      .from('agricultores_familiares')
      .upsert(payload, { onConflict: 'cpf' })
    if (error) throw new Error(error.message)
    carregar()
  }

  async function toggleAtivo(c: AgricultorFamiliar) {
    await getSupabase()
      .from('agricultores_familiares')
      .update({ ativo: !c.ativo })
      .eq('id', c.id)
    carregar()
  }

  async function handleExcluir(c: AgricultorFamiliar) {
    if (!confirm(`Excluir "${c.nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await getSupabase()
      .from('agricultores_familiares')
      .delete()
      .eq('id', c.id)
    if (error) {
      alert(error.message.toLowerCase().includes('foreign key')
        ? `Não é possível excluir "${c.nome}" pois existem registros vinculados.`
        : `Erro ao excluir: ${error.message}`)
      return
    }
    carregar()
  }

  const editandoAtivo = editId
    ? (cooperados.find(c => c.id === editId)?.ativo ?? true)
    : true

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cooperados</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agricultores familiares associados à cooperativa</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportarLote colunas={COLUNAS_IMPORT} onImportar={handleImportar} primaryColor={PRIMARY} />
          <button
            onClick={abrirNovo}
            className="text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: PRIMARY }}
          >
            + Novo cooperado
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CPF…"
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-[#073763]"
          />
        </div>
        <select
          value={filtroPNAE} onChange={e => setFiltroPNAE(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white"
        >
          <option value="">Todos</option>
          <option value="habilitado">Habilitados PNAE</option>
          <option value="pendente">Não habilitados</option>
        </select>
        {(busca || filtroPNAE) && (
          <button onClick={() => { setBusca(''); setFiltroPNAE('') }} className="text-xs text-gray-400 hover:text-gray-700">
            Limpar
          </button>
        )}
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">
            {(busca || filtroPNAE)
              ? `${cooperadosFiltrados.length} de ${cooperados.length}`
              : `${cooperados.length} cooperados`}
          </span>
        )}
      </div>

      {/* Tabela */}
      {loading ? <p className="text-sm text-gray-400">Carregando…</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">WhatsApp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Matrícula</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">PNAE</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cooperadosFiltrados.map(c => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{c.nome}</span>
                    {c.data_admissao && (
                      <span className="block text-xs text-gray-400">
                        Admissão: {new Date(c.data_admissao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {formatCPF(c.cpf)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.telefone_whatsapp || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.numero_matricula || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.habilitado_pnae
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.habilitado_pnae ? 'habilitado' : 'pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => abrirEditar(c)} className="text-xs font-medium hover:opacity-80" style={{ color: PRIMARY }}>Editar</button>
                      <button onClick={() => toggleAtivo(c)} className="text-xs text-gray-400 hover:text-gray-700">{c.ativo ? 'Desativar' : 'Ativar'}</button>
                      <button onClick={() => handleExcluir(c)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {cooperadosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    {busca || filtroPNAE ? 'Nenhum cooperado encontrado.' : 'Nenhum cooperado cadastrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editId ? 'Editar cooperado' : 'Novo cooperado'}>
        <form onSubmit={handleSalvar} className="space-y-4">

          {/* CPF — primeiro campo, sem autocomplete via API */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
            <input
              type="text" value={form.cpf} onChange={set('cpf')} required autoFocus
              placeholder="000.000.000-00" autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] font-mono"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input
              type="text" value={form.nome} onChange={set('nome')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
            />
          </div>

          {/* Data nascimento + Sexo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de nascimento</label>
              <input
                type="date" value={form.data_nascimento} onChange={set('data_nascimento')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
              <select value={form.sexo} onChange={set('sexo')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          {/* WhatsApp + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone WhatsApp</label>
              <input
                type="tel" value={form.telefone_whatsapp} onChange={set('telefone_whatsapp')}
                placeholder="(11) 99999-9999"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="email" value={form.email} onChange={set('email')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
          </div>

          {/* Matrícula + Data admissão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nº Matrícula</label>
              <input
                type="text" value={form.numero_matricula} onChange={set('numero_matricula')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de admissão</label>
              <input
                type="date" value={form.data_admissao} onChange={set('data_admissao')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
            </div>
          </div>

          {/* Data desligamento — só aparece ao editar cooperado ativo */}
          {editId && editandoAtivo && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de desligamento</label>
              <input
                type="date" value={form.data_desligamento} onChange={set('data_desligamento')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]"
              />
              <p className="text-xs text-gray-400 mt-0.5">Preencha apenas ao desligar o cooperado.</p>
            </div>
          )}

          {/* Habilitado PNAE */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, habilitado_pnae: !p.habilitado_pnae }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.habilitado_pnae ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                form.habilitado_pnae ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`} />
            </button>
            <span className="text-xs font-medium text-gray-700">
              Habilitado PNAE
              {form.habilitado_pnae && (
                <span className="ml-1.5 text-green-600 font-semibold">ativado</span>
              )}
            </span>
          </div>

          {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setDrawer(false)}
              className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 text-white rounded-lg py-1.5 text-xs font-medium disabled:opacity-50"
              style={{ background: PRIMARY }}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
