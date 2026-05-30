import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Users, AlertCircle } from 'lucide-react';
import { teamService, type Team } from '../services/teamService';

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await teamService.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
      alert('Erro ao carregar equipes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }

    try {
      if (formData.id) {
        await teamService.update(formData.id, {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
        });
      } else {
        await teamService.create({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
        });
      }

      resetForm();
      loadTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Erro ao salvar equipe');
    }
  };

  const handleEdit = (team: Team) => {
    setFormData({
      id: team.id,
      name: team.name,
      description: team.description || '',
      is_active: team.is_active,
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão desta equipe?')) return;

    try {
      await teamService.delete(id);
      loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Erro ao excluir equipe. Verifique se não há funcionários vinculados a esta equipe.');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      is_active: true,
    });
    setIsFormVisible(false);
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestão de Equipes</h2>
            <p className="text-sm text-slate-500">Gerencie as equipes da empresa</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          {isFormVisible ? 'Cancelar' : 'Nova Equipe'}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-100">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            {formData.id ? 'Editar Equipe' : 'Nova Equipe'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ex: Equipe Alpha"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows={3}
                placeholder="Descreva o propósito e responsabilidades da equipe"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                {formData.id ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar equipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="text-sm text-slate-600">
              Total: <span className="font-bold text-slate-800">{filteredTeams.length}</span> equipe(s)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-medium">Nenhuma equipe encontrada</p>
                      <p className="text-sm text-slate-400">
                        {searchTerm ? 'Tente buscar por outro termo' : 'Clique em "Nova Equipe" para começar'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-800">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm">
                        {team.description || <span className="text-slate-400 italic">Sem descrição</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        team.is_active
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {team.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(team)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
