import { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react';
import type { ParsedEmployee, AbsenteeismFilter } from '../../types/absenteeism';
import {
  calculateEmployeeMetrics,
  calculateHeatmapData,
  formatHours,
  exportToCSV,
} from '../../utils/absenteeismMetrics';

interface AbsenteeismAnalysisProps {
  employees: ParsedEmployee[];
  filter?: AbsenteeismFilter;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function getHeatmapColor(value: number, maxValue: number): string {
  if (value === 0) return 'bg-gray-100';
  const intensity = Math.min(value / maxValue, 1);
  if (intensity < 0.2) return 'bg-green-100';
  if (intensity < 0.4) return 'bg-yellow-100';
  if (intensity < 0.6) return 'bg-orange-200';
  if (intensity < 0.8) return 'bg-red-300';
  return 'bg-red-500';
}

export function AbsenteeismAnalysis({ employees, filter }: AbsenteeismAnalysisProps) {
  const [anonymize, setAnonymize] = useState(false);
  const [showRecurrentOnly, setShowRecurrentOnly] = useState(false);
  const [recurrenceThreshold, setRecurrenceThreshold] = useState(3);
  const [sortBy, setSortBy] = useState<'hours' | 'rate' | 'frequency'>('hours');

  const employeeMetrics = useMemo(
    () => calculateEmployeeMetrics(employees, filter, recurrenceThreshold),
    [employees, filter, recurrenceThreshold]
  );

  const heatmapData = useMemo(
    () => calculateHeatmapData(employees, filter),
    [employees, filter]
  );

  const filteredEmployees = useMemo(() => {
    let result = employeeMetrics;
    if (showRecurrentOnly) {
      result = result.filter(e => e.isRecurrent);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return b.metrics.absenteeismRate - a.metrics.absenteeismRate;
        case 'frequency':
          return b.eventCount - a.eventCount;
        default:
          return b.metrics.computableHours - a.metrics.computableHours;
      }
    });
    return result;
  }, [employeeMetrics, showRecurrentOnly, sortBy]);

  const heatmapMatrix = useMemo(() => {
    const teams = [...new Set(heatmapData.map(d => d.team))];
    const maxValue = Math.max(...heatmapData.map(d => d.value), 1);

    return { teams, data: heatmapData, maxValue };
  }, [heatmapData]);

  function anonymizeName(name: string): string {
    if (!anonymize) return name;
    const parts = name.split(' ');
    if (parts.length <= 1) return name[0] + '***';
    return parts[0][0] + '*** ' + parts[parts.length - 1][0] + '***';
  }

  function handleExportCSV() {
    const csv = exportToCSV(employees, filter);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `absenteismo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const detailedRecords = useMemo(() => {
    const records: Array<{
      employee: string;
      date: Date;
      absentHours: number;
      type: string;
      reason: string;
      team: string;
      position: string;
    }> = [];

    for (const emp of employees) {
      for (const rec of emp.records) {
        if (rec.absentHours > 0 && rec.isComputable) {
          const passFilter =
            (!filter?.dateStart || rec.date >= filter.dateStart) &&
            (!filter?.dateEnd || rec.date <= filter.dateEnd) &&
            (!filter?.absenceTypes?.length || filter.absenceTypes.includes(rec.absenceType));

          if (passFilter) {
            records.push({
              employee: emp.info.name,
              date: rec.date,
              absentHours: rec.absentHours,
              type: rec.absenceType,
              reason: rec.reason || rec.absenceType,
              team: emp.info.team || '-',
              position: emp.info.position || '-',
            });
          }
        }
      }
    }

    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [employees, filter]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Heatmap: Dia da Semana x Equipe</h3>
          <div className="text-sm text-gray-500">
            Horas de ausencia computavel por dia da semana
          </div>
        </div>

        {heatmapMatrix.teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700 min-w-[150px]">Equipe</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="text-center p-2 font-medium text-gray-700 w-20">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapMatrix.teams.map(team => (
                  <tr key={team}>
                    <td className="p-2 font-medium text-gray-900 truncate max-w-[150px]" title={team}>
                      {team}
                    </td>
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const dataPoint = heatmapMatrix.data.find(
                        d => d.team === team && d.dayOfWeek === dayIndex
                      );
                      const value = dataPoint?.value || 0;
                      return (
                        <td key={dayIndex} className="p-1">
                          <div
                            className={`w-full h-12 rounded-lg flex items-center justify-center ${getHeatmapColor(
                              value,
                              heatmapMatrix.maxValue
                            )} transition-colors`}
                            title={`${team} - ${DAYS_OF_WEEK[dayIndex]}: ${formatHours(value)}`}
                          >
                            <span className="text-xs font-medium text-gray-700">
                              {value > 0 ? formatHours(value) : '-'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Intensidade:</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-6 bg-gray-100 rounded" />
                <div className="w-8 h-6 bg-green-100 rounded" />
                <div className="w-8 h-6 bg-yellow-100 rounded" />
                <div className="w-8 h-6 bg-orange-200 rounded" />
                <div className="w-8 h-6 bg-red-300 rounded" />
                <div className="w-8 h-6 bg-red-500 rounded" />
              </div>
              <span className="text-xs text-gray-500">Baixo → Alto</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhuma equipe identificada nos dados
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-900">Ranking de Colaboradores</h3>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setAnonymize(!anonymize)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                anonymize
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {anonymize ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {anonymize ? 'Anonimizado' : 'Anonimizar'}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showRecurrentOnly}
                onChange={e => setShowRecurrentOnly(e.target.checked)}
                className="rounded border-gray-300 text-pion-blue focus:ring-pion-blue"
              />
              Apenas reincidentes
            </label>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Limite reincidencia:</span>
              <input
                type="number"
                value={recurrenceThreshold}
                onChange={e => setRecurrenceThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg"
                min={1}
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'hours' | 'rate' | 'frequency')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="hours">Ordenar por Horas</option>
              <option value="rate">Ordenar por Taxa</option>
              <option value="frequency">Ordenar por Frequencia</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">#</th>
                <th className="text-left p-3 font-semibold text-gray-700">Colaborador</th>
                <th className="text-left p-3 font-semibold text-gray-700">Equipe</th>
                <th className="text-left p-3 font-semibold text-gray-700">Cargo</th>
                <th className="text-right p-3 font-semibold text-gray-700">Taxa</th>
                <th className="text-right p-3 font-semibold text-gray-700">Horas Perdidas</th>
                <th className="text-right p-3 font-semibold text-gray-700">Eventos</th>
                <th className="text-center p-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.slice(0, 50).map((emp, idx) => (
                <tr
                  key={emp.employee.name + idx}
                  className={`border-b border-gray-100 ${
                    emp.isRecurrent ? 'bg-red-50' : idx % 2 === 0 ? 'bg-gray-50' : ''
                  }`}
                >
                  <td className="p-3 text-gray-500 font-medium">{idx + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {anonymizeName(emp.employee.name)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{emp.employee.team || '-'}</td>
                  <td className="p-3 text-gray-600">{emp.employee.position || '-'}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                        emp.metrics.absenteeismRate > 5
                          ? 'bg-red-100 text-red-700'
                          : emp.metrics.absenteeismRate > 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {emp.metrics.absenteeismRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-900">
                    {formatHours(emp.metrics.computableHours)}
                  </td>
                  <td className="p-3 text-right text-gray-600">{emp.eventCount}</td>
                  <td className="p-3 text-center">
                    {emp.isRecurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Reincidente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length > 50 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Mostrando 50 de {filteredEmployees.length} colaboradores
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Detalhamento de Registros</h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                <th className="text-left p-3 font-semibold text-gray-700">Colaborador</th>
                <th className="text-left p-3 font-semibold text-gray-700">Equipe</th>
                <th className="text-left p-3 font-semibold text-gray-700">Cargo</th>
                <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                <th className="text-left p-3 font-semibold text-gray-700">Motivo</th>
                <th className="text-right p-3 font-semibold text-gray-700">Horas</th>
              </tr>
            </thead>
            <tbody>
              {detailedRecords.slice(0, 100).map((rec, idx) => (
                <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="p-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {rec.date.toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-gray-900">
                    {anonymizeName(rec.employee)}
                  </td>
                  <td className="p-3 text-gray-600">{rec.team}</td>
                  <td className="p-3 text-gray-600">{rec.position}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        rec.type === 'injustificada'
                          ? 'bg-red-100 text-red-700'
                          : rec.type === 'saude'
                          ? 'bg-green-100 text-green-700'
                          : rec.type === 'atraso'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {rec.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 max-w-[200px] truncate" title={rec.reason}>
                    {rec.reason}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-900">
                    {formatHours(rec.absentHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {detailedRecords.length > 100 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Mostrando 100 de {detailedRecords.length} registros. Exporte para ver todos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
