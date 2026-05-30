import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Save, X, Trash2, Activity } from 'lucide-react';

interface PerformanceAdherence {
  id: string;
  name: string;
  green_min: number;
  yellow_min: number;
  yellow_max: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormState {
  name: string;
  green_min: string;
  yellow_min: string;
  yellow_max: string;
  is_active: boolean;
}

const defaultForm: FormState = {
  name: '',
  green_min: '80',
  yellow_min: '75',
  yellow_max: '79.9',
  is_active: true,
};

function getAdherenceColor(value: number, item: PerformanceAdherence): { bg: string; text: string; label: string } {
  if (value >= item.green_min) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Verde' };
  if (value >= item.yellow_min && value <= item.yellow_max) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Amarelo' };
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'Vermelho' };
}

export default function PerformanceAdherenceManagement() {
  const [items, setItems] = useState<PerformanceAdherence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('performance_adherence')
        .select('*')
        .order('name');
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading performance adherence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: PerformanceAdherence) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      green_min: item.green_min.toString(),
      yellow_min: item.yellow_min.toString(),
      yellow_max: item.yellow_max.toString(),
      is_active: item.is_active,
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(defaultForm);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Informe o nome do perfil.';
    const green = parseFloat(form.green_min);
    const yMin = parseFloat(form.yellow_min);
    const yMax = parseFloat(form.yellow_max);
    if (isNaN(green) || isNaN(yMin) || isNaN(yMax)) return 'Preencha todos os valores percentuais.';
    if (yMin >= green) return 'O minimo amarelo deve ser menor que o minimo verde.';
    if (yMax >= green) return 'O maximo amarelo deve ser menor que o minimo verde.';
    if (yMin > yMax) return 'O minimo amarelo deve ser menor ou igual ao maximo amarelo.';
    return null;
  };

  const handleSave = async (id?: string) => {
    const error = validateForm();
    if (error) { alert(error); return; }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        green_min: parseFloat(form.green_min),
        yellow_min: parseFloat(form.yellow_min),
        yellow_max: parseFloat(form.yellow_max),
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error: err } = await supabase
          .from('performance_adherence')
          .update(payload)
          .eq('id', id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('performance_adherence')
          .insert(payload);
        if (err) throw err;
      }
      await loadItems();
      handleCancel();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;
    try {
      const { error } = await supabase.from('performance_adherence').delete().eq('id', id);
      if (error) throw error;
      await loadItems();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Erro ao excluir. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Performance Aderencia</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configure os perfis de faixas de aderencia e suas cores</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setForm(defaultForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Perfil
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">Regra de Cores por Aderencia</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                <span className="text-sm text-blue-700">Verde: Aderencia &ge; 80%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                <span className="text-sm text-blue-700">Amarelo: 75% a 79,9%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span className="text-sm text-blue-700">Vermelho: Abaixo de 74,9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h4 className="font-semibold text-gray-800 mb-4">Novo Perfil de Aderencia</h4>
          <AdherenceForm form={form} setForm={setForm} onSave={() => handleSave()} onCancel={handleCancel} isSaving={isSaving} />
        </div>
      )}

      {items.length === 0 && !showAddForm ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum perfil cadastrado ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Clique em "Novo Perfil" para comecar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {editingId === item.id ? (
                <div className="p-5">
                  <h4 className="font-semibold text-gray-800 mb-4">Editar Perfil</h4>
                  <AdherenceForm
                    form={form}
                    setForm={setForm}
                    onSave={() => handleSave(item.id)}
                    onCancel={handleCancel}
                    isSaving={isSaving}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <ColorBand
                      color="green"
                      label="Verde"
                      description={`Aderencia >= ${item.green_min}%`}
                    />
                    <ColorBand
                      color="yellow"
                      label="Amarelo"
                      description={`${item.yellow_min}% a ${item.yellow_max}%`}
                    />
                    <ColorBand
                      color="red"
                      label="Vermelho"
                      description={`Abaixo de ${item.yellow_min}%`}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorBand({ color, label, description }: { color: 'green' | 'yellow' | 'red'; label: string; description: string }) {
  const styles = {
    green: { dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', sub: 'text-green-600' },
    yellow: { dot: 'bg-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', sub: 'text-yellow-600' },
    red: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', sub: 'text-red-600' },
  };
  const s = styles[color];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${s.bg} border ${s.border}`}>
      <span className={`w-3 h-3 rounded-full shrink-0 ${s.dot}`}></span>
      <div>
        <span className={`text-sm font-medium ${s.text}`}>{label}</span>
        <span className={`text-xs ml-2 ${s.sub}`}>{description}</span>
      </div>
    </div>
  );
}

function AdherenceForm({
  form,
  setForm,
  onSave,
  onCancel,
  isSaving,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Perfil *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Ex: Padrao, Operacional, Administrativo"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
              Min Verde (%)
            </span>
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.green_min}
            onChange={(e) => setForm({ ...form, green_min: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
              Min Amarelo (%)
            </span>
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.yellow_min}
            onChange={(e) => setForm({ ...form, yellow_min: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
              Max Amarelo (%)
            </span>
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.yellow_max}
            onChange={(e) => setForm({ ...form, yellow_max: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">Perfil ativo</label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
