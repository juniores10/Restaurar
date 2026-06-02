import { useState, useEffect } from 'react';
import { PlusCircle, Save, X, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Carrier {
  id: string;
  name: string;
}

interface FormData {
  shipment_date: string;
  nf_number: string;
  nature: string;
  client_name: string;
  client_cnpj: string;
  destination_city: string;
  destination_state: string;
  destination_cep: string;
  carrier_name: string;
  volume: string;
  weight: string;
  nf_value: string;
  quote_value: string;
  freight_value: string;
  cte_number: string;
  invoice_number: string;
  status: string;
  estimated_delivery: string;
  delivered_at: string;
  business_days: string;
  observations: string;
}

const emptyForm: FormData = {
  shipment_date: new Date().toISOString().split('T')[0],
  nf_number: '',
  nature: 'VENDA',
  client_name: '',
  client_cnpj: '',
  destination_city: '',
  destination_state: '',
  destination_cep: '',
  carrier_name: '',
  volume: '',
  weight: '',
  nf_value: '',
  quote_value: '',
  freight_value: '',
  cte_number: '',
  invoice_number: '',
  status: 'em_transporte',
  estimated_delivery: '',
  delivered_at: '',
  business_days: '',
  observations: '',
};

const STATUS_OPTIONS = [
  { value: 'em_transporte', label: 'Em Transporte' },
  { value: 'entregue_prazo', label: 'Entregue no Prazo' },
  { value: 'entregue_atraso', label: 'Entregue com Atraso' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export function FreightEntries() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCarriers();
    loadRecentRecords();
  }, []);

  const loadCarriers = async () => {
    const { data } = await supabase
      .from('freight_carriers')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setCarriers(data);
  };

  const loadRecentRecords = async () => {
    const { data } = await supabase
      .from('freight_records')
      .select('*')
      .order('shipment_date', { ascending: false })
      .limit(20);
    if (data) setRecords(data);
  };

  const calculateFreightPercentage = () => {
    const nfValue = parseFloat(form.nf_value) || 0;
    const freightValue = parseFloat(form.freight_value) || 0;
    if (nfValue > 0) return ((freightValue / nfValue) * 100).toFixed(2);
    return '0.00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const nfValue = parseFloat(form.nf_value) || 0;
      const freightValue = parseFloat(form.freight_value) || 0;
      const quoteValue = parseFloat(form.quote_value) || 0;
      const freightPct = nfValue > 0 ? (freightValue / nfValue) : 0;
      const quotePct = nfValue > 0 ? (quoteValue / nfValue) : 0;

      const record = {
        shipment_date: form.shipment_date,
        nf_number: form.nf_number || null,
        nature: form.nature || null,
        client_name: form.client_name || null,
        client_cnpj: form.client_cnpj || null,
        destination_city: form.destination_city || null,
        destination_state: form.destination_state || null,
        destination_cep: form.destination_cep || null,
        carrier_name: form.carrier_name || null,
        volume: parseFloat(form.volume) || 0,
        weight: parseFloat(form.weight) || 0,
        nf_value: nfValue,
        quote_value: quoteValue,
        freight_value: freightValue,
        quote_vs_nf_pct: quotePct,
        freight_vs_nf_pct: freightPct,
        cost_value: freightValue,
        cte_number: form.cte_number || null,
        invoice_number: form.invoice_number || null,
        status: form.status,
        estimated_delivery: form.estimated_delivery || null,
        delivered_at: form.delivered_at || null,
        business_days: parseInt(form.business_days) || 0,
        observations: form.observations || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('freight_records')
          .update({ ...record, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
        setSuccessMessage('Registro atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('freight_records')
          .insert(record);
        if (error) throw error;
        setSuccessMessage('Lancamento registrado com sucesso!');
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      loadRecentRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving freight record:', error);
      alert('Erro ao salvar registro');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: any) => {
    setForm({
      shipment_date: record.shipment_date || '',
      nf_number: record.nf_number || '',
      nature: record.nature || '',
      client_name: record.client_name || '',
      client_cnpj: record.client_cnpj || '',
      destination_city: record.destination_city || '',
      destination_state: record.destination_state || '',
      destination_cep: record.destination_cep || '',
      carrier_name: record.carrier_name || '',
      volume: String(record.volume || ''),
      weight: String(record.weight || ''),
      nf_value: String(record.nf_value || ''),
      quote_value: String(record.quote_value || ''),
      freight_value: String(record.freight_value || ''),
      cte_number: record.cte_number || '',
      invoice_number: record.invoice_number || '',
      status: record.status || 'em_transporte',
      estimated_delivery: record.estimated_delivery || '',
      delivered_at: record.delivered_at ? record.delivered_at.split('T')[0] : '',
      business_days: String(record.business_days || ''),
      observations: record.observations || '',
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      em_transporte: 'bg-blue-100 text-blue-700',
      entregue_prazo: 'bg-green-100 text-green-700',
      entregue_atraso: 'bg-orange-100 text-orange-700',
      atrasado: 'bg-red-100 text-red-700',
      cancelado: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {!showForm ? (
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Lancamentos de Frete</h2>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Lancamento
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">
              {editingId ? 'Editar Lancamento' : 'Novo Lancamento de Frete'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data Envio *</label>
                <input type="date" value={form.shipment_date} onChange={(e) => setForm(prev => ({ ...prev, shipment_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nota Fiscal</label>
                <input type="text" value={form.nf_number} onChange={(e) => setForm(prev => ({ ...prev, nf_number: e.target.value }))} placeholder="Numero NF" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Natureza</label>
                <input type="text" value={form.nature} onChange={(e) => setForm(prev => ({ ...prev, nature: e.target.value }))} placeholder="VENDA, REMESSA..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Cliente / Destino</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cliente</label>
                  <input type="text" value={form.client_name} onChange={(e) => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Nome do cliente" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ</label>
                  <input type="text" value={form.client_cnpj} onChange={(e) => setForm(prev => ({ ...prev, client_cnpj: e.target.value }))} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                  <input type="text" value={form.destination_cep} onChange={(e) => setForm(prev => ({ ...prev, destination_cep: e.target.value }))} placeholder="00000-000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                  <input type="text" value={form.destination_city} onChange={(e) => setForm(prev => ({ ...prev, destination_city: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
                  <select value={form.destination_state} onChange={(e) => setForm(prev => ({ ...prev, destination_state: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="">Selecione</option>
                    {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dias Uteis</label>
                  <input type="number" value={form.business_days} onChange={(e) => setForm(prev => ({ ...prev, business_days: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Transporte</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Transportadora</label>
                  <select value={form.carrier_name} onChange={(e) => setForm(prev => ({ ...prev, carrier_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="">Selecione</option>
                    {carriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Volumes</label>
                  <input type="number" step="1" value={form.volume} onChange={(e) => setForm(prev => ({ ...prev, volume: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
                  <input type="number" step="0.01" value={form.weight} onChange={(e) => setForm(prev => ({ ...prev, weight: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Previsao Entrega</label>
                  <input type="date" value={form.estimated_delivery} onChange={(e) => setForm(prev => ({ ...prev, estimated_delivery: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Valores</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Valor NF (R$)</label>
                  <input type="number" step="0.01" value={form.nf_value} onChange={(e) => setForm(prev => ({ ...prev, nf_value: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cotacao (R$)</label>
                  <input type="number" step="0.01" value={form.quote_value} onChange={(e) => setForm(prev => ({ ...prev, quote_value: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Valor Frete (R$)</label>
                  <input type="number" step="0.01" value={form.freight_value} onChange={(e) => setForm(prev => ({ ...prev, freight_value: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">% Frete</label>
                  <input type="text" value={calculateFreightPercentage() + '%'} readOnly className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entregue em</label>
                  <input type="date" value={form.delivered_at} onChange={(e) => setForm(prev => ({ ...prev, delivered_at: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Documentos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CT-e</label>
                  <input type="text" value={form.cte_number} onChange={(e) => setForm(prev => ({ ...prev, cte_number: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fatura</label>
                  <input type="text" value={form.invoice_number} onChange={(e) => setForm(prev => ({ ...prev, invoice_number: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Observacoes</label>
              <textarea value={form.observations} onChange={(e) => setForm(prev => ({ ...prev, observations: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Lancamentos Recentes</h3>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">Nenhum lancamento registrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Data</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">NF</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600 hidden md:table-cell">Transportadora</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-600">Frete</th>
                    <th className="text-center py-2 px-3 font-medium text-slate-600">Status</th>
                    <th className="text-center py-2 px-3 font-medium text-slate-600 w-16">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-700">
                        {new Date(record.shipment_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700">{record.nf_number || '-'}</td>
                      <td className="py-2 px-3 text-slate-600 hidden sm:table-cell truncate max-w-[120px]">
                        {record.client_name || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 hidden md:table-cell">{record.carrier_name || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.freight_value || 0)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(record.status)}`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button onClick={() => handleEdit(record)} className="p-1 hover:bg-teal-50 rounded text-teal-600 hover:text-teal-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
