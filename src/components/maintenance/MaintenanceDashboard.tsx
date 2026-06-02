import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, ReferenceLine } from 'recharts';
import { AlertTriangle, Clock, DollarSign, CheckCircle2, Wrench, TrendingDown, TrendingUp, ShieldAlert } from 'lucide-react';
import type { MaintenanceOrder } from '../../types/maintenance';
import { supabase } from '../../lib/supabase';

interface Props {
  orders: MaintenanceOrder[];
}

const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#3b82f6', '#6b7280', '#ec4899', '#8b5cf6'];

const statusColors: Record<string, string> = {
  'Aberto': '#ef4444',
  'Em Andamento': '#f59e0b',
  'Aguardando Peça': '#3b82f6',
  'Concluído': '#10b981',
  'Cancelado': '#6b7280',
};

const faultColors: Record<string, string> = {
  'Elétrica': '#eab308',
  'Operacional': '#3b82f6',
  'Equipamento': '#f43f5e',
};

const originColors: Record<string, string> = {
  'Operação (erro humano/procedimento)': '#f59e0b',
  'Manutenção (execução/instalação)': '#3b82f6',
  'Projeto/Equipamento (defeito/desgaste)': '#ef4444',
};

export function MaintenanceDashboard({ orders }: Props) {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('maintenance_equipment')
      .select('id, name, sector, available_from, available_to, status')
      .eq('status', 0)
      .then(({ data }) => setEquipmentList(data || []));
  }, []);

  const availabilityChartData = useMemo(() => {
    return equipmentList
      .filter(eq => eq.available_from && eq.available_to)
      .map(eq => {
        const [hS, mS] = eq.available_from.split(':').map(Number);
        const [hE, mE] = eq.available_to.split(':').map(Number);
        const availableHours = Math.max(0, ((hE * 60 + mE) - (hS * 60 + mS)) / 60);
        const downtimeHours = orders
          .filter(o => o.equipment === eq.name)
          .reduce((sum, o) => sum + o.actual_downtime_hours, 0);
        const shortName = eq.name.length > 20 ? eq.name.substring(0, 20) + '...' : eq.name;
        return { name: shortName, fullName: eq.name, disponivel: parseFloat(availableHours.toFixed(1)), parada: parseFloat(downtimeHours.toFixed(1)) };
      })
      .sort((a, b) => b.disponivel - a.disponivel);
  }, [equipmentList, orders]);

  const availabilityTarget = useMemo(() => {
    if (availabilityChartData.length === 0) return 0;
    const total = availabilityChartData.reduce((s, d) => s + d.disponivel, 0);
    return parseFloat((total / availabilityChartData.length).toFixed(1));
  }, [availabilityChartData]);

  const availabilityPercentData = useMemo(() => {
    return availabilityChartData.map(d => {
      const total = d.disponivel;
      const paradaPct = total > 0 ? parseFloat(((d.parada / total) * 100).toFixed(1)) : 0;
      const disponivelPct = Math.max(0, parseFloat((100 - paradaPct).toFixed(1)));
      return { name: d.name, fullName: d.fullName, disponivel: disponivelPct, parada: paradaPct };
    }).sort((a, b) => b.disponivel - a.disponivel);
  }, [availabilityChartData]);

  const percentTarget = 85;

  const sectorOrdersData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.location) {
        counts[o.location] = (counts[o.location] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.length > 18 ? name.substring(0, 18) + '...' : name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const sectorAvailabilityData = useMemo(() => {
    const sectors: Record<string, { disponivel: number; indisponivel: number }> = {};
    equipmentList.forEach(eq => {
      if (!eq.sector || !eq.available_from || !eq.available_to) return;
      const [hS, mS] = eq.available_from.split(':').map(Number);
      const [hE, mE] = eq.available_to.split(':').map(Number);
      const availableHours = Math.max(0, ((hE * 60 + mE) - (hS * 60 + mS)) / 60);
      const downtimeHours = orders
        .filter(o => o.equipment === eq.name)
        .reduce((sum, o) => sum + o.actual_downtime_hours, 0);
      if (!sectors[eq.sector]) sectors[eq.sector] = { disponivel: 0, indisponivel: 0 };
      sectors[eq.sector].disponivel += availableHours;
      sectors[eq.sector].indisponivel += downtimeHours;
    });
    return Object.entries(sectors)
      .map(([name, data]) => ({
        name: name.length > 18 ? name.substring(0, 18) + '...' : name,
        fullName: name,
        disponivel: parseFloat(data.disponivel.toFixed(1)),
        indisponivel: parseFloat(data.indisponivel.toFixed(1)),
      }))
      .sort((a, b) => b.disponivel - a.disponivel);
  }, [equipmentList, orders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const open = orders.filter(o => o.status === 'Aberto').length;
    const inProgress = orders.filter(o => o.status === 'Em Andamento').length;
    const completed = orders.filter(o => o.status === 'Concluído').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

    const completedOrders = orders.filter(o => o.status === 'Concluído' && o.started_at && o.completed_at);
    let avgResolutionHours = 0;
    if (completedOrders.length > 0) {
      const totalHours = completedOrders.reduce((sum, o) => {
        const start = new Date(o.started_at!).getTime();
        const end = new Date(o.completed_at!).getTime();
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = totalHours / completedOrders.length;
    }

    const totalCost = orders.reduce((sum, o) => sum + o.actual_cost, 0);
    const totalDowntime = orders.reduce((sum, o) => sum + o.actual_downtime_hours, 0);

    const critical = orders.filter(o => o.priority === 'Crítica' && o.status !== 'Concluído' && o.status !== 'Cancelado').length;

    return { total, open, inProgress, completed, completionRate, avgResolutionHours, totalCost, totalDowntime, critical };
  }, [orders]);

  const equipmentRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.equipment) counts[o.equipment] = (counts[o.equipment] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { most: null, least: null };
    return {
      most: { name: entries[0][0], count: entries[0][1] },
      least: { name: entries[entries.length - 1][0], count: entries[entries.length - 1][1] },
    };
  }, [orders]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: statusColors[name] || '#6b7280' }));
  }, [orders]);

  const faultData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.fault_type] = (counts[o.fault_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: faultColors[name] || '#6b7280' }));
  }, [orders]);

  const originData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.problem_origin] = (counts[o.problem_origin] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.split('(')[0].trim(),
      fullName: name,
      value,
      fill: originColors[name] || '#6b7280',
    }));
  }, [orders]);

  const priorityData = useMemo(() => {
    const priorities = ['Baixa', 'Média', 'Alta', 'Crítica'];
    const pColors = ['#0d9488', '#f59e0b', '#f97316', '#ef4444'];
    return priorities.map((name, i) => ({
      name,
      value: orders.filter(o => o.priority === name).length,
      fill: pColors[i],
    }));
  }, [orders]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { opened: number; closed: number }> = {};
    orders.forEach(o => {
      const month = o.created_at.slice(0, 7);
      if (!months[month]) months[month] = { opened: 0, closed: 0 };
      months[month].opened++;
      if (o.status === 'Concluído' && o.completed_at) {
        const closedMonth = o.completed_at.slice(0, 7);
        if (!months[closedMonth]) months[closedMonth] = { opened: 0, closed: 0 };
        months[closedMonth].closed++;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        ...data,
      }));
  }, [orders]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const kpis = [
    { label: 'Total de Chamados', value: stats.total, icon: Wrench, color: 'from-teal-500 to-teal-600' },
    { label: 'Abertos', value: stats.open + stats.inProgress, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
    { label: 'Criticos Pendentes', value: stats.critical, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
    { label: 'Taxa de Conclusao', value: `${stats.completionRate}%`, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Tempo Medio Resolucao', value: `${stats.avgResolutionHours.toFixed(1)}h`, icon: Clock, color: 'from-sky-500 to-blue-600' },
    { label: 'Custo Total', value: formatCurrency(stats.totalCost), icon: DollarSign, color: 'from-rose-500 to-pink-600' },
    { label: 'Downtime Total', value: `${stats.totalDowntime.toFixed(1)}h`, icon: TrendingDown, color: 'from-slate-500 to-slate-600' },
    { label: 'Concluidos', value: stats.completed, icon: CheckCircle2, color: 'from-teal-600 to-cyan-600' },
  ];

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum chamado registrado ainda.</p>
        <p className="text-sm text-gray-400 mt-1">Crie um chamado para ver os indicadores aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.color} opacity-10 rounded-bl-[3rem]`} />
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {equipmentRanking.most && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 opacity-10 rounded-bl-[3rem]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Maquina com Mais Defeitos</p>
                <p className="text-sm font-bold text-gray-900 truncate">{equipmentRanking.most.name}</p>
                <p className="text-xs text-red-600 font-semibold">{equipmentRanking.most.count} chamado{equipmentRanking.most.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10 rounded-bl-[3rem]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Maquina com Menos Defeitos</p>
                <p className="text-sm font-bold text-gray-900 truncate">{equipmentRanking.least!.name}</p>
                <p className="text-xs text-emerald-600 font-semibold">{equipmentRanking.least!.count} chamado{equipmentRanking.least!.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {availabilityChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Disponibilidade vs Horas Paradas por Maquina</h3>
            <p className="text-xs text-gray-400 mb-4">Linha de meta = media de disponibilidade ({availabilityTarget}h)</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={availabilityChartData} margin={{ top: 20, right: 10, bottom: 40, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip formatter={(value: any, name: string) => [`${value}h`, name === 'disponivel' ? 'Horas Disponiveis' : 'Horas Paradas']} labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label} />
                <Legend formatter={(value: string) => value === 'disponivel' ? 'Horas Disponiveis' : 'Horas Paradas'} />
                <Bar dataKey="disponivel" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="parada" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                <ReferenceLine y={availabilityTarget} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" label={{ value: `Meta ${availabilityTarget}h`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Disponibilidade por Maquina (%)</h3>
            <p className="text-xs text-gray-400 mb-4">Meta de disponibilidade = {percentTarget}%</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={availabilityPercentData} margin={{ top: 20, right: 10, bottom: 40, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(value: any, name: string) => [`${value}%`, name === 'disponivel' ? '% Disponivel' : '% Parada']} labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label} />
                <Legend formatter={(value: string) => value === 'disponivel' ? '% Disponivel' : '% Parada'} />
                <Bar dataKey="disponivel" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} stackId="stack" />
                <Bar dataKey="parada" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} stackId="stack" />
                <ReferenceLine y={percentTarget} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" label={{ value: `Meta ${percentTarget}%`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(sectorOrdersData.length > 0 || sectorAvailabilityData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sectorOrdersData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-1">Ordens de Servico por Setor</h3>
              <p className="text-xs text-gray-400 mb-4">Setores com mais chamados abertos</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorOrdersData} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} height={60} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(value: any) => [value, 'Chamados']} labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label} />
                  <Bar dataKey="value" name="Chamados" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={28}>
                    {sectorOrdersData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {sectorAvailabilityData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-1">Horas por Setor (Disponivel vs Indisponivel)</h3>
              <p className="text-xs text-gray-400 mb-4">Total de horas disponiveis e indisponiveis por setor</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorAvailabilityData} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} height={60} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} unit="h" />
                  <Tooltip formatter={(value: any, name: string) => [`${value}h`, name === 'disponivel' ? 'Horas Disponiveis' : 'Horas Indisponiveis']} labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label} />
                  <Legend formatter={(value: string) => value === 'disponivel' ? 'Horas Disponiveis' : 'Horas Indisponiveis'} />
                  <Bar dataKey="disponivel" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="indisponivel" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Tendencia Mensal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opened" name="Abertos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="closed" name="Concluidos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Distribuicao por Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Tipo de Falha (O que quebrou)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={faultData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" name="Chamados" radius={[0, 6, 6, 0]} barSize={28}>
                {faultData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Origem do Problema (Por que quebrou)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={originData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(value: any, _: any, props: any) => [value, props.payload.fullName]} />
              <Bar dataKey="value" name="Chamados" radius={[0, 6, 6, 0]} barSize={28}>
                {originData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Distribuicao por Prioridade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Chamados" radius={[6, 6, 0, 0]} barSize={50}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}