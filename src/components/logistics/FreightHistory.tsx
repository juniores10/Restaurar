import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'em_transporte', label: 'Em Transporte' },
  { value: 'entregue_prazo', label: 'Entregue no Prazo' },
  { value: 'entregue_atraso', label: 'Entregue com Atraso' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function FreightHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    loadRecords();
  }, [page, statusFilter, dateFrom, dateTo]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('freight_records')
        .select('*', { count: 'exact' });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (dateFrom) query = query.gte('shipment_date', dateFrom);
      if (dateTo) query = query.lte('shipment_date', dateTo);
      if (search) {
        query = query.or(`client_name.ilike.%${search}%,nf_number.ilike.%${search}%,carrier_name.ilike.%${search}%,cte_number.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('shipment_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      setRecords(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadRecords();
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Data', 'NF', 'Cliente', 'CNPJ', 'Cidade', 'UF', 'CEP', 'Natureza', 'Transportadora', 'Volume', 'Peso', 'Valor NF', 'Cotacao', 'Valor Frete', '% Frete', 'CT-e', 'Fatura', 'Status', 'SLA', 'Dias Reais', 'Atraso'];
    const rows = records.map(r => [
      r.shipment_date, r.nf_number, r.client_name, r.client_cnpj,
      r.destination_city, r.destination_state, r.destination_cep, r.nature,
      r.carrier_name, r.volume, r.weight, r.nf_value, r.quote_value,
      r.freight_value, r.freight_percentage, r.cte_number, r.invoice_number,
      r.status, r.sla_days, r.actual_days, r.delay_days,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fretes_historico_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / pageSize);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Historico de Fretes</h2>
        <button
          onClick={exportCSV}
          disabled={records.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por cliente, NF, transportadora..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="px-2 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400 text-xs">a</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="px-2 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">Nenhum registro encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-2 font-medium text-slate-600">Data</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600">NF</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600 hidden sm:table-cell">Cliente</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600 hidden lg:table-cell">Cidade/UF</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600 hidden md:table-cell">Transportadora</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600 hidden lg:table-cell">Valor NF</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Frete</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600 hidden md:table-cell">%</th>
                    <th className="text-left py-2 px-2 font-medium text-slate-600 hidden lg:table-cell">CT-e</th>
                    <th className="text-center py-2 px-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-700">
                        {new Date(record.shipment_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-700">{record.nf_number || '-'}</td>
                      <td className="py-2 px-2 text-slate-600 hidden sm:table-cell truncate max-w-[120px]">
                        {record.client_name || '-'}
                      </td>
                      <td className="py-2 px-2 text-slate-600 hidden lg:table-cell">
                        {record.destination_city ? `${record.destination_city}/${record.destination_state}` : '-'}
                      </td>
                      <td className="py-2 px-2 text-slate-600 hidden md:table-cell">{record.carrier_name || '-'}</td>
                      <td className="py-2 px-2 text-right text-slate-600 hidden lg:table-cell">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.nf_value || 0)}
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.freight_value || 0)}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600 hidden md:table-cell">
                        {record.freight_percentage ? `${record.freight_percentage}%` : '-'}
                      </td>
                      <td className="py-2 px-2 text-slate-600 hidden lg:table-cell">{record.cte_number || '-'}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(record.status)}`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600">
                  {page + 1} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
