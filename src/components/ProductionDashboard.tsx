import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  Filter,
  Download,
  Printer,
  X,
  ChevronUp,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { productionService, ProductionRecord, CollaboratorStats } from '../services/productionService';

const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<ProductionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ProductionRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof CollaboratorStats>('produtividade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [filters, setFilters] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      colaboradores: [] as string[],
      equipes: [] as string[],
      setores: [] as string[]
    };
  });

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    loadData(false);
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    if (filters.equipes.length > 0 && filters.colaboradores.length > 0) {
      const teamEmployees = new Set(
        data.filter(d => d.equipe && filters.equipes.includes(d.equipe)).map(d => d.colaborador)
      );
      const validColabs = filters.colaboradores.filter(c => teamEmployees.has(c));
      if (validColabs.length !== filters.colaboradores.length) {
        setFilters(prev => ({ ...prev, colaboradores: validColabs }));
        return;
      }
    }
    applyFilters();
  }, [data, filters]);

  const loadData = async (isInitial: boolean = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const productionData = await productionService.getProductionData({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setData(productionData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading production data:', error);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = data.filter(d => {
      const dateMatch = d.data >= filters.startDate && d.data <= filters.endDate;
      const collabMatch = filters.colaboradores.length === 0 || filters.colaboradores.includes(d.colaborador);
      const equipeMatch = filters.equipes.length === 0 || (d.equipe && filters.equipes.includes(d.equipe));
      const setorMatch = filters.setores.length === 0 || (d.setor && filters.setores.includes(d.setor));
      return dateMatch && collabMatch && equipeMatch && setorMatch;
    });
    setFilteredData(filtered);
  };

  const globalStats = productionService.getGlobalStats(filteredData);
  const dayStats = productionService.aggregateByDay(filteredData);
  const collabStats = productionService.aggregateByCollaborator(filteredData)
    .sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const alerts = productionService.getAlerts(filteredData);
  const topPerformers = [...collabStats].sort((a, b) => b.produtividade - a.produtividade).slice(0, 5);
  const bottomPerformers = [...collabStats].sort((a, b) => a.produtividade - b.produtividade).slice(0, 5);

  const uniqueEquipes = Array.from(new Set(data.map(d => d.equipe).filter(Boolean))).sort();
  const uniqueSetores = Array.from(new Set(data.map(d => d.setor).filter(Boolean))).sort();
  const uniqueColaboradores = React.useMemo(() => {
    const source = filters.equipes.length > 0
      ? data.filter(d => d.equipe && filters.equipes.includes(d.equipe))
      : data;
    return Array.from(new Set(source.map(d => d.colaborador))).sort();
  }, [data, filters.equipes]);

  const handleSort = (field: keyof CollaboratorStats) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const csv = productionService.exportToCSV(collabStats);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `producao_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Produção</h1>
            <p className="text-blue-100">
              Planejado x Realizado | Período: {new Date(filters.startDate).toLocaleDateString('pt-BR')} até {new Date(filters.endDate).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-sm text-blue-200 mt-1 flex items-center gap-2">
              Última atualização: {lastUpdate.toLocaleString('pt-BR')}
              {isRefreshing && (
                <span className="inline-flex items-center gap-1">
                  <span className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></span>
                  <span className="text-xs">Atualizando...</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data Início</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Fim</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Colaboradores</label>
                <select
                  multiple
                  value={filters.colaboradores}
                  onChange={(e) => setFilters({
                    ...filters,
                    colaboradores: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  size={3}
                >
                  {uniqueColaboradores.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Equipes</label>
                <select
                  multiple
                  value={filters.equipes}
                  onChange={(e) => setFilters({
                    ...filters,
                    equipes: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  size={3}
                >
                  {uniqueEquipes.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Setores</label>
                <select
                  multiple
                  value={filters.setores}
                  onChange={(e) => {
                    const newSetores = Array.from(e.target.selectedOptions, option => option.value);
                    const employeesInSetores = Array.from(new Set(
                      data.filter(d => d.setor && newSetores.includes(d.setor)).map(d => d.colaborador)
                    )).sort();
                    setFilters({
                      ...filters,
                      setores: newSetores,
                      colaboradores: newSetores.length > 0 ? employeesInSetores : []
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                  size={3}
                >
                  {uniqueSetores.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs - Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Planejado"
          value={(Math.round(globalStats.totalPlanejado * 10) / 10).toLocaleString('pt-BR')}
          icon={<Target className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Total Realizado"
          value={(Math.round(globalStats.totalRealizado * 10) / 10).toLocaleString('pt-BR')}
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Produtividade Geral"
          value={`${globalStats.produtividadeGeral.toFixed(1)}%`}
          badge={productionService.getPerformanceColor(globalStats.produtividadeGeral)}
          icon={<BarChart3 className="w-6 h-6" />}
          color={productionService.getPerformanceColor(globalStats.produtividadeGeral)}
        />
        <KPICard
          title="Gap Geral"
          value={(Math.round(globalStats.gap * 10) / 10).toLocaleString('pt-BR')}
          icon={globalStats.gap >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          color={globalStats.gap >= 0 ? 'green' : 'red'}
        />
        <KPICard
          title="Dias Críticos"
          value={globalStats.diasCriticos.toString()}
          subtitle="< 70% aderência"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="orange"
        />
        <KPICard
          title="Top Colaborador"
          value={globalStats.topCollaborator?.colaborador.split(' ')[0] || 'N/A'}
          subtitle={globalStats.topCollaborator ? `${globalStats.topCollaborator.produtividade.toFixed(1)}%` : ''}
          icon={<Award className="w-6 h-6" />}
          color="blue"
        />
      </div>

      {/* Charts - Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aderência Diária */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Aderência Diária (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dayStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="data"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Aderência']}
              />
              <Line type="monotone" dataKey="aderencia" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Planejado vs Realizado por Dia */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Planejado vs Realizado por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="data"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')} />
              <Legend />
              <Bar dataKey="planejado" fill="#94a3b8" name="Planejado" />
              <Bar dataKey="realizado" fill="#3b82f6" name="Realizado" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap Calendário */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Heatmap de Produtividade Diária
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {dayStats.map((day) => {
            const color = productionService.getPerformanceBgColor(day.aderencia);
            const textColor = productionService.getPerformanceTextColor(day.aderencia);
            return (
              <div
                key={day.data}
                className={`${color} ${textColor} p-3 rounded-lg text-center transition-transform hover:scale-105 cursor-pointer`}
                title={`${new Date(day.data).toLocaleDateString('pt-BR')}: ${day.aderencia.toFixed(1)}%`}
              >
                <div className="text-xs font-medium">
                  {new Date(day.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
                <div className="text-sm font-bold mt-1">
                  {day.aderencia.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranking Table - Linha 3 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Ranking por Colaborador</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader field="colaborador" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Colaborador
                </SortableHeader>
                <SortableHeader field="totalPlanejado" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Planejado
                </SortableHeader>
                <SortableHeader field="totalRealizado" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Realizado
                </SortableHeader>
                <SortableHeader field="produtividade" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Produtividade
                </SortableHeader>
                <SortableHeader field="gap" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Gap
                </SortableHeader>
                <SortableHeader field="diasAbaixo70" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  {'Dias < 70%'}
                </SortableHeader>
                <SortableHeader field="ultimoDiaProdutividade" currentField={sortField} direction={sortDirection} onClick={handleSort}>
                  Último Dia
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {collabStats.map((collab, index) => (
                <tr
                  key={collab.colaborador}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCollaborator(collab.colaborador)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div className="font-medium text-gray-900">{collab.colaborador}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {collab.totalPlanejado.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {collab.totalRealizado.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{collab.produtividade.toFixed(1)}%</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${productionService.getPerformanceBgColor(collab.produtividade)} ${productionService.getPerformanceTextColor(collab.produtividade)}`}>
                            {productionService.getPerformanceColor(collab.produtividade).toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              collab.produtividade < 70 ? 'bg-red-500' :
                              collab.produtividade < 90 ? 'bg-orange-500' :
                              collab.produtividade < 110 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(collab.produtividade, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-semibold ${collab.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {collab.gap >= 0 ? '+' : ''}{collab.gap.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {collab.diasAbaixo70 > 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                        {collab.diasAbaixo70}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {collab.ultimoDiaProdutividade ? (
                      <span className={`font-medium ${productionService.getPerformanceTextColor(collab.ultimoDiaProdutividade)}`}>
                        {collab.ultimoDiaProdutividade.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnóstico - Linha 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Acima */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
            <TrendingUp className="w-5 h-5" />
            Top 5 Acima da Meta
          </h3>
          <div className="space-y-3">
            {topPerformers.map((collab, index) => (
              <div key={collab.colaborador} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{collab.colaborador}</span>
                </div>
                <span className="font-bold text-green-700">{collab.produtividade.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Abaixo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
            <TrendingDown className="w-5 h-5" />
            Top 5 Abaixo da Meta
          </h3>
          <div className="space-y-3">
            {bottomPerformers.map((collab, index) => (
              <div key={collab.colaborador} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{collab.colaborador}</span>
                </div>
                <span className="font-bold text-red-700">{collab.produtividade.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" />
            Alertas Automáticos
          </h3>
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{alert}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                Nenhum alerta no momento
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer de Detalhes do Colaborador */}
      {selectedCollaborator && (
        <CollaboratorDetailDrawer
          colaborador={selectedCollaborator}
          data={filteredData}
          onClose={() => setSelectedCollaborator(null)}
        />
      )}
    </div>
  );
};

// Componente KPI Card
const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}> = ({ title, value, subtitle, icon, color, badge }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[badge as keyof typeof colorClasses]}`}>
            {badge.toUpperCase()}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

// Componente de Header Ordenável
const SortableHeader: React.FC<{
  field: keyof CollaboratorStats;
  currentField: keyof CollaboratorStats;
  direction: 'asc' | 'desc';
  onClick: (field: keyof CollaboratorStats) => void;
  children: React.ReactNode;
}> = ({ field, currentField, direction, onClick, children }) => {
  const isActive = currentField === field;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {isActive && (
          direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );
};

// Componente Drawer de Detalhes do Colaborador
const CollaboratorDetailDrawer: React.FC<{
  colaborador: string;
  data: ProductionRecord[];
  onClose: () => void;
}> = ({ colaborador, data, onClose }) => {
  const details = productionService.getCollaboratorDetails(data, colaborador);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{colaborador}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100">Análise Detalhada de Performance</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Produtividade Média</div>
              <div className="text-2xl font-bold text-gray-900">
                {details.stats.mediaProdutividade.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Realizado</div>
              <div className="text-2xl font-bold text-gray-900">
                {details.stats.totalRealizado.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-700 mb-1">Melhor Dia</div>
              <div className="text-lg font-bold text-green-900">
                {details.stats.melhorDia?.data && new Date(details.stats.melhorDia.data).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-green-600">
                {details.stats.melhorDia?.produtividade.toFixed(1)}%
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-700 mb-1">Pior Dia</div>
              <div className="text-lg font-bold text-red-900">
                {details.stats.piorDia?.data && new Date(details.stats.piorDia.data).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-red-600">
                {details.stats.piorDia?.produtividade.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Gráfico de Produtividade por Dia */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Produtividade por Dia</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={details.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: any) => value !== null ? [`${value.toFixed(1)}%`, 'Produtividade'] : ['N/A', 'Produtividade']}
                />
                <Line type="monotone" dataKey="produtividade" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico Planejado vs Realizado */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Planejado vs Realizado</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={details.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')} />
                <Legend />
                <Bar dataKey="planejado" fill="#94a3b8" name="Planejado" />
                <Bar dataKey="realizado" fill="#3b82f6" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela Detalhada por Dia */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detalhamento Diário</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Data</th>
                    <th className="px-4 py-2 text-left">Planejado</th>
                    <th className="px-4 py-2 text-left">Realizado</th>
                    <th className="px-4 py-2 text-left">Produtividade</th>
                    <th className="px-4 py-2 text-left">Assunto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {details.dailyData.map((day) => (
                    <tr key={day.data} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(day.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2">{day.planejado}</td>
                      <td className="px-4 py-2">{day.realizado}</td>
                      <td className="px-4 py-2">
                        {day.produtividade ? (
                          <span className={`font-medium ${productionService.getPerformanceTextColor(day.produtividade)}`}>
                            {day.produtividade.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{day.assunto || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
