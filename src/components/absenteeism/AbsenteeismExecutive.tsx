import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { ParsedEmployee, AbsenteeismFilter } from '../../types/absenteeism';
import {
  calculateOverallMetrics,
  calculateTeamMetrics,
  calculateTrendData,
  calculateParetoData,
  detectAlerts,
  formatHours,
} from '../../utils/absenteeismMetrics';

interface AbsenteeismExecutiveProps {
  employees: ParsedEmployee[];
  filter?: AbsenteeismFilter;
}

const COLORS = {
  primary: '#005A8F',
  secondary: '#00A3E0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  chart: ['#005A8F', '#00A3E0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'],
};

export function AbsenteeismExecutive({ employees, filter }: AbsenteeismExecutiveProps) {
  const metrics = useMemo(() => calculateOverallMetrics(employees, filter), [employees, filter]);
  const teamMetrics = useMemo(() => calculateTeamMetrics(employees, filter), [employees, filter]);
  const trendData = useMemo(() => calculateTrendData(employees, 'week', filter), [employees, filter]);
  const paretoData = useMemo(() => calculateParetoData(employees, filter), [employees, filter]);
  const alerts = useMemo(
    () =>
      detectAlerts(employees, {
        targetRate: 3,
        alertThreshold: 20,
      }),
    [employees]
  );

  const typeDistribution = useMemo(() => {
    return [
      { name: 'Saude', value: metrics.byType.saude.hours, color: COLORS.success },
      { name: 'Injustificada', value: metrics.byType.injustificada.hours, color: COLORS.danger },
      { name: 'Atraso', value: metrics.byType.atraso.hours, color: COLORS.warning },
      { name: 'Licenca', value: metrics.byType.licenca.hours, color: COLORS.purple },
      { name: 'Outros', value: metrics.byType.outros.hours, color: COLORS.secondary },
    ].filter(item => item.value > 0);
  }, [metrics]);

  const topTeams = teamMetrics.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Taxa de Absenteísmo</p>
              <p className="text-3xl font-bold mt-1">{metrics.absenteeismRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-blue-100">
            {metrics.absenteeismRate > 3 ? (
              <>
                <ArrowUp className="w-4 h-4" />
                <span>Acima da meta (3%)</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                <span>Dentro da meta</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Horas Perdidas</p>
              <p className="text-3xl font-bold mt-1">{formatHours(metrics.computableHours)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-sm text-red-100">
            Total computavel: {formatHours(metrics.computableHours)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Frequência</p>
              <p className="text-3xl font-bold mt-1">{metrics.frequency}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-sm text-amber-100">
            Eventos de ausencia
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Gravidade</p>
              <p className="text-3xl font-bold mt-1">{metrics.severity.toFixed(1)}h</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-sm text-purple-100">
            Horas medias por evento
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">% Injustificada</p>
              <p className="text-3xl font-bold mt-1">{metrics.injustifiedPercentage.toFixed(0)}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-sm text-rose-100">
            Do total computavel
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">Alertas Automaticos (Insights)</h3>
              <p className="text-sm text-amber-700">{alerts.length} alerta{alerts.length !== 1 ? 's' : ''} detectado{alerts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, idx) => {
              const isUrgent = alert.toLowerCase().includes('urgente') || alert.toLowerCase().includes('atencao necessaria');
              const isPositive = alert.toLowerCase().includes('reducao') || alert.toLowerCase().includes('diminuiram');
              const isTeamAlert = alert.toLowerCase().includes('equipe');

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    isUrgent
                      ? 'bg-red-50 border-red-300'
                      : isPositive
                      ? 'bg-green-50 border-green-300'
                      : isTeamAlert
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isUrgent
                        ? 'bg-red-500'
                        : isPositive
                        ? 'bg-green-500'
                        : isTeamAlert
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}>
                      {isUrgent ? (
                        <AlertTriangle className="w-4 h-4 text-white" />
                      ) : isPositive ? (
                        <TrendingUp className="w-4 h-4 text-white rotate-180" />
                      ) : isTeamAlert ? (
                        <Users className="w-4 h-4 text-white" />
                      ) : (
                        <Activity className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <p className={`text-sm font-medium flex-1 ${
                      isUrgent
                        ? 'text-red-800'
                        : isPositive
                        ? 'text-green-800'
                        : isTeamAlert
                        ? 'text-blue-800'
                        : 'text-amber-800'
                    }`}>
                      {alert}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tendência Semanal</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Legend />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="absentHours"
                  name="Horas Perdidas"
                  fill={COLORS.danger}
                  fillOpacity={0.1}
                  stroke={COLORS.danger}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="absenteeismRate"
                  name="Taxa (%)"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Tipo</h3>
          <div className="h-72 flex items-center justify-center">
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatHours(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">Nenhum dado de ausencia</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top 5 Equipes (Maior Taxa)</h3>
          <div className="h-72">
            {topTeams.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTeams} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis
                    type="category"
                    dataKey="team"
                    tick={{ fontSize: 11 }}
                    stroke="#6B7280"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="metrics.absenteeismRate"
                    name="Taxa de Absenteísmo"
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Nenhuma equipe identificada</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pareto de Motivos</h3>
          <div className="h-72">
            {paretoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="reason"
                    tick={{ fontSize: 10 }}
                    stroke="#6B7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Horas') {
                        return [value.toFixed(1), name];
                      }
                      if (name === 'Acumulado %') {
                        return [`${value.toFixed(1)}%`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="hours"
                    name="Horas"
                    fill={COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    name="Acumulado %"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    dot={{ fill: COLORS.danger }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Nenhum motivo identificado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Resumo por Equipe</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Equipe</th>
                <th className="text-right p-3 font-semibold text-gray-700">Colaboradores</th>
                <th className="text-right p-3 font-semibold text-gray-700">Taxa</th>
                <th className="text-right p-3 font-semibold text-gray-700">Horas Perdidas</th>
                <th className="text-right p-3 font-semibold text-gray-700">Frequência</th>
                <th className="text-right p-3 font-semibold text-gray-700">% Injustificada</th>
              </tr>
            </thead>
            <tbody>
              {teamMetrics.map((team, idx) => (
                <tr
                  key={team.team}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}
                >
                  <td className="p-3 font-medium text-gray-900">{team.team}</td>
                  <td className="p-3 text-right text-gray-600">{team.employeeCount}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                        team.metrics.absenteeismRate > metrics.absenteeismRate * 1.2
                          ? 'bg-red-100 text-red-700'
                          : team.metrics.absenteeismRate < metrics.absenteeismRate * 0.8
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {team.metrics.absenteeismRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-gray-600">
                    {formatHours(team.metrics.computableHours)}
                  </td>
                  <td className="p-3 text-right text-gray-600">{team.metrics.frequency}</td>
                  <td className="p-3 text-right text-gray-600">
                    {team.metrics.injustifiedPercentage.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
