import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, ChevronDown, Layers, Plus, Trash2, AlertCircle, Target, Gauge, Factory, Calendar } from 'lucide-react';

interface TotalParameterRecord {
  id: string;
  reference_month: string;
  oee: number;
  capacidade_dia: number;
  meta_mensal_volume: number;
  dias_uteis_mensal: number;
  meta_diaria_volume: number;
}

interface TeamParameter {
  id: string;
  team_id: string;
  reference_month: string;
  oee: number;
  capacidade_dia: number;
  meta_mensal_volume: number;
  dias_uteis_mensal: number;
  meta_diaria_volume: number;
  team?: { name: string };
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const FIELD_LABELS: { key: keyof Omit<TotalParameterRecord, 'id' | 'reference_month'>; label: string; suffix: string }[] = [
  { key: 'oee', label: 'OEE', suffix: '%' },
  { key: 'capacidade_dia', label: 'Capacidade/Dia', suffix: 'un' },
  { key: 'meta_mensal_volume', label: 'Meta Mensal (Volume)', suffix: 'un' },
  { key: 'dias_uteis_mensal', label: 'Dias Uteis Mensal', suffix: 'dias' },
  { key: 'meta_diaria_volume', label: 'Meta Diaria (Volume)', suffix: 'un' },
];

const INDICATOR_CONFIG = [
  { key: 'oee', label: 'OEE', icon: Gauge, color: 'emerald', suffix: '%' },
  { key: 'capacidade_dia', label: 'Capacidade/Dia', icon: Factory, color: 'amber', suffix: '' },
  { key: 'meta_mensal_volume', label: 'Meta Mensal', icon: Target, color: 'rose', suffix: '' },
  { key: 'dias_uteis_mensal', label: 'Dias Uteis', icon: Calendar, color: 'sky', suffix: '' },
  { key: 'meta_diaria_volume', label: 'Meta Dia (Vol)', icon: Target, color: 'orange', suffix: '' },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
};

export function TeamProductivityTotalReferences() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [parameters, setParameters] = useState<TotalParameterRecord | null>(null);
  const [formData, setFormData] = useState({
    oee: 0,
    capacidade_dia: 0,
    meta_mensal_volume: 0,
    dias_uteis_mensal: 0,
    meta_diaria_volume: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allParameters, setAllParameters] = useState<TotalParameterRecord[]>([]);
  const [teamParameters, setTeamParameters] = useState<TeamParameter[]>([]);

  useEffect(() => {
    loadAllParameters();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadParameters();
      loadTeamParametersForMonth();
    }
  }, [selectedMonth]);

  const loadAllParameters = async () => {
    const { data } = await supabase
      .from('team_productivity_total_parameters')
      .select('*')
      .order('reference_month', { ascending: false });
    setAllParameters(data || []);
  };

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_productivity_total_parameters')
        .select('*')
        .eq('reference_month', selectedMonth)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setParameters(data);
        setFormData({
          oee: data.oee || 0,
          capacidade_dia: data.capacidade_dia || 0,
          meta_mensal_volume: data.meta_mensal_volume || 0,
          dias_uteis_mensal: data.dias_uteis_mensal || 0,
          meta_diaria_volume: data.meta_diaria_volume || 0,
        });
      } else {
        setParameters(null);
        setFormData({
          oee: 0, capacidade_dia: 0, meta_mensal_volume: 0,
          dias_uteis_mensal: 0, meta_diaria_volume: 0,
        });
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading total parameters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamParametersForMonth = async () => {
    const { data } = await supabase
      .from('team_productivity_parameters')
      .select('*, team:teams!team_id(name)')
      .eq('reference_month', selectedMonth)
      .order('team_id');
    setTeamParameters(data || []);
  };

  const handleFieldChange = (key: string, value: string) => {
    const numVal = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0;
    setFormData(prev => ({ ...prev, [key]: numVal }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!selectedMonth) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      if (parameters) {
        const { error } = await supabase
          .from('team_productivity_total_parameters')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', parameters.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_productivity_total_parameters')
          .insert({
            reference_month: selectedMonth,
            ...formData,
            created_by: user?.id,
          });
        if (error) throw error;
      }
      await loadParameters();
      await loadAllParameters();
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Referencias totais salvas com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving total parameters:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir estas referencias totais?')) return;
    try {
      const { error } = await supabase
        .from('team_productivity_total_parameters')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadParameters();
      await loadAllParameters();
      setSaveMessage({ type: 'success', text: 'Referencias excluidas com sucesso.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting total parameters:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao excluir: ' + error.message });
    }
  };

  const handleCalcFromTeams = () => {
    if (teamParameters.length === 0) return;
    const summed = {
      oee: 0,
      capacidade_dia: 0,
      meta_mensal_volume: 0,
      dias_uteis_mensal: 0,
      meta_diaria_volume: 0,
    };
    teamParameters.forEach(tp => {
      summed.capacidade_dia += Number(tp.capacidade_dia) || 0;
      summed.meta_mensal_volume += Number(tp.meta_mensal_volume) || 0;
      summed.meta_diaria_volume += Number(tp.meta_diaria_volume) || 0;
    });
    const count = teamParameters.length;
    summed.oee = teamParameters.reduce((s, tp) => s + (Number(tp.oee) || 0), 0) / count;
    summed.dias_uteis_mensal = Math.max(...teamParameters.map(tp => Number(tp.dias_uteis_mensal) || 0));
    summed.oee = Math.round(summed.oee * 100) / 100;

    setFormData(summed);
    setHasChanges(true);
    setSaveMessage(null);
  };

  const formatMonthLabel = (refMonth: string) => {
    const [y, m] = refMonth.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value: val, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8"
            >
              {monthOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Referencias Totais - {formatMonthLabel(selectedMonth)}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Soma de todas as equipes para exibir no Dashboard consolidado
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {parameters && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Configurado</span>
                  )}
                </div>
              </div>

              <div className="p-5">
                {teamParameters.length > 0 && (
                  <div className="mb-5">
                    <button
                      onClick={handleCalcFromTeams}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-sm font-medium transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      Calcular a partir das equipes ({teamParameters.length})
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Soma volumes, calcula media do OEE e usa o maior valor de dias uteis
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELD_LABELS.map((field) => (
                    <div key={field.key} className="group">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">{field.suffix}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {saveMessage && (
                  <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                    saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {saveMessage.text}
                  </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <div>
                    {parameters && (
                      <button
                        onClick={() => handleDelete(parameters.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : parameters ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>

            {teamParameters.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Referencias por Equipe - {formatMonthLabel(selectedMonth)}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Detalhamento individual das equipes para este periodo</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Equipe</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600">OEE</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600">Cap/Dia</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600">Meta Mensal</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600">Dias</th>
                        <th className="text-right px-3 py-2.5 font-medium text-gray-600">Meta Dia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamParameters.map((tp) => (
                        <tr key={tp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-700">{tp.team?.name || '-'}</td>
                          <td className="text-right px-3 py-2.5 text-gray-600">{Number(tp.oee).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</td>
                          <td className="text-right px-3 py-2.5 text-gray-600">{Number(tp.capacidade_dia).toLocaleString('pt-BR')}</td>
                          <td className="text-right px-3 py-2.5 text-gray-600">{Number(tp.meta_mensal_volume).toLocaleString('pt-BR')}</td>
                          <td className="text-right px-3 py-2.5 text-gray-600">{tp.dias_uteis_mensal}</td>
                          <td className="text-right px-3 py-2.5 text-gray-600">{Number(tp.meta_diaria_volume).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-4 py-2.5 text-gray-800">Total / Media</td>
                        <td className="text-right px-3 py-2.5 text-gray-700">
                          {teamParameters.length > 0 ? (teamParameters.reduce((s, tp) => s + (Number(tp.oee) || 0), 0) / teamParameters.length).toFixed(1) : 0}%
                        </td>
                        <td className="text-right px-3 py-2.5 text-gray-700">
                          {teamParameters.reduce((s, tp) => s + (Number(tp.capacidade_dia) || 0), 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="text-right px-3 py-2.5 text-gray-700">
                          {teamParameters.reduce((s, tp) => s + (Number(tp.meta_mensal_volume) || 0), 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="text-right px-3 py-2.5 text-gray-700">
                          {Math.max(...teamParameters.map(tp => Number(tp.dias_uteis_mensal) || 0))}
                        </td>
                        <td className="text-right px-3 py-2.5 text-gray-700">
                          {teamParameters.reduce((s, tp) => s + (Number(tp.meta_diaria_volume) || 0), 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Historico</h3>
                <p className="text-xs text-gray-400 mt-0.5">Periodos com referencias totais</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {allParameters.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma referencia total cadastrada</p>
                  </div>
                ) : (
                  allParameters.map((param) => (
                    <button
                      key={param.id}
                      onClick={() => setSelectedMonth(param.reference_month)}
                      className={`w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors ${
                        param.reference_month === selectedMonth ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${param.reference_month === selectedMonth ? 'text-blue-700' : 'text-gray-700'}`}>
                          {formatMonthLabel(param.reference_month)}
                        </span>
                        <span className="text-xs text-gray-400">OEE: {param.oee}%</span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[11px] text-gray-400">Meta: {Number(param.meta_mensal_volume).toLocaleString('pt-BR')} un</span>
                        <span className="text-[11px] text-gray-400">Dias: {param.dias_uteis_mensal}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {parameters && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Resumo Atual</h3>
                <div className="grid grid-cols-2 gap-2">
                  {INDICATOR_CONFIG.map((item) => {
                    const c = COLOR_MAP[item.color];
                    const val = Number((parameters as any)[item.key]) || 0;
                    const formatted = item.suffix === '%'
                      ? `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                      : val.toLocaleString('pt-BR');
                    return (
                      <div key={item.key} className={`${c.bg} border ${c.border} rounded-lg px-2.5 py-2 text-center`}>
                        <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className={`text-sm font-bold ${c.text}`}>{formatted}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
