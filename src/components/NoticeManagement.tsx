import { useState, useEffect } from 'react';
import { Bell, Plus, X, Search, Calendar, Users, User, Building2, Upload, FileText, Trash2, Eye, Download, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notice {
  id: string;
  title: string;
  description: string;
  status: number;
  is_for_all: boolean;
  department_id: string | null;
  employee_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  created_by: string;
  department?: { description: string };
  employee?: { name: string };
  creator?: { name: string };
  view_count?: number;
  target_count?: number;
}

interface Department {
  id: string;
  description: string;
}

interface Employee {
  id: string;
  name: string;
  department_id?: string;
}

interface ViewDetails {
  viewed: { id: string; name: string; viewed_at: string }[];
  notViewed: { id: string; name: string }[];
}

export function NoticeManagement() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | 'all'>('all');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    target_type: 'all',
    department_id: '',
    employee_id: '',
    file: null as File | null,
  });

  const [showViewDetails, setShowViewDetails] = useState(false);
  const [viewDetails, setViewDetails] = useState<ViewDetails | null>(null);
  const [viewDetailsTitle, setViewDetailsTitle] = useState('');
  const [loadingViewDetails, setLoadingViewDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadNotices(),
        loadDepartments(),
        loadEmployees(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`
          *,
          department:data_types!notices_department_id_fkey(description),
          employee:employees!notices_employee_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: viewCounts } = await supabase
        .from('notice_views')
        .select('notice_id');

      const viewCountMap: Record<string, number> = {};
      (viewCounts || []).forEach(v => {
        viewCountMap[v.notice_id] = (viewCountMap[v.notice_id] || 0) + 1;
      });

      const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, department_id')
        .in('status', [0, 1, 2, 3]);

      const noticesWithCounts = (data || []).map(notice => {
        let targetCount = 0;

        if (notice.is_for_all) {
          targetCount = allEmployees?.length || 0;
        } else if (notice.employee_id) {
          targetCount = 1;
        } else if (notice.department_id) {
          targetCount = allEmployees?.filter(e => e.department_id === notice.department_id).length || 0;
        }

        return {
          ...notice,
          view_count: viewCountMap[notice.id] || 0,
          target_count: targetCount,
        };
      });

      setNotices(noticesWithCounts);
    } catch (error) {
      console.error('Error loading notices:', error);
      alert('Erro ao carregar avisos');
    }
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('data_types')
        .select('id, description')
        .eq('type', 2)
        .eq('status', 0)
        .order('description');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
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

  const loadViewDetails = async (notice: Notice) => {
    setLoadingViewDetails(true);
    setShowViewDetails(true);
    setViewDetailsTitle(notice.title);

    try {
      const { data: views, error: viewsError } = await supabase
        .from('notice_views')
        .select(`
          employee_id,
          viewed_at,
          employee:employees!notice_views_employee_id_fkey(id, name)
        `)
        .eq('notice_id', notice.id);

      if (viewsError) throw viewsError;

      const { data: allEmployees, error: empError } = await supabase
        .from('employees')
        .select('id, name, department_id')
        .in('status', [0, 1, 2, 3]);

      if (empError) throw empError;

      let targetEmployees: typeof allEmployees = [];
      if (notice.is_for_all) {
        targetEmployees = allEmployees || [];
      } else if (notice.employee_id) {
        targetEmployees = (allEmployees || []).filter(e => e.id === notice.employee_id);
      } else if (notice.department_id) {
        targetEmployees = (allEmployees || []).filter(e => e.department_id === notice.department_id);
      }

      const viewedIds = new Set((views || []).map(v => v.employee_id));

      const viewed = (views || [])
        .filter(v => v.employee)
        .map(v => ({
          id: v.employee_id,
          name: (v.employee as { name: string }).name,
          viewed_at: v.viewed_at,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const notViewed = targetEmployees
        .filter(e => !viewedIds.has(e.id))
        .map(e => ({ id: e.id, name: e.name }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setViewDetails({ viewed, notViewed });
    } catch (error) {
      console.error('Error loading view details:', error);
      alert('Erro ao carregar detalhes de visualizacao');
      setShowViewDetails(false);
    } finally {
      setLoadingViewDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Por favor, preencha título e descrição');
      return;
    }

    if (formData.target_type === 'department' && !formData.department_id) {
      alert('Por favor, selecione um departamento/setor');
      return;
    }

    if (formData.target_type === 'employee' && !formData.employee_id) {
      alert('Por favor, selecione um colaborador');
      return;
    }

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (formData.file) {
        setUploading(true);
        const fileExt = formData.file.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('notice-attachments')
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('notice-attachments')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = formData.file.name;
        fileType = formData.file.type;
        setUploading(false);
      }

      if (formData.id) {
        const updateData: Record<string, unknown> = {
          title: formData.title,
          description: formData.description,
          is_for_all: formData.target_type === 'all',
          department_id: formData.target_type === 'department' ? formData.department_id : null,
          employee_id: formData.target_type === 'employee' ? formData.employee_id : null,
        };

        if (fileUrl) {
          updateData.file_url = fileUrl;
          updateData.file_name = fileName;
          updateData.file_type = fileType;
        }

        const { error } = await supabase
          .from('notices')
          .update(updateData)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        const noticeData = {
          title: formData.title,
          description: formData.description,
          is_for_all: formData.target_type === 'all',
          department_id: formData.target_type === 'department' ? formData.department_id : null,
          employee_id: formData.target_type === 'employee' ? formData.employee_id : null,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          status: 0,
          created_by: user?.id,
        };

        const { error } = await supabase
          .from('notices')
          .insert([noticeData]);

        if (error) throw error;
      }

      await loadNotices();
      resetForm();
      alert(formData.id ? 'Aviso atualizado com sucesso!' : 'Aviso criado com sucesso!');
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Erro ao salvar aviso');
      setUploading(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    let targetType = 'all';
    if (notice.department_id) targetType = 'department';
    if (notice.employee_id) targetType = 'employee';

    setFormData({
      id: notice.id,
      title: notice.title,
      description: notice.description,
      target_type: targetType,
      department_id: notice.department_id || '',
      employee_id: notice.employee_id || '',
      file: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Erro ao excluir aviso');
    }
  };

  const toggleStatus = async (id: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 0;
      const { error } = await supabase
        .from('notices')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await loadNotices();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      target_type: 'all',
      department_id: '',
      employee_id: '',
      file: null,
    });
    setShowForm(false);
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTargetText = (notice: Notice) => {
    if (notice.is_for_all) return 'Todos os colaboradores';
    if (notice.department_id && notice.department) return `Departamento/Setor: ${notice.department.description}`;
    if (notice.employee_id && notice.employee) return `Colaborador: ${notice.employee.name}`;
    return 'Não definido';
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Quadro de Avisos</h2>
            <p className="text-gray-600 mt-1">Gerencie os avisos do sistema</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancelar' : 'Novo Aviso'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar avisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="0">Ativos</option>
            <option value="1">Inativos</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {formData.id ? 'Editar Aviso' : 'Novo Aviso'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinatários *
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target_type"
                    value="all"
                    checked={formData.target_type === 'all'}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value, department_id: '', employee_id: '' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Todos os colaboradores</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target_type"
                    value="department"
                    checked={formData.target_type === 'department'}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value, employee_id: '' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span>Departamento/Setor específico</span>
                </label>

                {formData.target_type === 'department' && (
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="ml-6 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um departamento/setor</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.description}</option>
                    ))}
                  </select>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target_type"
                    value="employee"
                    checked={formData.target_type === 'employee'}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value, department_id: '' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Colaborador específico</span>
                </label>

                {formData.target_type === 'employee' && (
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="ml-6 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um colaborador</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexo (opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formData.file ? formData.file.name : 'Clique para selecionar arquivo (PDF, Word, Imagem)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                </label>
                {formData.file && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, file: null })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: PDF, Word (DOC/DOCX), Imagens (JPG, PNG, WebP)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Enviando...' : formData.id ? 'Atualizar Aviso' : 'Criar Aviso'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum aviso encontrado</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                notice.status === 0 ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{notice.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        notice.status === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {notice.status === 0 ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{notice.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{getTargetText(notice)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(notice.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {notice.view_count === notice.target_count && notice.target_count && notice.target_count > 0 ? (
                      <button
                        onClick={() => loadViewDetails(notice)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Todos visualizaram ({notice.target_count})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => loadViewDetails(notice)}
                        className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>
                          {(notice.target_count || 0) - (notice.view_count || 0)} de {notice.target_count || 0} faltam visualizar
                        </span>
                      </button>
                    )}
                    {notice.file_url && (
                      <a
                        href={notice.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{notice.file_name}</span>
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleStatus(notice.id, notice.status)}
                    className={`p-2 rounded-lg transition-colors ${
                      notice.status === 0
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={notice.status === 0 ? 'Desativar' : 'Ativar'}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(notice)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Editar"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showViewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
              <div>
                <h3 className="text-lg font-bold text-white">Detalhes de Visualizacao</h3>
                <p className="text-blue-100 text-sm truncate max-w-xs">{viewDetailsTitle}</p>
              </div>
              <button
                onClick={() => {
                  setShowViewDetails(false);
                  setViewDetails(null);
                }}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingViewDetails ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Carregando...</p>
              </div>
            ) : viewDetails && (
              <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-red-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">
                      Faltam Visualizar ({viewDetails.notViewed.length})
                    </h4>
                  </div>
                  {viewDetails.notViewed.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-10">Todos visualizaram!</p>
                  ) : (
                    <div className="space-y-2 ml-10">
                      {viewDetails.notViewed.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center">
                            <User className="w-3 h-3 text-red-700" />
                          </div>
                          <span className="text-sm text-gray-700">{emp.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">
                      Visualizaram ({viewDetails.viewed.length})
                    </h4>
                  </div>
                  {viewDetails.viewed.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-10">Nenhuma visualizacao ainda</p>
                  ) : (
                    <div className="space-y-2 ml-10">
                      {viewDetails.viewed.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-green-700" />
                            </div>
                            <span className="text-sm text-gray-700">{emp.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(emp.viewed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
