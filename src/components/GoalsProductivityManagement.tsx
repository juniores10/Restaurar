import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Save, X } from 'lucide-react';

interface ProductivityRange {
  id: string;
  name: string;
  color: string;
  min_percentage: number;
  max_percentage: number | null;
  display_order: number;
}

const colorConfig: Record<string, { bg: string; border: string; text: string; textLight: string; dot: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', textLight: 'text-red-600', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', textLight: 'text-orange-600', dot: 'bg-orange-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', textLight: 'text-green-600', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', textLight: 'text-blue-600', dot: 'bg-blue-500' },
};

export default function GoalsProductivityManagement() {
  const [ranges, setRanges] = useState<ProductivityRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; min: string; max: string }>({ name: '', min: '', max: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRanges();
  }, []);

  const loadRanges = async () => {
    try {
      const { data, error } = await supabase
        .from('productivity_ranges')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setRanges(data || []);
    } catch (error) {
      console.error('Error loading ranges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (range: ProductivityRange) => {
    setEditingId(range.id);
    setEditForm({
      name: range.name,
      min: range.min_percentage.toString(),
      max: range.max_percentage?.toString() || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ name: '', min: '', max: '' });
  };

  const handleSave = async (range: ProductivityRange) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('productivity_ranges')
        .update({
          name: editForm.name,
          min_percentage: parseFloat(editForm.min),
          max_percentage: editForm.max ? parseFloat(editForm.max) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', range.id);

      if (error) throw error;

      setRanges(prev => prev.map(r =>
        r.id === range.id
          ? { ...r, name: editForm.name, min_percentage: parseFloat(editForm.min), max_percentage: editForm.max ? parseFloat(editForm.max) : null }
          : r
      ));
      setEditingId(null);
      setEditForm({ name: '', min: '', max: '' });
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPercentageDisplay = (range: ProductivityRange): string => {
    if (range.max_percentage === null) {
      return `>= ${range.min_percentage}%`;
    }
    if (range.min_percentage === 0) {
      return `< ${range.max_percentage + 1}%`;
    }
    return `${range.min_percentage}% a ${range.max_percentage}%`;
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Faixas de Produtividade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ranges.map(range => {
            const colors = colorConfig[range.color] || colorConfig.blue;
            const isEditing = editingId === range.id;

            return (
              <div
                key={range.id}
                className={`relative p-4 ${colors.bg} border ${colors.border} rounded-lg`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min %</label>
                        <input
                          type="number"
                          value={editForm.min}
                          onChange={(e) => setEditForm(prev => ({ ...prev, min: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max %</label>
                        <input
                          type="number"
                          value={editForm.max}
                          onChange={(e) => setEditForm(prev => ({ ...prev, max: e.target.value }))}
                          placeholder="Sem limite"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSave(range)}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        Salvar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        <X className="w-3 h-3" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(range)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colors.dot}`}></div>
                      <div>
                        <p className={`font-medium ${colors.text}`}>{range.name}</p>
                        <p className={`text-sm ${colors.textLight}`}>{formatPercentageDisplay(range)}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
