import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Package, AlertTriangle, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface KPI {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  icon: any;
  description: string;
}

export function FreightIndicators() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const { data, error } = await supabase
        .from('freight_records')
        .select('*')
        .gte('shipment_date', startDate.toISOString().split('T')[0])
        .order('shipment_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (): KPI[] => {
    if (records.length === 0) return [];

    const totalRecords = records.length;
    const totalFreight = records.reduce((s, r) => s + (Number(r.freight_value) || 0), 0);
    const totalNF = records.reduce((s, r) => s + (Number(r.nf_value) || 0), 0);
    const avgFreightPercentage = totalNF > 0 ? (totalFreight / totalNF) * 100 : 0;

    const deliveredOnTime = records.filter(r => r.status === 'entregue_prazo').length;
    const inTransit = records.filter(r => r.status === 'em_transporte').length;
    const delayed = records.filter(r => r.status === 'atrasado' || r.status === 'entregue_atraso').length;

    const slaCompliance = totalRecords > 0 ? (deliveredOnTime / totalRecords) * 100 : 0;
    const delayRate = totalRecords > 0 ? (delayed / totalRecords) * 100 : 0;

    const avgWeight = records.reduce((s, r) => s + (Number(r.weight) || 0), 0) / totalRecords;
    const avgVolume = records.reduce((s, r) => s + (Number(r.volume) || 0), 0) / totalRecords;

    const freightPerKg = records.reduce((s, r) => s + (Number(r.weight) || 0), 0);
    const costPerKg = freightPerKg > 0 ? totalFreight / freightPerKg : 0;

    const delayedRecords = records.filter(r => r.delay_days && r.delay_days > 0);
    const avgDelay = delayedRecords.length > 0
      ? delayedRecords.reduce((s, r) => s + (r.delay_days || 0), 0) / delayedRecords.length
      : 0;

    return [
      {
        label: 'SLA Cumprido',
        value: `${slaCompliance.toFixed(1)}%`,
        trend: slaCompliance >= 80 ? 'up' : 'down',
        color: slaCompliance >= 80 ? 'emerald' : 'red',
        icon: Target,
        description: `${deliveredOnTime} de ${totalRecords} entregas no prazo`,
      },
      {
        label: '% Frete / NF',
        value: `${avgFreightPercentage.toFixed(2)}%`,
        trend: avgFreightPercentage <= 5 ? 'up' : 'down',
        color: avgFreightPercentage <= 5 ? 'emerald' : avgFreightPercentage <= 8 ? 'amber' : 'red',
        icon: Percent,
        description: 'Percentual medio do frete sobre valor NF',
      },
      {
        label: 'Taxa de Atraso',
        value: `${delayRate.toFixed(1)}%`,
        trend: delayRate <= 10 ? 'up' : 'down',
        color: delayRate <= 10 ? 'emerald' : delayRate <= 20 ? 'amber' : 'red',
        icon: AlertTriangle,
        description: `${delayed} entregas com atraso`,
      },
      {
        label: 'Custo por Kg',
        value: `R$ ${costPerKg.toFixed(2)}`,
        trend: 'neutral',
        color: 'blue',
        icon: Package,
        description: 'Custo medio de frete por quilograma',
      },
      {
        label: 'Media de Atraso',
        value: `${avgDelay.toFixed(1)} dias`,
        trend: avgDelay <= 1 ? 'up' : 'down',
        color: avgDelay <= 1 ? 'emerald' : 'orange',
        icon: Clock,
        description: 'Dias medios de atraso nas entregas atrasadas',
      },
      {
        label: 'Em Transito',
        value: String(inTransit),
        trend: 'neutral',
        color: 'blue',
        icon: TrendingUp,
        description: 'Envios atualmente em transito',
      },
      {
        label: 'Peso Medio',
        value: `${avgWeight.toFixed(1)} kg`,
        trend: 'neutral',
        color: 'slate',
        icon: Package,
        description: 'Peso medio por envio',
      },
      {
        label: 'Volume Medio',
        value: avgVolume.toFixed(1),
        trend: 'neutral',
        color: 'slate',
        icon: Package,
        description: 'Volumes medios por envio',
      },
    ];
  };

  const getCarrierPerformance = () => {
    const carriers: Record<string, { total: number; onTime: number; late: number; freight: number }> = {};

    records.forEach(r => {
      const name = r.carrier_name || 'Sem Transportadora';
      if (!carriers[name]) carriers[name] = { total: 0, onTime: 0, late: 0, freight: 0 };
      carriers[name].total++;
      carriers[name].freight += Number(r.freight_value) || 0;
      if (r.status === 'entregue_prazo') carriers[name].onTime++;
      if (r.status === 'atrasado' || r.status === 'entregue_atraso') carriers[name].late++;
    });

    return Object.entries(carriers)
      .map(([name, data]) => ({
        name,
        ...data,
        sla: data.total > 0 ? Math.round((data.onTime / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };



  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = calculateKPIs();
  const carrierPerformance = getCarrierPerformance();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Indicadores (KPIs)</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
          <option value="60">60 dias</option>
          <option value="90">90 dias</option>
        </select>
      </div>

      {kpis.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Sem dados para calcular indicadores</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${kpi.color}-100`}>
                      <Icon className={`w-4 h-4 text-${kpi.color}-700`} />
                    </div>
                    {kpi.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {kpi.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 mt-2">{kpi.value}</p>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-600 mt-0.5">{kpi.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{kpi.description}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Performance por Transportadora</h3>
            </div>
            {carrierPerformance.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sem dados de transportadoras</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Transportadora</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">Envios</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">No Prazo</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">Atrasados</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-600">SLA %</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600 hidden sm:table-cell">Valor Frete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierPerformance.map(carrier => (
                      <tr key={carrier.name} className="border-t border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-700">{carrier.name}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{carrier.total}</td>
                        <td className="py-2 px-3 text-center text-green-600 font-medium">{carrier.onTime}</td>
                        <td className="py-2 px-3 text-center text-red-600 font-medium">{carrier.late || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            carrier.sla >= 80 ? 'bg-green-100 text-green-700' :
                            carrier.sla >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {carrier.sla}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 hidden sm:table-cell">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(carrier.freight)}
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
    </div>
  );
}
