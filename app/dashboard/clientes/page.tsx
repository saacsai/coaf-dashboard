'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { buscarCNPJ } from '@/lib/useCNPJLookup'
import { buscarCEP } from '@/lib/useCEPLookup'
import Drawer from '@/components/Drawer'
import ImportarLote from '@/components/ImportarLote'
import type { Cliente } from '@/lib/supabase'

const PRIMARY = '#073763'

type ModeloVenda = 'compra_venda' | 'prestacao_servicos' | ''

const VAZIO = {
  cnpj:                  '',
  tipo:                  'orgao_publico' as Cliente['tipo'],
  razao_social:          '',
  nome:                  '',
  uf:                    '',
  municipio:             '',
  cep:                   '',
  endereco:              '',
  telefone:              '',
  email:                 '',
  contato_nome:          '',
  contato_whatsapp:      '',
  codigo:                '',
  modelo_venda:          '' as ModeloVenda,
  pct_taxa_cooperativa:  '',
  pct_logistica:         '',
  pct_repasse_cooperado: '',
}

const COLUNAS_IMPORT = [
  { key: 'cnpj',             label: 'CNPJ' },
  { key: 'nome',             label: 'Nome / Fantasia' },
  { key: 'tipo',             label: 'Tipo' },
  { key: 'razao_social',     label: 'Razão Social' },
  { key: 'municipio',        label: 'Município' },
  { key: 'uf',               label: 'UF' },
  { key: 'cep',              label: 'CEP' },
  { key: 'endereco',         label: 'Endereço' },
  { key: 'telefone',         label: 'Telefone' },
  { key: 'email',            label: 'E-mail' },
  { key: 'contato_nome',     label: 'Contato Nome' },
  { key: 'contato_whatsapp', label: 'Contato WhatsApp' },
  { key: 'codigo',           label: 'Código interno' },
]

const TIPO_LABEL: Record<Cliente['tipo'], string> = {
  orgao_publico:   'Órgão Público',
  cooperativa:     'Cooperativa',
  associacao:      'Associação',
  oscip:           'OSCIP',
  empresa_privada: 'Empresa Privada',
  outro:           'Outro',
}

function pctSoma(f: typeof VAZIO) {
  const a = parseFloat(f.pct_taxa_cooperativa  || '0')
  const b = parseFloat(f.pct_logistica         || '0')
  const c = parseFloat(f.pct_repasse_cooperado || '0')
  return Math.round((a + b + c) * 100) / 100
}

export default function ClientesPage() {
  const [clientes,     setClientes]     = useState<Cliente[]>([])
  const [loading,      setLoading]      = useState(true)
  const [drawer,       setDrawer]       = useState(false)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [form,         setForm]         = useState(VAZIO)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [buscandoCEP,  setBuscandoCEP]  = useState(false)
  const [busca,        setBusca]        = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      if (filtroTipo && c.tipo !== filtroTipo) return false
      if (!busca.trim()) return true
      const q = busca.toLowerCase()
      return (
        c.nome.toLowerCase().includes(q) ||
        (c.razao_social || '').toLowerCase().includes(q) ||
        (c.municipio || '').toLowerCase().includes(q) ||
        (c.cnpj || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    })
  }, [clientes, busca, filtroTipo])

  const set = (f: keyof typeof VAZIO) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }))

  async function carregar() {
    const { data } = await getSupabase().from('clientes').select('*').order('nome')
    setClientes((data || []) as Cliente[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEditId(null); setForm(VAZIO); setErro(''); setDrawer(true)
  }

  function abrirEditar(c: Cliente) {
    setEditId(c.id)
    setForm({
      cnpj:                  c.cnpj                  || '',
      tipo:                  c.tipo                  || 'orgao_publico',
      razao_social:          c.razao_social          || '',
      nome:                  c.nome,
      uf:                    c.uf                    || '',
      municipio:             c.municipio             || '',
      cep:                   c.cep                   || '',
      endereco:              c.endereco              || '',
      telefone:              c.telefone              || '',
      email:                 c.email                 || '',
      contato_nome:          c.contato_nome          || '',
      contato_whatsapp:      c.contato_whatsapp      || '',
      codigo:                c.codigo                || '',
      modelo_venda:          (c.modelo_venda         || '') as ModeloVenda,
      pct_taxa_cooperativa:  c.pct_taxa_cooperativa  != null ? String(c.pct_taxa_cooperativa)  : '',
      pct_logistica:         c.pct_logistica         != null ? String(c.pct_logistica)         : '',
      pct_repasse_cooperado: c.pct_repasse_cooperado != null ? String(c.pct_repasse_cooperado) : '',
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
        razao_social: dados.razao_social || p.razao_social,
        nome:         p.nome || dados.nome_fantasia || dados.razao_social,
        endereco:     p.endereco || dados.endereco,
        municipio:    p.municipio || dados.municipio,
        uf:           p.uf || dados.uf || '',
        cep:          p.cep || dados.cep,
        telefone:     p.telefone || dados.telefone,
        email:        p.email || dados.email,
      }))
    }
    setBuscandoCNPJ(false)
  }

  async function handleCEPBlur() {
    const digits = form.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCEP(true)
    const dados = await buscarCEP(form.cep)
    if (dados) {
      setForm(p => ({
        ...p,
        cep:      dados.cep,
        municipio: p.municipio || dados.municipio,
        uf:        p.uf        || dados.uf || '',
        endereco:  p.endereco  || [dados.logradouro, dados.bairro].filter(Boolean).join(', '),
      }))
    }
    setBuscandoCEP(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (form.modelo_venda === 'prestacao_servicos' && pctSoma(form) !== 100) {
      setErro('Os percentuais devem somar exatamente 100%.')
      return
    }
    setSalvando(true); setErro('')

    const ehPrestacao = form.modelo_venda === 'prestacao_servicos'
    const payload = {
      cnpj:                  form.cnpj            || null,
      tipo:                  form.tipo,
      razao_social:          form.razao_social     || null,
      nome:                  form.nome,
      uf:                    form.uf               || null,
      municipio:             form.municipio        || null,
      cep:                   form.cep              || null,
      endereco:              form.endereco         || null,
      telefone:              form.telefone         || null,
      email:                 form.email            || null,
      contato_nome:          form.contato_nome     || null,
      contato_whatsapp:      form.contato_whatsapp || null,
      codigo:                form.codigo           || null,
      modelo_venda:          form.modelo_venda     || null,
      pct_taxa_cooperativa:  ehPrestacao ? parseFloat(form.pct_taxa_cooperativa)  : null,
      pct_logistica:         ehPrestacao ? parseFloat(form.pct_logistica)         : null,
      pct_repasse_cooperado: ehPrestacao ? parseFloat(form.pct_repasse_cooperado) : null,
    }

    const { error } = editId
      ? await getSupabase().from('clientes').update(payload).eq('id', editId)
      : await getSupabase().from('clientes').insert(payload)

    if (error) { setErro(error.message); setSalvando(false); return }
    setDrawer(false); setSalvando(false); carregar()
  }

  async function handleImportar(rows: Record<string, string>[]) {
    const payload = rows.filter(r => r.nome).map(r => ({
      cnpj:             r.cnpj             || null,
      nome:             r.nome,
      tipo:             (r.tipo as Cliente['tipo']) || 'orgao_publico',
      razao_social:     r.razao_social     || null,
      municipio:        r.municipio        || null,
      uf:               r.uf               || null,
      cep:              r.cep              || null,
      endereco:         r.endereco         || null,
      telefone:         r.telefone         || null,
      email:            r.email            || null,
      contato_nome:     r.contato_nome     || null,
      contato_whatsapp: r.contato_whatsapp || null,
      codigo:           r.codigo           || null,
    }))
    const { error } = await getSupabase().from('clientes').upsert(payload, { onConflict: 'cnpj' })
    if (error) throw new Error(error.message)
    carregar()
  }

  async function toggleAtivo(c: Cliente) {
    await getSupabase().from('clientes').update({ ativo: !c.ativo }).eq('id', c.id)
    carregar()
  }

  async function handleExcluir(c: Cliente) {
    if (!confirm(`Excluir "${c.nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await getSupabase().from('clientes').delete().eq('id', c.id)
    if (error) {
      alert(error.message.includes('foreign key')
        ? `Não é possível excluir "${c.nome}" pois existem contratos ou pedidos vinculados.`
        : `Erro ao excluir: ${error.message}`)
      return
    }
    carregar()
  }

  const soma = pctSoma(form)
  const somaOk = soma === 100
  const isPrestacao = form.modelo_venda === 'prestacao_servicos'

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Prefeituras e órgãos compradores via PNAE/PAA</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportarLote colunas={COLUNAS_IMPORT} onImportar={handleImportar} primaryColor={PRIMARY} />
          <button
            onClick={abrirNovo}
            className="text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: PRIMARY }}
          >
            + Novo cliente
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
            placeholder="Buscar por nome, CNPJ ou município…"
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-[#073763]"
          />
        </div>
        <select
          value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white"
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(TIPO_LABEL) as Cliente['tipo'][]).map(t => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>
        {(busca || filtroTipo) && (
          <button onClick={() => { setBusca(''); setFiltroTipo('') }} className="text-xs text-gray-400 hover:text-gray-700">
            Limpar
          </button>
        )}
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">
            {(busca || filtroTipo) ? `${clientesFiltrados.length} de ${clientes.length}` : `${clientes.length} clientes`}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Município / UF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Modelo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(c => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{c.nome}</span>
                    {c.razao_social && c.razao_social !== c.nome && (
                      <span className="block text-xs text-gray-400">{c.razao_social}</span>
                    )}
                    <span className="block text-xs text-gray-400">{TIPO_LABEL[c.tipo]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.cnpj || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.municipio || '—'}
                    {c.uf && <span className="text-gray-400"> / {c.uf}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.contato_nome && <span className="block">{c.contato_nome}</span>}
                    {c.telefone && <span className="block text-xs text-gray-400">{c.telefone}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.modelo_venda ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.modelo_venda === 'compra_venda'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {c.modelo_venda === 'compra_venda' ? 'Compra/Venda' : 'Prestação'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">padrão COAF</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
              {clientesFiltrados.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  {busca || filtroTipo ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title={editId ? 'Editar cliente' : 'Novo cliente'}>
        <form onSubmit={handleSalvar} className="space-y-4">

          {/* CNPJ — primeiro campo, dispara autocomplete no blur */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
            <input
              type="text" value={form.cnpj} onChange={set('cnpj')} onBlur={handleCNPJBlur}
              placeholder="00.000.000/0000-00" autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] font-mono"
            />
            {buscandoCNPJ && <p className="text-xs text-blue-500 mt-0.5">Buscando dados do CNPJ…</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
                {(Object.entries(TIPO_LABEL) as [Cliente['tipo'], string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código interno</label>
              <input type="text" value={form.codigo} onChange={set('codigo')} placeholder="ex: 001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social</label>
            <input type="text" value={form.razao_social} onChange={set('razao_social')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome / Fantasia *</label>
            <input type="text" value={form.nome} onChange={set('nome')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Município</label>
              <input type="text" value={form.municipio} onChange={set('municipio')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
              <input type="text" value={form.uf} onChange={set('uf')} placeholder="SP" maxLength={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] uppercase" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
              <input type="text" value={form.cep} onChange={set('cep')} onBlur={handleCEPBlur} placeholder="00000-000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
              {buscandoCEP && <p className="text-xs text-blue-500 mt-0.5">Buscando CEP…</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="tel" value={form.telefone} onChange={set('telefone')} placeholder="(11) 3333-4444"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
            <input type="text" value={form.endereco} onChange={set('endereco')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={set('email')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
          </div>

          {/* Contato */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contato</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input type="text" value={form.contato_nome} onChange={set('contato_nome')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
                <input type="tel" value={form.contato_whatsapp} onChange={set('contato_whatsapp')} placeholder="(11) 99999-9999"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763]" />
              </div>
            </div>
          </div>

          {/* Modelo de Negócio — sobrepõe o padrão da COAF */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Modelo de Negócio</p>
            <p className="text-xs text-gray-400 mb-3">Opcional — sobrepõe o modelo padrão configurado na COAF.</p>
            <select value={form.modelo_venda} onChange={set('modelo_venda')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#073763] bg-white">
              <option value="">Padrão da COAF</option>
              <option value="compra_venda">Compra e Venda</option>
              <option value="prestacao_servicos">Prestação de Serviços</option>
            </select>

            {isPrestacao && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">Distribuição dos percentuais (total: <span className={somaOk ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>{soma}%</span>)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">% Taxa coop.</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.pct_taxa_cooperativa} onChange={set('pct_taxa_cooperativa')}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-[#073763]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">% Logística</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.pct_logistica} onChange={set('pct_logistica')}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-[#073763]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">% Repasse</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.pct_repasse_cooperado} onChange={set('pct_repasse_cooperado')}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-[#073763]" />
                  </div>
                </div>
                {!somaOk && soma > 0 && (
                  <p className="text-xs text-red-500">A soma deve ser 100%. Faltam {(100 - soma).toFixed(2)}%.</p>
                )}
              </div>
            )}
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
