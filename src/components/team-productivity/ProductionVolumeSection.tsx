import { useMemo } from 'react';
import {
  Factory, Target, Calendar, TrendingUp, BarChart3, Package,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Cell, Area, AreaChart
} from 'recharts';

interface ProductionVolumeData {
  capacidadeDia: number;
  metaMensal: number;
  metaDiaria: number;
  diasUteis: number;
  ritmoAtualVolume: number;
  ritmoAtualPorcentagem: number;
  totalRealizado: number;
  totalPlanejado: number;
  dailyAdherence: { date: string; label: string; planejado: number; realizado: number }[];
  allDates: string[];
  totalByDay: { date: string; [key: string]: number | string }[];
  sections: { section_key: string; title: string; total: number; dailyData: { date: string; value: number }[] }[];
}

interface ProductionVolumeSectionProps {
  data: ProductionVolumeData;
}

export function ProductionVolumeSection({ data }: ProductionVolumeSectionProps) {
  const metrics = useMemo(() => {
    const {
      capacidadeDia, metaMensal, metaDiaria, diasUteis,
      ritmoAtualVolume, ritmoAtualPorcentagem,
      totalRealizado, totalPlanejado, dailyAdherence,
      allDates, totalByDay, sections
    } = data;

    const capacidadeMensal = capacidadeDia * diasUteis;
    const utilizacao = capacidadeMensal > 0 ? (totalRealizado / capacidadeMensal) * 100 : 0;
    const atingimentoMeta = metaMensal > 0 ? (totalRealizado / metaMensal) * 100 : 0;
    const gapMeta = totalRealizado - metaMensal;
    const diasTrabalhados = dailyAdherence.filter(d => d.realizado > 0).length;
    const mediaRealizadaDia = diasTrabalhados > 0 ? totalRealizado / diasTrabalhados : 0;
    const diasRestantes = Math.max(0, diasUteis - diasTrabalhados);
    const projecaoFinal = totalRealizado + (mediaRealizadaDia * diasRestantes);
    const projecaoVsMeta = metaMensal > 0 ? (projecaoFinal / metaMensal) * 100 : 0;

    const dailyVolume = allDates.map((date, idx) => {
      const dayData = totalByDay[idx];
      if (!dayData) return null;
      const total = sections.reduce((sum, sec) => sum + (Number(dayData[sec.section_key]) || 0), 0);
      return {
        date,
        label: date.slice(5).replace('-', '/'),
        volume: total,
      };
    }).filter(Boolean) as { date: string; label: string; volume: number }[];

    let acumRealizado = 0;
    const cumulativeData = dailyAdherence
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d, idx) => {
        acumRealizado += d.realizado;
        const metaAcumulada = metaDiaria * (idx + 1);
        const capacidadeAcumulada = capacidadeDia * (idx + 1);
        return {
          date: d.date,
          label: d.label,
          realizado: acumRealizado,
          meta: metaAcumulada,
          capacidade: capacidadeAcumulada,
        };
      });

    if (diasRestantes > 0 && cumulativeData.length > 0) {
      const lastEntry = cumulativeData[cumulativeData.length - 1];
      const projDay = {
        date: 'proj',
        label: 'Proj. Final',
        realizado: projecaoFinal,
        meta: metaMensal,
        capacidade: capacidadeMensal,
      };
      cumulativeData.push({ ...lastEntry, label: lastEntry.label });
      cumulativeData[cumulativeData.length - 1] = projDay;
    }

    return {
      capacidadeDia,
      capacidadeMensal,
      metaMensal,
      metaDiaria,
      diasUteis,
      totalRealizado,
      utilizacao,
      atingimentoMeta,
      gapMeta,
      diasTrabalhados,
      diasRestantes,
      mediaRealizadaDia,
      projecaoFinal,
      projecaoVsMeta,
      dailyVolume,
      cumulativeData,
      ritmoAtualVolume,
      ritmoAtualPorcentagem,
    };
  }, [data]);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 border border-blue-700/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Analise de Volume de Producao</h3>
            <p className="text-xs text-blue-300/70">Capacidade, Metas e Realizacao</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <VolumeCard
            icon={<Factory className="w-4 h-4" />}
            label="Capacidade/Dia"
            value={fmt(metrics.capacidadeDia)}
            color="sky"
          />
          <VolumeCard
            icon={<Factory className="w-4 h-4" />}
            label="Capacidade Mensal"
            value={fmt(metrics.capacidadeMensal)}
            sub={`${metrics.diasUteis} dias uteis`}
            color="sky"
          />
          <VolumeCard
            icon={<Target className="w-4 h-4" />}
            label="Meta Mensal"
            value={fmt(metrics.metaMensal)}
            color="amber"
          />
          <VolumeCard
            icon={<Target className="w-4 h-4" />}
            label="Meta Diaria"
            value={fmt(metrics.metaDiaria)}
            color="amber"
          />
          <VolumeCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Total Realizado"
            value={fmt(metrics.totalRealizado)}
            sub={`${metrics.atingimentoMeta.toFixed(1)}% da meta`}
            color={metrics.atingimentoMeta >= 100 ? 'emerald' : metrics.atingimentoMeta >= 80 ? 'amber' : 'red'}
          />
          <VolumeCard
            icon={<Clock className="w-4 h-4" />}
            label="Media/Dia Realizada"
            value={fmt(metrics.mediaRealizadaDia)}
            sub={`${metrics.diasTrabalhados} dias trab.`}
            color="teal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricHighlight
          icon={<ArrowUpRight className="w-4 h-4" />}
          label="Utilizacao da Capacidade"
          value={`${metrics.utilizacao.toFixed(1)}%`}
          description={`${fmt(metrics.totalRealizado)} de ${fmt(metrics.capacidadeMensal)}`}
          color={metrics.utilizacao >= 80 ? 'emerald' : metrics.utilizacao >= 60 ? 'amber' : 'red'}
        />
        <MetricHighlight
          icon={metrics.gapMeta >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          label="Gap vs Meta Mensal"
          value={`${metrics.gapMeta >= 0 ? '+' : ''}${fmt(metrics.gapMeta)}`}
          description={metrics.gapMeta >= 0 ? 'Acima da meta' : 'Abaixo da meta'}
          color={metrics.gapMeta >= 0 ? 'emerald' : 'red'}
        />
        <MetricHighlight
          icon={<TrendingUp className="w-4 h-4" />}
          label="Projecao Final"
          value={fmt(metrics.projecaoFinal)}
          description={metrics.diasRestantes > 0 ? `${metrics.diasRestantes} dias restantes` : 'Mes completo'}
          color={metrics.projecaoVsMeta >= 100 ? 'emerald' : metrics.projecaoVsMeta >= 90 ? 'amber' : 'red'}
        />
        <MetricHighlight
          icon={<Calendar className="w-4 h-4" />}
          label="Dias Trabalhados"
          value={`${metrics.diasTrabalhados} / ${metrics.diasUteis}`}
          description={`${metrics.diasRestantes} dias restantes`}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {metrics.cumulativeData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Realizado Acumulado vs Meta vs Capacidade</h3>
            <p className="text-xs text-gray-400 mb-4">Evolucao acumulada comparando producao, meta e capacidade</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={metrics.cumulativeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="realizadoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(val: number, name: string) => [val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="realizado"
                  name="Realizado Acum."
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#realizadoGrad)"
                  activeDot={{ r: 4, fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="meta"
                  name="Meta Acum."
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="capacidade"
                  name="Capacidade Acum."
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {metrics.dailyVolume.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Volume Diario de Producao</h3>
            <p className="text-xs text-gray-400 mb-4">Volume produzido por dia com referencia de meta e capacidade</p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={metrics.dailyVolume} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(val: number, name: string) => [val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {metrics.metaDiaria > 0 && (
                  <ReferenceLine
                    y={metrics.metaDiaria}
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    label={{ value: `Meta: ${fmt(metrics.metaDiaria)}`, position: 'right', fill: '#EF4444', fontSize: 9 }}
                  />
                )}
                {metrics.capacidadeDia > 0 && (
                  <ReferenceLine
                    y={metrics.capacidadeDia}
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    label={{ value: `Cap.: ${fmt(metrics.capacidadeDia)}`, position: 'right', fill: '#94A3B8', fontSize: 9 }}
                  />
                )}
                <Bar dataKey="volume" name="Volume Dia" radius={[4, 4, 0, 0]}>
                  {metrics.dailyVolume.map((entry, idx) => {
                    let fill = '#3B82F6';
                    if (metrics.metaDiaria > 0) {
                      fill = entry.volume >= metrics.metaDiaria ? '#10B981' : entry.volume >= metrics.metaDiaria * 0.8 ? '#F59E0B' : '#EF4444';
                    }
                    return <Cell key={idx} fill={fill} opacity={0.85} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {metrics.ritmoAtualVolume > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Ritmo Atual de Producao</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Ritmo Atual (Vol.)</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(metrics.ritmoAtualVolume)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Ritmo Atual (%)</p>
              <p className={`text-2xl font-bold ${metrics.ritmoAtualPorcentagem >= 100 ? 'text-emerald-700' : metrics.ritmoAtualPorcentagem >= 80 ? 'text-amber-700' : 'text-red-700'}`}>
                {metrics.ritmoAtualPorcentagem.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Projecao vs Meta</p>
              <p className={`text-2xl font-bold ${metrics.projecaoVsMeta >= 100 ? 'text-emerald-700' : metrics.projecaoVsMeta >= 90 ? 'text-amber-700' : 'text-red-700'}`}>
                {metrics.projecaoVsMeta.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Progresso da Meta Mensal</span>
              <span>{metrics.atingimentoMeta.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metrics.atingimentoMeta >= 100 ? 'bg-emerald-500' :
                  metrics.atingimentoMeta >= 80 ? 'bg-blue-500' :
                  metrics.atingimentoMeta >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.atingimentoMeta, 100)}%` }}
              />
              {metrics.diasUteis > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-800"
                  style={{ left: `${Math.min((metrics.diasTrabalhados / metrics.diasUteis) * 100, 100)}%` }}
                  title={`Dia ${metrics.diasTrabalhados} de ${metrics.diasUteis}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
              <span>0</span>
              <span>{fmt(metrics.metaMensal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VolumeCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colorMap: Record<string, { iconBg: string; iconText: string; valueText: string }> = {
    sky: { iconBg: 'bg-sky-500/20', iconText: 'text-sky-300', valueText: 'text-sky-200' },
    amber: { iconBg: 'bg-amber-500/20', iconText: 'text-amber-300', valueText: 'text-amber-200' },
    emerald: { iconBg: 'bg-emerald-500/20', iconText: 'text-emerald-300', valueText: 'text-emerald-200' },
    teal: { iconBg: 'bg-teal-500/20', iconText: 'text-teal-300', valueText: 'text-teal-200' },
    red: { iconBg: 'bg-red-500/20', iconText: 'text-red-300', valueText: 'text-red-200' },
  };
  const c = colorMap[color] || colorMap.sky;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
      <div className={`w-7 h-7 ${c.iconBg} rounded-lg flex items-center justify-center mx-auto mb-2 ${c.iconText}`}>
        {icon}
      </div>
      <p className="text-[10px] text-blue-200/60 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${c.valueText}`}>{value}</p>
      {sub && <p className="text-[10px] text-blue-300/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function MetricHighlight({ icon, label, value, description, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', iconBg: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl px-4 py-3.5 flex items-center gap-3`}>
      <div className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        <p className="text-[10px] text-gray-400">{description}</p>
      </div>
    </div>
  );
}
