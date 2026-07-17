'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { buscarCNPJ } from '@/lib/useCNPJLookup'
import Drawer from '@/components/Drawer'
import ImportarLote from '@/components/ImportarLote'
import type { Fornecedor } from '@/lib/supabase'

const PRIMARY = '#073763'

type Categoria = Fornecedor['categoria']

const CATEGORIA_LABEL: Record<Categoria, string> = {
  logistica:      'Logística',
  insumos:        'Insumos',
  servicos:       'Serviços',
  contabilidade:  'Contabilidade',
  juridico:       'Jurídico',
  outro:          'Outro',
}

const VAZIO = {
  tipo_pessoa:  'pj' as 'pj' | 'pf',
  cnpj:         '',
  cpf:          '',
  categoria:    'outro' as Categoria,
  nome:         '',
  razao_social: '',
  municipio_nome: '',
  uf:           '',
  telefone:     '',
  email:        '',
  observacao:   '',
}

const COLUNAS_IMPORT = [
  { key: 'cnpj',          label: 'CNPJ' },
  { key: 'cpf',           label: 'CPF' },
  { key: 'nome',          label: 'Nome' },
  { key: 'tipo_pessoa',   label: 'Tipo Pessoa' },
  { key: 'categoria',     label: 'Categoria' },
  { key: 'municipio_nome', label: 'Município' },
  { key: 'uf',            label: 'UF' },
  { key: 'telefone',      label: 'Telefone' },
  { key: 'email',         label: 'E-mail' },
  { key: 'observacao',    label: 'Observação' },
]

export default function FornecedoresPage() {
  const [fornecedores,  setFornecedores]  = useState<Fornecedor[]>([])
  const [loading,       setLoading]       = useState(true)
  const [drawer,        setDrawer]        = useState(false)
  const [editId,        setEditId]        = useState<string | null>(null)
  const [salvando,      setSalvando]      = useState(false)
  const [erro,          setErro]          = useState('')
  const [form,          setForm]          = useState(VAZIO)
  const [buscandoCNPJ,  setBuscandoCNPJ]  = useState(false)
  const [busca,         setBusca]         = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [coafId,        setCoafId]        = useState<string | null>(null)

  useEffect(() => {
    getSupabase().from('coafs').select('id').limit(1).single().then(({ data }) => {
      if (data) setCoafId(data.id)
    })
  }, [])

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter(f => {
      if (filtroCategoria && f.categoria !== filtroCategoria) return false
      if (!busca.trim()) return true
      const q = busca.toLowerCase()
      return (
        f.nome.toLowerCase().includes(q) ||
        (f.municipio_nome || '').toLowerCase().includes(q) ||
        (f.cnpj || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (f.cpf  || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    })
  }, [fornecedores, busca, filtroCategoria])

  const set = (f: keyof typeof VAZIO) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }))

  async function carregar() {
    const { data } = await getSupabase().from('fornecedores').select('*').order('nome')
    setFornecedores((data || []) as Fornecedor[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEditId(null); setForm(VAZIO); setErro(''); setDrawer(true)
  }

  function abrirEditar(f: Fornecedor) {
    setEditId(f.id)
    setForm({
      tipo_pessoa:   f.tipo_pessoa,
      cnpj:          f.cnpj          || '',
      cpf:           f.cpf           || '',
      categoria:     f.categoria,
      nome:          f.nome,
      razao_social:  '',
      municipio_nome: f.municipio_nome || '',
      uf:            f.uf            || '',
      telefone:      f.telefone      || '',
      email:         f.email         || '',
      observacao:    f.observacao    || '',
    })
    setErro(''); setDrawer(true)
  }

  async function handleCNPJBlur() {
    const digits = form.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return
    setBuscandoCNPJ(true)
    const dados = await buscarCNPJ(form.cnpj)
    if (dados) {
      setForm(p => ({
        ...p,
        razao_social:   dados.razao_social  || p.razao_social,
        nome:           p.nome || dados.nome_fantasia || dados.razao_social,
        municipio_nome: p.municipio_nome || dados.municipio,
        uf:             p.uf  || dados.uf  || '',
        telefone:       p.telefone || dados.telefone,
        email:          p.email    || dados.email,
      }))
    }
    setBuscandoCNPJ(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!coafId) { setErro('COAF não identificada. Recarregue a página.'); return }
    setSalvando(true); setErro('')

    const isPJ = form.tipo_pessoa === 'pj'

    const payload = {
      coaf_id:       coafId,
      nome:          form.nome,
      tipo_pessoa:   form.tipo_pessoa,
      cnpj:          isPJ ? (form.cnpj || null) : null,
      cpf:           !isPJ ? (form.cpf || null) : null,
      categoria:     form.categoria,
      municipio_nome: form.municipio_nome || null,
      uf:            form.uf             || null,
      telefone:      form.telefone       || null,
      email:         form.email          || null,
      observacao:    form.observacao     || null,
    }

    const { error } = editId
      ? await getSupabase().from('fornecedores').update(payload).eq('id', editId)
      : await getSupabase().from('fornecedores').insert(payload)

    if (error) { setErro(error.message); setSalvando(false); return }
    setDrawer(false); setSalvando(false); carregar()
  }

  async function handleImportar(rows: Record<string, string>[]) {
    if (!coafId) throw new Error('COAF não identificada.')
    const payload = rows.filter(r => r.nome).map(r => ({
      coaf_id:       coafId,
      nome:          r.nome,
      tipo_pessoa:   (r.tipo_pessoa as 'pj' | 'pf') || 'pj',
      cnpj:          r.cnpj          || null,
      cpf:           r.cpf           || null,
      categoria:     (r.categoria as Categoria) || 'outro',
      municipio_nome: r.municipio_nome || null,
      uf:            r.uf             || null,
      telefone:      r.telefone       || null,
      email:         r.email          || null,
      observacao:    r.observacao     || null,
    }))
    const { error } = await getSupabase().from('fornecedores').insert(payload)
    if (error) throw new Error(error.message)
    carregar()
  }

  async function toggleAtivo(f: Fornecedor) {
    await getSupabase().from('fornecedores').update({ ativo: !f.ativo }).eq('id', f.id)
    carregar()
  }

  async function handleExcluir(f: Fornecedor) {
    if (!confirm(`Excluir "${f.nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await getSupabase().from('fornecedores').delete().eq('id', f.id)
    if (error) {
      alert(error.message.includes('foreign key')
        ? `Não é possível excluir "${f.nome}" pois existem registros vinculados.`
        : `Erro ao excluir: ${error.message}`)
      return
    }
    carregar()
  }

  const isPJ = form.tipo_pessoa === 'pj'

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Empresas e prestadores externos à cooperativa</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportarLote colunas={COLUNAS_IMPORT} onImportar={handleImportar} primaryColor={PRIMARY} />
          <button
            onClick={abrirNovo}
            className="text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: PRIMARY }}
          >
            + Novo fornecedor
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
            placeholder="Buscar por nome, CNPJ/CPF ou município…"
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-[#073763]"
          />
        </div>
        <select
          value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white"
        >
          <option value="">Todas as categorias</option>
          {(Object.keys(CATEGORIA_LABEL) as Categoria[]).map(c => (
            <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
          ))}
        </select>
        {(busca || filtroCategoria) && (
          <button onClick={() => { setBusca(''); setFiltroCategoria('') }} className="text-xs text-gray-400 hover:text-gray-700">
            Limpar
          </button>
        )}
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">
            {(busca || filtroCategoria)
              ? `${fornecedoresFiltrados.length} de ${fornecedores.length}`
              : `${fornecedores.length} fornecedores`}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CNPJ / CPF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Município / UF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {fornecedoresFiltrados.map(f => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{f.nome}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      f.tipo_pessoa === 'pj'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {f.tipo_pessoa === 'pj' ? 'PJ' : 'PF'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{CATEGORIA_LABEL[f.categoria]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {f.cnpj || f.cpf || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {f.municipio_nome || '—'}
                    {f.uf && <span className="text-gray-400"> / {f.uf}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {f.telefone && <span className="block text-xs">{f.telefone}</span>}
                    {f.email    && <span className="block text-xs text-gray-400">{f.email}</span>}
                    {!f.telefone && !f.email && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {f.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => abrirEditar(f)} className="text-xs font-medium hover:opacity-80" style={{ color: PRIMARY }}>Editar</button>
                      <button onClick={() => toggleAtivo(f)} className="text-xs text-gray-400 hover:text-gray-700">{f.ativo ? 'Desativar' : 'Ativar'}</button>
                      <button onClick={() => handleExcluir(f)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {fornecedoresFiltrados.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  {busca || filtroCategoria ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editId ? 'Editar fornecedor' : 'Novo fornecedor'}>
        <form onSubmit={handleSalvar} className="space-y-4">

          {/* tipo_pessoa — primeiro campo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de pessoa *</label>
            <select value={form.tipo_pessoa} onChange={set('tipo_pessoa')} autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
              <option value="pj">Pessoa Jurídica (PJ)</option>
              <option value="pf">Pessoa Física (PF)</option>
            </select>
          </div>

          {/* CNPJ ou CPF conforme tipo_pessoa */}
          {isPJ ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
              <input
                type="text" value={form.cnpj} onChange={set('cnpj')} onBlur={handleCNPJBlur}
                placeholder="00.000.000/0000-00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] font-mono"
              />
              {buscandoCNPJ && <p className="text-xs text-blue-500 mt-0.5">Buscando dados do CNPJ…</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
              <input
                type="text" value={form.cpf} onChange={set('cpf')}
                placeholder="000.000.000-00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] font-mono"
              />
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
            <select value={form.categoria} onChange={set('categoria')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
              {(Object.entries(CATEGORIA_LABEL) as [Categoria, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input type="text" value={form.nome} onChange={set('nome')} required
              placeholder={isPJ ? 'Nome fantasia' : 'Nome completo'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          {/* Razão Social — somente PJ, preenchida pelo autocomplete */}
          {isPJ && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social</label>
              <input type="text" value={form.razao_social} onChange={set('razao_social')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
          )}

          {/* Município + UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Município</label>
              <input type="text" value={form.municipio_nome} onChange={set('municipio_nome')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
              <input type="text" value={form.uf} onChange={set('uf')} placeholder="SP" maxLength={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] uppercase" />
            </div>
          </div>

          {/* Telefone + E-mail */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="tel" value={form.telefone} onChange={set('telefone')} placeholder="(11) 3333-4444"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observação</label>
            <textarea value={form.observacao} onChange={set('observacao')} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] resize-none" />
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
