import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductivityCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductivityCategoryManagement() {
  const [categories, setCategories] = useState<ProductivityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductivityCategory | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#3b82f6',
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productivity_categories')
        .select('*')
        .order('code');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Preencha o código e nome da categoria');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('productivity_categories')
          .update({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('productivity_categories')
          .insert({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            is_active: formData.is_active
          });

        if (error) throw error;
      }

      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        alert('Já existe uma categoria com este código');
      } else {
        alert('Erro ao salvar categoria');
      }
    }
  };

  const handleEdit = (category: ProductivityCategory) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      is_active: category.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (category: ProductivityCategory) => {
    if (!confirm(`Deseja realmente excluir a categoria "${category.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('productivity_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#3b82f6',
      is_active: true
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categorias de Produtividade</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie as categorias utilizadas na planilha de produtividade (FO, FE, AT, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  {category.code}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      category.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>

            {category.description && (
              <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
              >
                <Trash2 className="w-3 h-3" />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Nenhuma categoria cadastrada</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeira categoria
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="Ex: FO, FE, AT"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código curto para identificação (ex: FO, FE, AT)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: FO - Folga"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da categoria"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex-1">
                    <div
                      className="px-4 py-2 rounded-lg text-white font-medium text-center"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.code || 'XX'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
