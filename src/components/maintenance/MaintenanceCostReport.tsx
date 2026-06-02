import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, Filter, Loader2, DollarSign, Wrench, MapPin, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderData {
  id: string;
  order_number: string;
  title: string;
  location: string;
  equipment: string;
  estimated_cost: number;
  actual_cost: number;
  maintenance_type: string;
  status: string;
  actual_downtime_hours: number;
  created_at: string;
  completed_at: string | null;
}

interface SectorCost {
  sector: string;
  totalEstimated: number;
  totalActual: number;
  orderCount: number;
  totalDowntime: number;
  avgCostPerOrder: number;
}

export function MaintenanceCostReport() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [startDate, endDate, filterType]);

  const loadData = async () => {
    setLoading(true);
    let query = supabase
      .from('maintenance_orders')
      .select('id, order_number, title, location, equipment, estimated_cost, actual_cost, maintenance_type, status, actual_downtime_hours, created_at, completed_at')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (filterType) {
      query = query.eq('maintenance_type', filterType);
    }

    const { data, error } = await query;
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const sectorData = useMemo((): SectorCost[] => {
    const map: Record<string, { estimated: number; actual: number; count: number; downtime: number }> = {};
    orders.forEach(o => {
      const sector = o.location || 'Sem setor';
      if (!map[sector]) map[sector] = { estimated: 0, actual: 0, count: 0, downtime: 0 };
      map[sector].estimated += o.estimated_cost || 0;
      map[sector].actual += o.actual_cost || 0;
      map[sector].count += 1;
      map[sector].downtime += o.actual_downtime_hours || 0;
    });

    return Object.entries(map)
      .map(([sector, d]) => ({
        sector,
        totalEstimated: d.estimated,
        totalActual: d.actual,
        orderCount: d.count,
        totalDowntime: d.downtime,
        avgCostPerOrder: d.count > 0 ? d.actual / d.count : 0,
      }))
      .sort((a, b) => b.totalActual - a.totalActual);
  }, [orders]);

  const totalActual = sectorData.reduce((s, d) => s + d.totalActual, 0);
  const totalEstimated = sectorData.reduce((s, d) => s + d.totalEstimated, 0);
  const totalOrders = orders.length;
  const totalDowntime = sectorData.reduce((s, d) => s + d.totalDowntime, 0);
  const maxActual = Math.max(...sectorData.map(d => d.totalActual), 1);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportCSV = () => {
    const headers = ['Setor', 'Qtd OS', 'Custo Estimado', 'Custo Real', 'Horas Parada', 'Custo Medio/OS'];
    const rows = sectorData.map(d => [
      d.sector, d.orderCount, d.totalEstimated.toFixed(2), d.totalActual.toFixed(2),
      d.totalDowntime.toFixed(1), d.avgCostPerOrder.toFixed(2)
    ]);
    rows.push(['TOTAL', totalOrders.toString(), totalEstimated.toFixed(2), totalActual.toFixed(2), totalDowntime.toFixed(1), (totalOrders > 0 ? totalActual / totalOrders : 0).toFixed(2)]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custo_manutencao_setor_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            Relatorios de Manutencao
          </h1>
          <p className="text-gray-500 mt-1">Custo de manutencao por setor</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Periodo:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <span className="text-gray-400">ate</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Preventiva">Preventiva</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total OS</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Custo Estimado</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalEstimated)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Custo Real</p>
          </div>
          <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalActual)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Horas Parada</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalDowntime.toFixed(1)}h</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-600" />
          Custo por Setor
        </h3>
        {sectorData.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Nenhum dado encontrado para o periodo selecionado.</p>
        ) : (
          <div className="space-y-3">
            {sectorData.map(d => {
              const pct = maxActual > 0 ? (d.totalActual / maxActual) * 100 : 0;
              const pctOfTotal = totalActual > 0 ? (d.totalActual / totalActual) * 100 : 0;
              return (
                <div key={d.sector} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{d.sector}</span>
                      <span className="text-xs text-gray-400">({d.orderCount} OS)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{pctOfTotal.toFixed(1)}% do total</span>
                      <span className="text-sm font-bold text-teal-700">{formatCurrency(d.totalActual)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>Estimado: {formatCurrency(d.totalEstimated)}</span>
                    <span>Media/OS: {formatCurrency(d.avgCostPerOrder)}</span>
                    <span>Parada: {d.totalDowntime.toFixed(1)}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">Detalhamento por Setor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Setor</th>
                <th className="px-4 py-3 text-center font-semibold">Qtd OS</th>
                <th className="px-4 py-3 text-right font-semibold">Custo Estimado</th>
                <th className="px-4 py-3 text-right font-semibold">Custo Real</th>
                <th className="px-4 py-3 text-right font-semibold">Variacao</th>
                <th className="px-4 py-3 text-right font-semibold">Horas Parada</th>
                <th className="px-4 py-3 text-right font-semibold">Custo Medio/OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sectorData.map(d => {
                const variation = d.totalEstimated > 0
                  ? ((d.totalActual - d.totalEstimated) / d.totalEstimated * 100)
                  : 0;
                return (
                  <tr key={d.sector} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.sector}</td>
                    <td className="px-4 py-3 text-center">{d.orderCount}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(d.totalEstimated)}</td>
                    <td className="px-4 py-3 text-right font-medium text-teal-700">{formatCurrency(d.totalActual)}</td>
                    <td className="px-4 py-3 text-right">
                      {d.totalEstimated > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          variation > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.totalDowntime.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(d.avgCostPerOrder)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-gray-800">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-center">{totalOrders}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totalEstimated)}</td>
                <td className="px-4 py-3 text-right text-teal-700">{formatCurrency(totalActual)}</td>
                <td className="px-4 py-3 text-right">
                  {totalEstimated > 0 ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      (totalActual - totalEstimated) > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {((totalActual - totalEstimated) / totalEstimated * 100).toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right">{totalDowntime.toFixed(1)}h</td>
                <td className="px-4 py-3 text-right">{totalOrders > 0 ? formatCurrency(totalActual / totalOrders) : '-'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
