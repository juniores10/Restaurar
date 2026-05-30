import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, ChevronDown, Settings2, Plus, Trash2, AlertCircle } from 'lucide-react';

interface Team {
  id: string;
  name: string;
}

interface ParameterRecord {
  id: string;
  team_id: string;
  reference_month: string;
  meta_diaria: number;
  oee: number;
  capacidade_dia: number;
  meta_mensal_volume: number;
  dias_uteis_mensal: number;
  meta_diaria_volume: number;
  ritmo_atual_volume: number;
  ritmo_atual_porcentagem: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const FIELD_LABELS: { key: keyof Omit<ParameterRecord, 'id' | 'team_id' | 'reference_month'>; label: string; suffix: string; description: string }[] = [
  { key: 'oee', label: 'OEE', suffix: '%', description: 'Overall Equipment Effectiveness' },
  { key: 'capacidade_dia', label: 'Capacidade/Dia', suffix: 'un', description: 'Capacidade de producao por dia' },
  { key: 'meta_mensal_volume', label: 'Meta Mensal (Volume)', suffix: 'un', description: 'Volume total da meta mensal' },
  { key: 'dias_uteis_mensal', label: 'Dias Uteis Mensal', suffix: 'dias', description: 'Quantidade de dias uteis no mes' },
  { key: 'meta_diaria_volume', label: 'Meta Diaria (Volume)', suffix: 'un', description: 'Volume da meta diaria' },
];

export function TeamProductivityReferences() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [parameters, setParameters] = useState<ParameterRecord | null>(null);
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
  const [allParameters, setAllParameters] = useState<ParameterRecord[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadAllParametersForTeam(selectedTeam);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTeam && selectedMonth) {
      loadParameters();
    }
  }, [selectedTeam, selectedMonth]);

  const loadTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name').order('name');
    setTeams(data || []);
  };

  const loadAllParametersForTeam = async (teamId: string) => {
    const { data } = await supabase
      .from('team_productivity_parameters')
      .select('*')
      .eq('team_id', teamId)
      .order('reference_month', { ascending: false });
    setAllParameters(data || []);
  };

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_productivity_parameters')
        .select('*')
        .eq('team_id', selectedTeam)
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
          oee: 0,
          capacidade_dia: 0,
          meta_mensal_volume: 0,
          dias_uteis_mensal: 0,
          meta_diaria_volume: 0,
        });
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    const numVal = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0;
    setFormData(prev => ({ ...prev, [key]: numVal }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!selectedTeam || !selectedMonth) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      if (parameters) {
        const { error } = await supabase
          .from('team_productivity_parameters')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', parameters.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_productivity_parameters')
          .insert({
            team_id: selectedTeam,
            reference_month: selectedMonth,
            ...formData,
            created_by: user?.id,
          });
        if (error) throw error;
      }
      await loadParameters();
      await loadAllParametersForTeam(selectedTeam);
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Referencias salvas com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving parameters:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir estas referencias?')) return;
    try {
      const { error } = await supabase
        .from('team_productivity_parameters')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadParameters();
      await loadAllParametersForTeam(selectedTeam);
      setSaveMessage({ type: 'success', text: 'Referencias excluidas com sucesso.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting parameters:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao excluir: ' + error.message });
    }
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Equipe</label>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8"
            >
              <option value="">Selecione...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {selectedTeam && (
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
        )}
      </div>

      {!selectedTeam && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Settings2 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Selecione uma equipe para configurar as referencias</p>
          <p className="text-sm text-gray-400 mt-1">As referencias sao usadas nos calculos do Dashboard.</p>
        </div>
      )}

      {selectedTeam && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Referencias - {formatMonthLabel(selectedMonth)}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {parameters ? 'Editar valores existentes' : 'Configurar novos valores para este periodo'}
                  </p>
                </div>
                {parameters && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Configurado</span>
                )}
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELD_LABELS.map((field) => (
                    <div key={field.key} className="group">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        {field.label}
                      </label>
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
                      <p className="text-[11px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{field.description}</p>
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
                        Excluir Referencias
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : parameters ? 'Atualizar Referencias' : 'Salvar Referencias'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Historico de Referencias</h3>
                <p className="text-xs text-gray-400 mt-0.5">Periodos ja configurados</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {allParameters.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma referencia cadastrada</p>
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
                        <span className="text-xs text-gray-400">
                          OEE: {param.oee}%
                        </span>
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
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
