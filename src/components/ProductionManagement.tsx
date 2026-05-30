import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SectorProductivityUpload } from './SectorProductivityUpload';
import { EmployeeProductivity } from './EmployeeProductivity';
import ProductionDashboard from './ProductionDashboard';

interface Production {
  id: string;
  status: number;
  production_type: number;
  employee_id: string;
  subject_id: string;
  production_date: string;
  quantity: number;
  notes: string;
  employee_name?: string;
  subject_description?: string;
}

export function ProductionManagement() {
  const { user, employeeProfile, canManageSystem } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'sector' | 'dashboard'>('sector');
  const [productions, setProductions] = useState<Production[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    employee_id: '',
    subject_id: '',
    production_date: new Date().toISOString().split('T')[0],
    quantity: 0,
    production_type: 0,
    status: 0,
    notes: '',
  });

  useEffect(() => {
    loadProductions();
    loadEmployees();
    loadSubjects();
  }, [filterMonth]);

  const loadProductions = async () => {
    try {
      let query = supabase
        .from('production')
        .select(`
          *,
          employees (name),
          subjects (description)
        `)
        .order('production_date', { ascending: false });

      if (!canManageSystem() && employeeProfile) {
        query = query.eq('employee_id', employeeProfile.id);
      }

      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        query = query.gte('production_date', startDate).lte('production_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProductions(data.map(p => ({
        ...p,
        employee_name: p.employees?.name || 'Sem funcionário',
        subject_description: p.subjects?.description || 'Sem assunto'
      })));
    } catch (error) {
      console.error('Error loading productions:', error);
      alert('Erro ao carregar produtividade');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .in('status', [0, 1, 2, 3])
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, description')
        .eq('status', 0)
        .order('description');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      alert('Selecione um funcionário');
      return;
    }

    try {
      if (formData.id) {
        const { error } = await supabase
          .from('production')
          .update({
            ...formData,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('production')
          .insert([{
            ...formData,
            created_by: user?.id,
          }]);

        if (error) throw error;
      }

      resetForm();
      loadProductions();
    } catch (error) {
      console.error('Error saving production:', error);
      alert('Erro ao salvar produtividade');
    }
  };

  const handleEdit = (production: Production) => {
    setFormData({
      id: production.id,
      employee_id: production.employee_id,
      subject_id: production.subject_id || '',
      production_date: production.production_date,
      quantity: production.quantity,
      production_type: production.production_type,
      status: production.status,
      notes: production.notes || '',
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão deste registro?')) return;

    try {
      const { error } = await supabase
        .from('production')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadProductions();
    } catch (error) {
      console.error('Error deleting production:', error);
      alert('Erro ao excluir registro');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      employee_id: '',
      subject_id: '',
      production_date: new Date().toISOString().split('T')[0],
      quantity: 0,
      production_type: 0,
      status: 0,
      notes: '',
    });
    setIsFormVisible(false);
  };

  const getTypeLabel = (type: number) => {
    const labels = [
      'Normal', 'Folga', 'Férias', 'Afastamento Médico', 'Licença Médica',
      'Trabalho Interno', 'Dupla', 'Falta sem Justificar', 'Divulgação Externa',
      'Treinamentos e Cursos', 'Dupla na Expansão'
    ];
    return labels[type] || 'Normal';
  };

  const filteredProductions = productions.filter(p =>
    p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canManageSystem()) {
    return <EmployeeProductivity />;
  }

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestao de Produtividade</h2>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sector')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'sector'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            Produtividade por Departamento/Setor
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard Gerencial
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <ProductionDashboard />
      ) : activeTab === 'sector' ? (
        <SectorProductivityUpload />
      ) : (
      <div>
      <div className="mb-6 flex justify-end items-center">
        {canManageSystem() && (
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
              Novo Registro
            </button>
          </div>
        )}
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto *
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Selecione assunto...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funcionário *
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Selecione funcionário...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade *
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.');
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) || e.target.value === '' || e.target.value === '0') {
                    setFormData({ ...formData, quantity: e.target.value === '' ? 0 : numValue });
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(',', '.');
                  const numValue = parseFloat(value) || 0;
                  setFormData({ ...formData, quantity: numValue });
                }}
                placeholder="0 ou 0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={formData.production_type}
                onChange={(e) => setFormData({ ...formData, production_type: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>Normal</option>
                <option value={1}>Folga</option>
                <option value={2}>Férias</option>
                <option value={3}>Afastamento Médico</option>
                <option value={4}>Licença Médica</option>
                <option value={5}>Trabalho Interno</option>
                <option value={6}>Dupla</option>
                <option value={7}>Falta sem Justificar</option>
                <option value={8}>Divulgação Externa</option>
                <option value={9}>Treinamentos e Cursos</option>
                <option value={10}>Dupla na Expansão</option>
              </select>
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observação
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
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
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por funcionário ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Filtrar por mês"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assunto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProductions.map((production) => (
                <tr key={production.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {canManageSystem() && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(production)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(production.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {new Date(production.production_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {production.employee_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {production.subject_description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getTypeLabel(production.production_type)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {production.quantity.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {production.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
