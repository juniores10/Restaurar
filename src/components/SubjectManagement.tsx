import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Subject {
  id: string;
  status: number;
  description: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
}

export function SubjectManagement() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    abbreviation: '',
    status: 0,
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('description');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      alert('Erro ao carregar assuntos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert('Descrição do assunto é obrigatória');
      return;
    }

    try {
      if (formData.id) {
        const { error } = await supabase
          .from('subjects')
          .update({
            description: formData.description,
            abbreviation: formData.abbreviation,
            status: formData.status,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert([{
            description: formData.description,
            abbreviation: formData.abbreviation,
            status: formData.status,
            created_by: user?.id,
          }]);

        if (error) throw error;
      }

      resetForm();
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Erro ao salvar assunto');
    }
  };

  const handleEdit = (subject: Subject) => {
    setFormData({
      id: subject.id,
      description: subject.description,
      abbreviation: subject.abbreviation || '',
      status: subject.status,
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão deste assunto?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Erro ao excluir assunto');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      description: '',
      abbreviation: '',
      status: 0,
    });
    setIsFormVisible(false);
  };

  const getStatusLabel = (status: number) => {
    const labels = ['Normal', 'Bloqueado', 'Suspenso', 'Cancelado'];
    return labels[status] || 'Normal';
  };

  const filteredSubjects = subjects.filter(s =>
    s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Assuntos</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isFormVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {isFormVisible ? 'Ocultar' : 'Mostrar'} Formulário
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsFormVisible(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Novo Assunto
          </button>
        </div>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Assunto *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sigla
              </label>
              <input
                type="text"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>Normal</option>
                <option value={1}>Bloqueado</option>
                <option value={2}>Suspenso</option>
                <option value={3}>Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {formData.id ? 'Atualizar' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descrição ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sigla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inclusão</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alteração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getStatusLabel(subject.status)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {subject.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {subject.abbreviation}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {new Date(subject.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {subject.updated_at ? new Date(subject.updated_at).toLocaleString('pt-BR') : '-'}
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
