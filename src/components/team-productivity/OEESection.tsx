import { useMemo } from 'react';
import {
  Gauge, Clock, Zap, ShieldCheck, TrendingUp, TrendingDown, Minus, AlertCircle
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Cell, RadialBarChart, RadialBar
} from 'recharts';

interface OEEData {
  totalPlanejado: number;
  totalRealizado: number;
  totalRefugo: number;
  totalDays: number;
  diasUteis: number;
  oeeTarget: number;
  capacidadeDia: number;
  dailyAdherence: { date: string; label: string; planejado: number; realizado: number }[];
  dailyQuality: { date: string; label: string; refugo: number; realizado: number }[];
}

interface OEESectionProps {
  data: OEEData;
}

function getOEEColor(value: number): string {
  if (value >= 85) return '#10B981';
  if (value >= 65) return '#F59E0B';
  return '#EF4444';
}

function getOEELabel(value: number): string {
  if (value >= 85) return 'Classe Mundial';
  if (value >= 75) return 'Bom';
  if (value >= 65) return 'Aceitavel';
  return 'Necessita Melhoria';
}

function getOEEBgClass(value: number): string {
  if (value >= 85) return 'bg-emerald-50 border-emerald-200';
  if (value >= 65) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getOEETextClass(value: number): string {
  if (value >= 85) return 'text-emerald-700';
  if (value >= 65) return 'text-amber-700';
  return 'text-red-700';
}

export function OEESection({ data }: OEESectionProps) {
  const oeeMetrics = useMemo(() => {
    const {
      totalPlanejado, totalRealizado, totalRefugo,
      totalDays, diasUteis, oeeTarget, capacidadeDia,
      dailyAdherence, dailyQuality
    } = data;

    const daysProduced = dailyAdherence.filter(d => d.realizado > 0).length;
    const disponibilidade = diasUteis > 0 ? (daysProduced / diasUteis) * 100 : 0;
    const desempenho = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
    const qualidade = totalRealizado > 0 ? ((totalRealizado - totalRefugo) / totalRealizado) * 100 : 0;
    const oee = (disponibilidade / 100) * (desempenho / 100) * (qualidade / 100) * 100;

    const capacidadeTotal = capacidadeDia * diasUteis;
    const producaoEfetiva = totalRealizado - totalRefugo;
    const perdaDisponibilidade = capacidadeTotal > 0 ? ((diasUteis - daysProduced) / diasUteis) * capacidadeTotal : 0;
    const perdaDesempenho = totalPlanejado > 0 ? totalPlanejado - totalRealizado : 0;
    const perdaQualidade = totalRefugo;

    const dailyOEE = dailyAdherence.map(adh => {
      const qEntry = dailyQuality.find(q => q.date === adh.date);
      const dayDisp = 100;
      const dayDesemp = adh.planejado > 0 ? (adh.realizado / adh.planejado) * 100 : 0;
      const dayRefugo = qEntry?.refugo || 0;
      const dayQual = adh.realizado > 0 ? ((adh.realizado - dayRefugo) / adh.realizado) * 100 : 100;
      const dayOEE = (dayDisp / 100) * (dayDesemp / 100) * (dayQual / 100) * 100;

      return {
        date: adh.date,
        label: adh.label,
        oee: Math.min(dayOEE, 150),
        desempenho: Math.min(dayDesemp, 150),
        qualidade: Math.min(dayQual, 100),
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    return {
      disponibilidade: Math.min(disponibilidade, 100),
      desempenho: Math.min(desempenho, 150),
      qualidade: Math.min(qualidade, 100),
      oee: Math.min(oee, 100),
      oeeTarget,
      daysProduced,
      diasUteis,
      producaoEfetiva,
      perdaDisponibilidade: Math.max(perdaDisponibilidade, 0),
      perdaDesempenho: Math.max(perdaDesempenho, 0),
      perdaQualidade: Math.max(perdaQualidade, 0),
      dailyOEE,
    };
  }, [data]);

  const gaugeData = [
    { name: 'OEE', value: oeeMetrics.oee, fill: getOEEColor(oeeMetrics.oee) },
  ];

  const waterfallData = [
    { name: 'Disponib.', value: oeeMetrics.disponibilidade, fill: '#3B82F6' },
    { name: 'Desempenho', value: oeeMetrics.desempenho > 100 ? 100 : oeeMetrics.desempenho, fill: '#F59E0B' },
    { name: 'Qualidade', value: oeeMetrics.qualidade, fill: '#10B981' },
    { name: 'OEE', value: oeeMetrics.oee, fill: getOEEColor(oeeMetrics.oee) },
  ];

  const lossData = [
    { name: 'Perda Disponib.', value: oeeMetrics.perdaDisponibilidade, fill: '#93C5FD' },
    { name: 'Perda Desempenho', value: oeeMetrics.perdaDesempenho, fill: '#FCD34D' },
    { name: 'Perda Qualidade', value: oeeMetrics.perdaQualidade, fill: '#FCA5A5' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Gauge className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">OEE - Eficacia Global do Equipamento</h3>
            <p className="text-xs text-slate-400">Disponibilidade x Desempenho x Qualidade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={225}
                  endAngle={-45}
                  data={gaugeData}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    background={{ fill: 'rgba(255,255,255,0.08)' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{oeeMetrics.oee.toFixed(1)}%</span>
                <span className={`text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full ${getOEEBgClass(oeeMetrics.oee)} ${getOEETextClass(oeeMetrics.oee)}`}>
                  {getOEELabel(oeeMetrics.oee)}
                </span>
              </div>
            </div>
            {oeeMetrics.oeeTarget > 0 && (
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-400">
                  Meta: <span className="text-white font-semibold">{oeeMetrics.oeeTarget.toFixed(0)}%</span>
                </p>
                <p className={`text-xs font-medium mt-0.5 ${oeeMetrics.oee >= oeeMetrics.oeeTarget ? 'text-emerald-400' : 'text-red-400'}`}>
                  {oeeMetrics.oee >= oeeMetrics.oeeTarget
                    ? `+${(oeeMetrics.oee - oeeMetrics.oeeTarget).toFixed(1)}pp acima`
                    : `${(oeeMetrics.oee - oeeMetrics.oeeTarget).toFixed(1)}pp abaixo`}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PillarCard
              icon={<Clock className="w-5 h-5" />}
              label="Disponibilidade"
              value={oeeMetrics.disponibilidade}
              detail={`${oeeMetrics.daysProduced} de ${oeeMetrics.diasUteis} dias`}
              description="Tempo produtivo vs tempo disponivel"
              thresholds={{ good: 90, acceptable: 75 }}
            />
            <PillarCard
              icon={<Zap className="w-5 h-5" />}
              label="Desempenho"
              value={oeeMetrics.desempenho}
              detail={`Realizado / Planejado`}
              description="Velocidade real vs velocidade ideal"
              thresholds={{ good: 95, acceptable: 80 }}
            />
            <PillarCard
              icon={<ShieldCheck className="w-5 h-5" />}
              label="Qualidade"
              value={oeeMetrics.qualidade}
              detail={`${oeeMetrics.perdaQualidade.toLocaleString('pt-BR')} refugos`}
              description="Pecas boas vs total produzido"
              thresholds={{ good: 99, acceptable: 95 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">OEE Diario</h3>
          <p className="text-xs text-gray-400 mb-4">Evolucao do OEE ao longo dos dias</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={oeeMetrics.dailyOEE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name === 'oee' ? 'OEE' : name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {oeeMetrics.oeeTarget > 0 && (
                <ReferenceLine y={oeeMetrics.oeeTarget} stroke="#10B981" strokeWidth={2} strokeDasharray="6 3" label={{ value: `Meta ${oeeMetrics.oeeTarget}%`, position: 'right', fill: '#10B981', fontSize: 9 }} />
              )}
              <Bar dataKey="oee" name="OEE" radius={[3, 3, 0, 0]}>
                {oeeMetrics.dailyOEE.map((entry, idx) => (
                  <Cell key={idx} fill={getOEEColor(entry.oee)} opacity={0.85} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="oee" name="OEE Tendencia" stroke="#1E293B" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Decomposicao dos Pilares</h3>
          <p className="text-xs text-gray-400 mb-4">Contribuicao de cada fator no OEE</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={waterfallData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 105]} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(val: number) => [`${val.toFixed(1)}%`]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                {waterfallData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} opacity={0.9} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Desempenho e Qualidade Diarios</h3>
          <p className="text-xs text-gray-400 mb-4">Evolucao dos pilares ao longo do mes</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={oeeMetrics.dailyOEE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="desempenho" name="Desempenho" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="qualidade" name="Qualidade" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {lossData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Analise de Perdas</h3>
            <p className="text-xs text-gray-400 mb-4">Volume estimado de perdas por categoria</p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={lossData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(val: number) => [val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), 'Perda (vol.)']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {lossData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-gray-800 text-sm">Referencia OEE - Classe Mundial</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Disponibilidade', target: '90%', icon: Clock, color: 'blue' },
            { label: 'Desempenho', target: '95%', icon: Zap, color: 'amber' },
            { label: 'Qualidade', target: '99,9%', icon: ShieldCheck, color: 'emerald' },
            { label: 'OEE Global', target: '85%', icon: Gauge, color: 'slate' },
          ].map((ref, idx) => {
            const colors: Record<string, string> = {
              blue: 'bg-blue-50 text-blue-700 border-blue-100',
              amber: 'bg-amber-50 text-amber-700 border-amber-100',
              emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              slate: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            return (
              <div key={idx} className={`rounded-lg px-3 py-2.5 text-center border ${colors[ref.color]}`}>
                <ref.icon className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                <p className="text-[10px] font-medium uppercase tracking-wide opacity-70 mb-0.5">{ref.label}</p>
                <p className="text-sm font-bold">{ref.target}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PillarCard({ icon, label, value, detail, description, thresholds }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  description: string;
  thresholds: { good: number; acceptable: number };
}) {
  const getColor = (v: number) => {
    if (v >= thresholds.good) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-400' };
    if (v >= thresholds.acceptable) return { text: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-400' };
    return { text: 'text-red-400', bg: 'bg-red-500/20', bar: 'bg-red-400' };
  };

  const colors = getColor(value);
  const displayValue = Math.min(value, 100);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-3xl font-black ${colors.text} mb-1`}>{value.toFixed(1)}%</p>
      <div className="w-full h-2 bg-white/10 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400">{detail}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}
