import { useState, useEffect } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function FreightReports() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'carrier' | 'client' | 'state' | 'month'>('carrier');

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('freight_records')
        .select('*')
        .gte('shipment_date', dateFrom)
        .lte('shipment_date', dateTo)
        .order('shipment_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGroupedData = () => {
    const groups: Record<string, { count: number; totalFreight: number; totalNF: number; avgPercentage: number; delayed: number }> = {};

    records.forEach(r => {
      let key = '';
      switch (groupBy) {
        case 'carrier': key = r.carrier_name || 'Sem Transportadora'; break;
        case 'client': key = r.client_name || 'Sem Cliente'; break;
        case 'state': key = r.destination_state || 'Sem UF'; break;
        case 'month': key = r.shipment_date ? new Date(r.shipment_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem Data'; break;
      }

      if (!groups[key]) {
        groups[key] = { count: 0, totalFreight: 0, totalNF: 0, avgPercentage: 0, delayed: 0 };
      }

      groups[key].count++;
      groups[key].totalFreight += Number(r.freight_value) || 0;
      groups[key].totalNF += Number(r.nf_value) || 0;
      if (r.status === 'atrasado' || r.status === 'entregue_atraso') groups[key].delayed++;
    });

    Object.keys(groups).forEach(key => {
      groups[key].avgPercentage = groups[key].totalNF > 0
        ? Math.round((groups[key].totalFreight / groups[key].totalNF) * 10000) / 100
        : 0;
    });

    return Object.entries(groups).sort((a, b) => b[1].totalFreight - a[1].totalFreight);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportReport = () => {
    const grouped = getGroupedData();
    const groupLabel = groupBy === 'carrier' ? 'Transportadora' : groupBy === 'client' ? 'Cliente' : groupBy === 'state' ? 'UF' : 'Mes';
    const headers = [groupLabel, 'Qtd Envios', 'Valor Frete', 'Valor NF', '% Frete', 'Atrasados'];
    const rows = grouped.map(([key, data]) => [
      key, data.count, data.totalFreight.toFixed(2), data.totalNF.toFixed(2), data.avgPercentage.toFixed(2) + '%', data.delayed,
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_fretes_${groupBy}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = getGroupedData();
  const totalFreight = records.reduce((sum, r) => sum + (Number(r.freight_value) || 0), 0);
  const totalNF = records.reduce((sum, r) => sum + (Number(r.nf_value) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Relatorios</h2>
        <button
          onClick={exportReport}
          disabled={records.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-slate-400 text-sm">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="carrier">Agrupar por Transportadora</option>
            <option value="client">Agrupar por Cliente</option>
            <option value="state">Agrupar por UF</option>
            <option value="month">Agrupar por Mes</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-500">Total Envios</p>
            <p className="text-lg font-bold text-slate-800">{records.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Frete</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalFreight)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total NF</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalNF)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">% Medio</p>
            <p className="text-lg font-bold text-slate-800">
              {totalNF > 0 ? ((totalFreight / totalNF) * 100).toFixed(2) : '0.00'}%
            </p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Sem dados para o periodo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">
                    {groupBy === 'carrier' ? 'Transportadora' : groupBy === 'client' ? 'Cliente' : groupBy === 'state' ? 'UF' : 'Mes'}
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600">Envios</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">Valor Frete</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600 hidden sm:table-cell">Valor NF</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600">% Frete</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600 hidden sm:table-cell">Atrasados</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([key, data]) => (
                  <tr key={key} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700 truncate max-w-[150px]">{key}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{data.count}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-medium">{formatCurrency(data.totalFreight)}</td>
                    <td className="py-2 px-3 text-right text-slate-600 hidden sm:table-cell">{formatCurrency(data.totalNF)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        data.avgPercentage <= 5 ? 'bg-green-100 text-green-700' :
                        data.avgPercentage <= 8 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {data.avgPercentage}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600 hidden sm:table-cell">
                      {data.delayed > 0 ? (
                        <span className="text-red-600 font-medium">{data.delayed}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
