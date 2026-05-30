import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Search,
  FileSpreadsheet,
  Calendar,
  Users,
  Building2,
  Briefcase,
  Filter,
  X,
  RefreshCw,
  Trash2,
  ClipboardList,
  Stethoscope,
  Clock,
  FileText,
  MoreHorizontal,
  User,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getUniqueValues,
  convertFromAbsenteeismRecords,
} from '../../utils/absenteeismMetrics';
import type {
  ParsedEmployee,
  AbsenteeismFilter,
  AbsenteeismUpload,
  AbsenteeismRecord,
  AbsenceType,
} from '../../types/absenteeism';
import { AbsenteeismExecutive } from './AbsenteeismExecutive';
import { AbsenteeismAnalysis } from './AbsenteeismAnalysis';
import { FilterDropdown } from './FilterDropdown';

type TabType = 'executive' | 'analysis';

const QUICK_FILTER_OPTIONS: { key: string; label: string; icon: typeof ClipboardList; types: AbsenceType[]; color: string; activeColor: string }[] = [
  { key: 'falta', label: 'Falta', icon: ClipboardList, types: ['injustificada'], color: 'border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:border-red-200', activeColor: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' },
  { key: 'atestado', label: 'Atestados', icon: Stethoscope, types: ['saude'], color: 'border-gray-200 bg-white text-gray-700 hover:bg-green-50 hover:border-green-200', activeColor: 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' },
  { key: 'atraso', label: 'Atraso', icon: Clock, types: ['atraso'], color: 'border-gray-200 bg-white text-gray-700 hover:bg-amber-50 hover:border-amber-200', activeColor: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200' },
  { key: 'licenca', label: 'Licenca', icon: FileText, types: ['licenca'], color: 'border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-200', activeColor: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' },
  { key: 'outros', label: 'Outros', icon: MoreHorizontal, types: ['outros', 'compensacao'], color: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-300', activeColor: 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-300' },
];

export function AbsenteeismDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [employees, setEmployees] = useState<ParsedEmployee[]>([]);
  const [uploads, setUploads] = useState<AbsenteeismUpload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filter, setFilter] = useState<AbsenteeismFilter>({});
  const [filterOptions, setFilterOptions] = useState<{
    teams: string[];
    positions: string[];
    sectors: string[];
    units: string[];
    employeeNames: string[];
    reasons: string[];
  }>({ teams: [], positions: [], sectors: [], units: [], employeeNames: [], reasons: [] });

  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const loadUploads = useCallback(async () => {
    const { data, error } = await supabase
      .from('absenteeism_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUploads(data);
    }
  }, []);

  const loadRecordsForUploads = useCallback(async (uploadIds: string[]) => {
    if (uploadIds.length === 0) {
      setEmployees([]);
      return;
    }

    const { data, error } = await supabase
      .from('absenteeism_records')
      .select('*')
      .in('upload_id', uploadIds);

    if (!error && data) {
      const parsedEmployees = convertFromAbsenteeismRecords(data as AbsenteeismRecord[]);
      setEmployees(parsedEmployees);
      setFilterOptions(getUniqueValues(parsedEmployees));
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadUploads();
      setLoading(false);
    }
    init();
  }, [loadUploads]);

  useEffect(() => {
    if (selectedUploadIds.length > 0) {
      loadRecordsForUploads(selectedUploadIds);
    } else if (uploads.length > 0) {
      const recentUploadIds = uploads.slice(0, 3).map(u => u.id);
      setSelectedUploadIds(recentUploadIds);
      loadRecordsForUploads(recentUploadIds);
    }
  }, [uploads, selectedUploadIds.length, loadRecordsForUploads]);

  async function handleDeleteUpload(uploadId: string) {
    const { error } = await supabase
      .from('absenteeism_uploads')
      .delete()
      .eq('id', uploadId);

    if (!error) {
      await loadUploads();
      setSelectedUploadIds(prev => prev.filter(id => id !== uploadId));
    }
  }

  function handleUploadSelection(uploadId: string, selected: boolean) {
    if (selected) {
      setSelectedUploadIds(prev => [...prev, uploadId]);
    } else {
      setSelectedUploadIds(prev => prev.filter(id => id !== uploadId));
    }
  }

  function clearFilters() {
    setFilter({});
    setActiveQuickFilters([]);
  }

  function handleQuickFilterToggle(key: string) {
    setActiveQuickFilters(prev => {
      const newFilters = prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key];

      if (newFilters.length === 0) {
        setFilter(prev => ({ ...prev, absenceTypes: undefined }));
      } else {
        const selectedTypes = newFilters.flatMap(
          fk => QUICK_FILTER_OPTIONS.find(o => o.key === fk)?.types || []
        );
        setFilter(prev => ({ ...prev, absenceTypes: selectedTypes }));
      }

      return newFilters;
    });
  }

  const hasActiveFilters = Object.values(filter).some(
    v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  const activeFilterCount = Object.values(filter).reduce((count, v) => {
    if (v === undefined) return count;
    if (Array.isArray(v)) return count + (v.length > 0 ? 1 : 0);
    return count + 1;
  }, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Absenteismo</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Analise detalhada de ausencias
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Limpar {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Arquivos Carregados</h3>
          <div className="flex flex-wrap gap-2">
            {uploads.map(upload => (
              <div
                key={upload.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  selectedUploadIds.includes(upload.id)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUploadIds.includes(upload.id)}
                  onChange={e => handleUploadSelection(upload.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {upload.period_start && upload.period_end
                    ? `${new Date(upload.period_start).toLocaleDateString('pt-BR')} - ${new Date(upload.period_end).toLocaleDateString('pt-BR')}`
                    : upload.file_name}
                </span>
                <span className="text-xs text-gray-500">
                  ({upload.records_count} registros)
                </span>
                <button
                  onClick={() => handleDeleteUpload(upload.id)}
                  className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Filtros</h3>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount} ativo{activeFilterCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              showAdvancedFilters
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros avancados
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FilterDropdown
            label="Colaborador"
            icon={<User className="w-4 h-4" />}
            options={filterOptions.employeeNames}
            selected={filter.employees || []}
            onChange={selected => setFilter(prev => ({ ...prev, employees: selected.length > 0 ? selected : undefined }))}
            placeholder="Todos os colaboradores"
          />

          <FilterDropdown
            label="Equipe"
            icon={<Users className="w-4 h-4" />}
            options={filterOptions.teams}
            selected={filter.teams || []}
            onChange={selected => setFilter(prev => ({ ...prev, teams: selected.length > 0 ? selected : undefined }))}
            placeholder="Todas as equipes"
          />

          <FilterDropdown
            label="Setor"
            icon={<Building2 className="w-4 h-4" />}
            options={filterOptions.sectors}
            selected={filter.sectors || []}
            onChange={selected => setFilter(prev => ({ ...prev, sectors: selected.length > 0 ? selected : undefined }))}
            placeholder="Todos os setores"
          />
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <FilterDropdown
              label="Cargo"
              icon={<Briefcase className="w-4 h-4" />}
              options={filterOptions.positions}
              selected={filter.positions || []}
              onChange={selected => setFilter(prev => ({ ...prev, positions: selected.length > 0 ? selected : undefined }))}
              placeholder="Todos os cargos"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Data Inicio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filter.dateStart?.toISOString().split('T')[0] || ''}
                  onChange={e =>
                    setFilter(prev => ({
                      ...prev,
                      dateStart: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Data Fim
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filter.dateEnd?.toISOString().split('T')[0] || ''}
                  onChange={e =>
                    setFilter(prev => ({
                      ...prev,
                      dateEnd: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Computavel
              </label>
              <select
                value={filter.isComputable === undefined ? '' : filter.isComputable.toString()}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    isComputable: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Sim (Conta como absenteismo)</option>
                <option value="false">Nao (Ferias, Folga, etc.)</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo da Ausencia</h4>
            {activeQuickFilters.length > 0 && (
              <button
                onClick={() => {
                  setActiveQuickFilters([]);
                  setFilter(prev => ({ ...prev, absenceTypes: undefined }));
                }}
                className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTER_OPTIONS.map(option => {
              const Icon = option.icon;
              const isActive = activeQuickFilters.includes(option.key);
              return (
                <button
                  key={option.key}
                  onClick={() => handleQuickFilterToggle(option.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    isActive ? option.activeColor : option.color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
            {(filter.employees || []).map(name => (
              <span key={`emp-${name}`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                <User className="w-3 h-3" />
                {name}
                <button onClick={() => setFilter(prev => ({ ...prev, employees: (prev.employees || []).filter(e => e !== name) || undefined }))}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            ))}
            {(filter.teams || []).map(team => (
              <span key={`team-${team}`} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                <Users className="w-3 h-3" />
                {team}
                <button onClick={() => setFilter(prev => ({ ...prev, teams: (prev.teams || []).filter(t => t !== team) || undefined }))}>
                  <X className="w-3 h-3 hover:text-emerald-900" />
                </button>
              </span>
            ))}
            {(filter.sectors || []).map(sector => (
              <span key={`sec-${sector}`} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                <Building2 className="w-3 h-3" />
                {sector}
                <button onClick={() => setFilter(prev => ({ ...prev, sectors: (prev.sectors || []).filter(s => s !== sector) || undefined }))}>
                  <X className="w-3 h-3 hover:text-amber-900" />
                </button>
              </span>
            ))}
            {(filter.positions || []).map(pos => (
              <span key={`pos-${pos}`} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                <Briefcase className="w-3 h-3" />
                {pos}
                <button onClick={() => setFilter(prev => ({ ...prev, positions: (prev.positions || []).filter(p => p !== pos) || undefined }))}>
                  <X className="w-3 h-3 hover:text-gray-900" />
                </button>
              </span>
            ))}
            {filter.dateStart && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                <Calendar className="w-3 h-3" />
                A partir de {filter.dateStart.toLocaleDateString('pt-BR')}
                <button onClick={() => setFilter(prev => ({ ...prev, dateStart: undefined }))}>
                  <X className="w-3 h-3 hover:text-gray-900" />
                </button>
              </span>
            )}
            {filter.dateEnd && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                <Calendar className="w-3 h-3" />
                Ate {filter.dateEnd.toLocaleDateString('pt-BR')}
                <button onClick={() => setFilter(prev => ({ ...prev, dateEnd: undefined }))}>
                  <X className="w-3 h-3 hover:text-gray-900" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('executive')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'executive'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Visao Executiva
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Analise
            </button>
          </nav>
        </div>

        <div className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum dado carregado
              </h3>
              <p className="text-gray-500">
                Selecione arquivos carregados acima para visualizar o dashboard
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'executive' && (
                <AbsenteeismExecutive employees={employees} filter={filter} />
              )}
              {activeTab === 'analysis' && (
                <AbsenteeismAnalysis employees={employees} filter={filter} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
