import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Package, Users, TrendingUp, MapPin, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExpeditionRecord {
  id: string;
  order_code: string;
  boxes: number;
  order_date: string | null;
  shipped_date: string | null;
  shipped_by: string | null;
  state: string | null;
  city: string | null;
}

interface OperatorStats {
  name: string;
  totalOrders: number;
  totalBoxes: number;
  avgBoxesPerOrder: number;
}

export function ExpeditionDashboard() {
  const [records, setRecords] = useState<ExpeditionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | '30' | '90' | '180'>('all');

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expedition_records')
      .select('id, order_code, boxes, order_date, shipped_date, shipped_by, state, city')
      .order('shipped_date', { ascending: false });
    if (!error && data) setRecords(data);
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    if (period === 'all') return records;
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return records.filter(r => r.shipped_date && r.shipped_date >= cutoffStr);
  }, [records, period]);

  const operatorStats = useMemo((): OperatorStats[] => {
    const map: Record<string, { orders: number; boxes: number }> = {};
    filteredRecords.forEach(r => {
      if (!r.shipped_by) return;
      const name = r.shipped_by.toLowerCase();
      if (!map[name]) map[name] = { orders: 0, boxes: 0 };
      map[name].orders += 1;
      map[name].boxes += r.boxes || 0;
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        totalOrders: d.orders,
        totalBoxes: d.boxes,
        avgBoxesPerOrder: d.orders > 0 ? Math.round(d.boxes / d.orders) : 0,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [filteredRecords]);

  const stateStats = useMemo(() => {
    const map: Record<string, { orders: number; boxes: number }> = {};
    filteredRecords.forEach(r => {
      const st = r.state || 'N/A';
      if (!map[st]) map[st] = { orders: 0, boxes: 0 };
      map[st].orders += 1;
      map[st].boxes += r.boxes || 0;
    });
    return Object.entries(map)
      .map(([state, d]) => ({ state, orders: d.orders, boxes: d.boxes }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [filteredRecords]);

  const monthlyStats = useMemo(() => {
    const map: Record<string, { orders: number; boxes: number }> = {};
    filteredRecords.forEach(r => {
      if (!r.shipped_date) return;
      const month = r.shipped_date.substring(0, 7);
      if (!map[month]) map[month] = { orders: 0, boxes: 0 };
      map[month].orders += 1;
      map[month].boxes += r.boxes || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, d]) => ({
        month,
        label: new Date(month + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        orders: d.orders,
        boxes: d.boxes,
      }));
  }, [filteredRecords]);

  const totalOrders = filteredRecords.length;
  const totalBoxes = filteredRecords.reduce((s, r) => s + (r.boxes || 0), 0);
  const totalOperators = operatorStats.length;
  const avgBoxesPerOrder = totalOrders > 0 ? Math.round(totalBoxes / totalOrders) : 0;
  const maxOperatorOrders = operatorStats.length > 0 ? operatorStats[0].totalOrders : 1;
  const maxOperatorBoxes = Math.max(...operatorStats.map(o => o.totalBoxes), 1);
  const maxStateOrders = stateStats.length > 0 ? stateStats[0].orders : 1;
  const maxMonthlyOrders = Math.max(...monthlyStats.map(m => m.orders), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Dashboard de Expedicao
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhamento de desempenho e KPIs</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([['all', 'Todos'], ['30', '30d'], ['90', '90d'], ['180', '180d']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === val ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Pedidos</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalOrders.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Caixas</p>
          </div>
          <p className="text-3xl font-bold text-teal-700">{totalBoxes.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Operadores</p>
          </div>
          <p className="text-3xl font-bold text-amber-700">{totalOperators}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Media Cx/Pedido</p>
          </div>
          <p className="text-3xl font-bold text-rose-700">{avgBoxesPerOrder}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Ranking por Pedidos Expedidos
          </h3>
          <div className="space-y-3">
            {operatorStats.map((op, idx) => {
              const pct = (op.totalOrders / maxOperatorOrders) * 100;
              return (
                <div key={op.name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{op.name}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-700">{op.totalOrders}</span>
                  </div>
                  <div className="ml-8 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            Ranking por Caixas Expedidas
          </h3>
          <div className="space-y-3">
            {operatorStats
              .slice()
              .sort((a, b) => b.totalBoxes - a.totalBoxes)
              .map((op, idx) => {
                const pct = (op.totalBoxes / maxOperatorBoxes) * 100;
                return (
                  <div key={op.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{op.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">({op.avgBoxesPerOrder} cx/ped)</span>
                        <span className="text-sm font-bold text-teal-700">{op.totalBoxes.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="ml-8 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Evolucao Mensal
          </h3>
          {monthlyStats.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Sem dados para o periodo selecionado</p>
          ) : (
            <div className="space-y-2">
              {monthlyStats.map(m => {
                const pct = (m.orders / maxMonthlyOrders) * 100;
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 text-right font-medium">{m.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {m.orders} ped / {m.boxes} cx
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Top 10 Estados por Envios
          </h3>
          {stateStats.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Sem dados para o periodo selecionado</p>
          ) : (
            <div className="space-y-2.5">
              {stateStats.map(s => {
                const pct = (s.orders / maxStateOrders) * 100;
                return (
                  <div key={s.state} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 w-8">{s.state}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-gray-700">
                        {s.orders} pedidos / {s.boxes.toLocaleString('pt-BR')} cx
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">Detalhamento por Operador</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Operador</th>
                <th className="px-4 py-3 text-center font-semibold">Pedidos</th>
                <th className="px-4 py-3 text-center font-semibold">Caixas</th>
                <th className="px-4 py-3 text-center font-semibold">Media Cx/Pedido</th>
                <th className="px-4 py-3 text-right font-semibold">% do Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {operatorStats.map((op, idx) => (
                <tr key={op.name} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{op.name}</td>
                  <td className="px-4 py-3 text-center font-medium">{op.totalOrders}</td>
                  <td className="px-4 py-3 text-center">{op.totalBoxes.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-center">{op.avgBoxesPerOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                      {totalOrders > 0 ? ((op.totalOrders / totalOrders) * 100).toFixed(1) : '0'}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-gray-800">
                <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                <td className="px-4 py-3 text-center">{totalOrders}</td>
                <td className="px-4 py-3 text-center">{totalBoxes.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-center">{avgBoxesPerOrder}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                    100%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
