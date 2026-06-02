import { useState, useEffect } from 'react';
import { Package, Plus, Search, Download, Trash2, CreditCard as Edit3, X, Save, Loader2, Calendar, Filter, BarChart3, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ExpeditionDashboard } from './ExpeditionDashboard';

interface ExpeditionRecord {
  id: string;
  order_code: string;
  boxes: number;
  order_date: string | null;
  reserved_by: string | null;
  delivery_date: string | null;
  company_name: string | null;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  shipped_date: string | null;
  shipped_by: string | null;
  created_at: string;
}

const emptyForm = {
  order_code: '',
  boxes: 0,
  order_date: '',
  reserved_by: '',
  delivery_date: '',
  company_name: '',
  trade_name: '',
  city: '',
  state: '',
  shipped_date: '',
  shipped_by: '',
};

const STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

export function ExpeditionManagement() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records'>('dashboard');
  const [records, setRecords] = useState<ExpeditionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpeditionRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadRecords();
  }, [filterMonth]);

  const loadRecords = async () => {
    setLoading(true);
    let query = supabase
      .from('expedition_records')
      .select('*')
      .order('shipped_date', { ascending: false, nullsFirst: false });

    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number);
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate = new Date(y, m, 0).toISOString().split('T')[0];
      query = query.or(`shipped_date.gte.${startDate},shipped_date.is.null`);
      query = query.or(`shipped_date.lte.${endDate},shipped_date.is.null`);
    }

    const { data, error } = await query;
    if (!error && data) setRecords(data);
    setLoading(false);
  };

  const filteredRecords = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.order_code.toLowerCase().includes(s) ||
      (r.company_name || '').toLowerCase().includes(s) ||
      (r.trade_name || '').toLowerCase().includes(s) ||
      (r.city || '').toLowerCase().includes(s) ||
      (r.reserved_by || '').toLowerCase().includes(s) ||
      (r.shipped_by || '').toLowerCase().includes(s)
    );
  });

  const openNewForm = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (record: ExpeditionRecord) => {
    setEditingRecord(record);
    setForm({
      order_code: record.order_code,
      boxes: record.boxes,
      order_date: record.order_date || '',
      reserved_by: record.reserved_by || '',
      delivery_date: record.delivery_date || '',
      company_name: record.company_name || '',
      trade_name: record.trade_name || '',
      city: record.city || '',
      state: record.state || '',
      shipped_date: record.shipped_date || '',
      shipped_by: record.shipped_by || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.order_code.trim()) {
      alert('Informe o codigo do pedido');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        order_code: form.order_code.trim(),
        boxes: form.boxes || 0,
        order_date: form.order_date || null,
        reserved_by: form.reserved_by.trim() || null,
        delivery_date: form.delivery_date || null,
        company_name: form.company_name.trim() || null,
        trade_name: form.trade_name.trim() || null,
        city: form.city.trim() || null,
        state: form.state || null,
        shipped_date: form.shipped_date || null,
        shipped_by: form.shipped_by.trim() || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('expedition_records')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expedition_records')
          .insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      loadRecords();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    const { error } = await supabase.from('expedition_records').delete().eq('id', id);
    if (!error) loadRecords();
  };

  const exportCSV = () => {
    const headers = ['Codigo Pedido','Caixas','Data Pedido','Reservado Por','Data Entrega','Razao Social','Nome Fantasia','Cidade','UF','Expedido Em','Expedido Por'];
    const rows = filteredRecords.map(r => [
      r.order_code, r.boxes, r.order_date || '', r.reserved_by || '',
      r.delivery_date || '', r.company_name || '', r.trade_name || '',
      r.city || '', r.state || '', r.shipped_date || '', r.shipped_by || ''
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expedicao_${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalBoxes = filteredRecords.reduce((sum, r) => sum + r.boxes, 0);
  const totalShipped = filteredRecords.filter(r => r.shipped_date).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            Expedicao
          </h1>
          <p className="text-gray-500 mt-1">Controle de pedidos expedidos</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'records' && (
            <>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={openNewForm}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Registro
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'records'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <List className="w-4 h-4" />
          Registros
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <ExpeditionDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registros</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{filteredRecords.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total de Caixas</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalBoxes}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expedidos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalShipped}</p>
            </div>
          </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por codigo, empresa, cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Caixas</th>
                  <th className="px-4 py-3 text-left font-semibold">Data Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                  <th className="px-4 py-3 text-left font-semibold">Cidade/UF</th>
                  <th className="px-4 py-3 text-left font-semibold">Expedido Em</th>
                  <th className="px-4 py-3 text-left font-semibold">Expedido Por</th>
                  <th className="px-4 py-3 text-center font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.order_code}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium text-xs">
                        {r.boxes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.order_date ? new Date(r.order_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-medium">{r.trade_name || r.company_name || '-'}</div>
                      {r.trade_name && r.company_name && (
                        <div className="text-xs text-gray-400">{r.company_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.city ? `${r.city}/${r.state}` : r.state || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {r.shipped_date ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(r.shipped_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.shipped_by || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditForm(r)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingRecord ? 'Editar Registro' : 'Novo Registro de Expedicao'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Codigo do Pedido *</label>
                  <input
                    type="text"
                    value={form.order_code}
                    onChange={e => setForm(prev => ({ ...prev, order_code: e.target.value }))}
                    placeholder="Ex: PD 42442"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Caixas</label>
                  <input
                    type="number"
                    value={form.boxes}
                    onChange={e => setForm(prev => ({ ...prev, boxes: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data do Pedido</label>
                  <input
                    type="date"
                    value={form.order_date}
                    onChange={e => setForm(prev => ({ ...prev, order_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reservado Por</label>
                  <input
                    type="text"
                    value={form.reserved_by}
                    onChange={e => setForm(prev => ({ ...prev, reserved_by: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Razao Social</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={form.trade_name}
                    onChange={e => setForm(prev => ({ ...prev, trade_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">UF</label>
                  <select
                    value={form.state}
                    onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data Entrega</label>
                  <input
                    type="date"
                    value={form.delivery_date}
                    onChange={e => setForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Dados de Expedicao</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expedido Em</label>
                    <input
                      type="date"
                      value={form.shipped_date}
                      onChange={e => setForm(prev => ({ ...prev, shipped_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expedido Por</label>
                    <input
                      type="text"
                      value={form.shipped_by}
                      onChange={e => setForm(prev => ({ ...prev, shipped_by: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingRecord ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}