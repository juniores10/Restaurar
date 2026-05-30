import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, Clock, User, AlertCircle, CheckCircle, XCircle, Filter, Calendar, Search, Plus, X, Users, Building, Phone, Mail, FileText, IdCard } from 'lucide-react';

interface GateRequest {
  id: string;
  employee_id: string | null;
  visitor_id: string | null;
  person_type: 'employee' | 'visitor';
  request_type: 'entry' | 'exit';
  reason: string;
  requested_datetime: string;
  status: 'pending' | 'authorized' | 'validated' | 'rejected';
  authorized_by: string | null;
  authorized_at: string | null;
  authorization_notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  validation_notes: string | null;
  created_at: string;
  employee?: {
    name: string;
    photo_url: string | null;
    registration_number: string;
    department?: { description: string };
  };
  visitor?: {
    name: string;
    document_type: string;
    document_number: string;
    company: string | null;
    photo_url: string | null;
  };
  authorizer?: {
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  registration_number: string;
  photo_url: string | null;
  department?: { description: string };
}

interface Visitor {
  id: string;
  name: string;
  document_type: string;
  document_number: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  notes: string | null;
  is_active: boolean;
}

export function GateControl() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GateRequest | null>(null);
  const [authNotes, setAuthNotes] = useState('');
  const [authAction, setAuthAction] = useState<'authorize' | 'reject'>('authorize');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [personType, setPersonType] = useState<'employee' | 'visitor'>('employee');
  const [newRequest, setNewRequest] = useState({
    person_id: '',
    request_type: 'exit' as 'entry' | 'exit',
    reason: '',
    requested_datetime: new Date().toISOString().slice(0, 16)
  });
  const [creating, setCreating] = useState(false);
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    document_type: 'CPF' as 'RG' | 'CPF' | 'CNH' | 'RNE' | 'Passaporte' | 'Outro',
    document_number: '',
    company: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [creatingVisitor, setCreatingVisitor] = useState(false);

  useEffect(() => {
    loadRequests();
    loadCurrentEmployee();
    loadEmployees();
    loadVisitors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.person-search-container')) {
        setShowPersonDropdown(false);
      }
    };

    if (showPersonDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonDropdown]);

  async function loadCurrentEmployee() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setCurrentEmployeeId(data.id);
      }
    }
  }

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          registration_number,
          photo_url,
          user_type_id,
          department:data_types!employees_department_id_fkey(description)
        `)
        .in('status', [0, 1, 2, 3])
        .neq('user_type_id', 1)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }

  async function loadVisitors() {
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error loading visitors:', error);
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gate_control_requests')
        .select(`
          *,
          employee:employees!gate_control_requests_employee_id_fkey(
            name,
            photo_url,
            registration_number,
            department:data_types!employees_department_id_fkey(description)
          ),
          visitor:visitors!gate_control_requests_visitor_id_fkey(
            name,
            document_type,
            document_number,
            company,
            photo_url
          ),
          authorizer:employees!gate_control_requests_authorized_by_fkey(name)
        `)
        .order('requested_datetime', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading gate requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = requests.filter(req => {
    const personName = req.person_type === 'employee' ? req.employee?.name : req.visitor?.name;
    const personDoc = req.person_type === 'employee' ? req.employee?.registration_number : req.visitor?.document_number;

    const matchesSearch = personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         personDoc?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesType = filterType === 'all' || req.request_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAuthorize = (request: GateRequest, action: 'authorize' | 'reject') => {
    setSelectedRequest(request);
    setAuthAction(action);
    setAuthNotes('');
    setShowAuthModal(true);
  };

  const submitAuthorization = async () => {
    if (!selectedRequest || !currentEmployeeId) return;

    try {
      const { error } = await supabase
        .from('gate_control_requests')
        .update({
          status: authAction === 'authorize' ? 'authorized' : 'rejected',
          authorized_by: currentEmployeeId,
          authorized_at: new Date().toISOString(),
          authorization_notes: authNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await loadRequests();
      setShowAuthModal(false);
      setSelectedRequest(null);
      setAuthNotes('');
    } catch (error) {
      console.error('Error authorizing request:', error);
      alert('Erro ao processar autorizacao');
    }
  };

  const handleCreateVisitor = async () => {
    if (!newVisitor.name.trim() || !newVisitor.document_number.trim()) {
      alert('Por favor, preencha nome e documento');
      return;
    }

    setCreatingVisitor(true);
    try {
      const { data, error } = await supabase
        .from('visitors')
        .insert({
          name: newVisitor.name.trim(),
          document_type: newVisitor.document_type,
          document_number: newVisitor.document_number.trim(),
          company: newVisitor.company.trim() || null,
          phone: newVisitor.phone.trim() || null,
          email: newVisitor.email.trim() || null,
          notes: newVisitor.notes.trim() || null,
          created_by: currentEmployeeId
        })
        .select()
        .single();

      if (error) throw error;

      alert('Visitante cadastrado com sucesso!');
      setShowVisitorModal(false);
      setNewVisitor({
        name: '',
        document_type: 'CPF',
        document_number: '',
        company: '',
        phone: '',
        email: '',
        notes: ''
      });
      await loadVisitors();

      setPersonType('visitor');
      setNewRequest({ ...newRequest, person_id: data.id });
      setPersonSearchTerm(`${data.name} - ${data.document_type}: ${data.document_number}`);
      setShowPersonDropdown(false);
    } catch (error) {
      console.error('Error creating visitor:', error);
      alert('Erro ao cadastrar visitante');
    } finally {
      setCreatingVisitor(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.person_id || !newRequest.reason.trim()) {
      alert('Por favor, preencha todos os campos obrigatorios');
      return;
    }

    setCreating(true);
    try {
      const requestData: any = {
        person_type: personType,
        request_type: newRequest.request_type,
        reason: newRequest.reason.trim(),
        requested_datetime: newRequest.requested_datetime,
        status: 'pending'
      };

      if (personType === 'employee') {
        requestData.employee_id = newRequest.person_id;
      } else {
        requestData.visitor_id = newRequest.person_id;
      }

      const { error } = await supabase
        .from('gate_control_requests')
        .insert(requestData);

      if (error) throw error;

      alert('Solicitacao criada com sucesso!');
      setShowCreateModal(false);
      setNewRequest({
        person_id: '',
        request_type: 'exit',
        reason: '',
        requested_datetime: new Date().toISOString().slice(0, 16)
      });
      setPersonType('employee');
      setPersonSearchTerm('');
      setShowPersonDropdown(false);
      await loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Erro ao criar solicitacao');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3.5 h-3.5" />
          Pendente
        </span>;
      case 'authorized':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Autorizado
        </span>;
      case 'validated':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Validado
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          Recusado
        </span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'entry' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <LogIn className="w-3.5 h-3.5" />
        Entrada
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <LogOut className="w-3.5 h-3.5" />
        Saida
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <LogOut className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Controle Portaria</h2>
              <p className="text-slate-200 text-sm">Autorize entrada e saida de colaboradores e visitantes</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-800 rounded-xl hover:bg-slate-100 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nova Solicitacao
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            >
              <option value="all">Todos Status</option>
              <option value="pending">Pendente</option>
              <option value="authorized">Autorizado</option>
              <option value="validated">Validado</option>
              <option value="rejected">Recusado</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            >
              <option value="all">Todos Tipos</option>
              <option value="entry">Entrada</option>
              <option value="exit">Saida</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map((request) => {
            const personName = request.person_type === 'employee' ? request.employee?.name : request.visitor?.name;
            const personPhoto = request.person_type === 'employee' ? request.employee?.photo_url : request.visitor?.photo_url;
            const personInfo = request.person_type === 'employee'
              ? `Mat: ${request.employee?.registration_number}${request.employee?.department ? ` - ${request.employee.department.description}` : ''}`
              : `${request.visitor?.document_type}: ${request.visitor?.document_number}${request.visitor?.company ? ` - ${request.visitor.company}` : ''}`;

            return (
              <div key={request.id} className="border-2 border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {personPhoto ? (
                      <img
                        src={personPhoto}
                        alt={personName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      request.person_type === 'employee' ? (
                        <User className="w-6 h-6 text-slate-400" />
                      ) : (
                        <Users className="w-6 h-6 text-slate-400" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 truncate">{personName}</h4>
                      {request.person_type === 'visitor' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Visitante
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{personInfo}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    {getTypeBadge(request.request_type)}
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(request.requested_datetime)}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-600 font-medium mb-1">Motivo:</p>
                    <p className="text-sm text-slate-800">{request.reason}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAuthorize(request, 'authorize')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Autorizar
                    </button>
                    <button
                      onClick={() => handleAuthorize(request, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Recusar
                    </button>
                  </div>
                )}

                {request.status !== 'pending' && request.authorization_notes && (
                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Observacoes:</p>
                    <p className="text-sm text-blue-800">{request.authorization_notes}</p>
                    {request.authorizer && (
                      <p className="text-xs text-blue-600 mt-1">Por: {request.authorizer.name}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Nenhuma solicitacao encontrada</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <Plus className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Nova Solicitacao de Portaria</h3>
                  <p className="text-sm text-slate-600">Cadastre uma nova solicitacao de entrada ou saida</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPersonSearchTerm('');
                  setShowPersonDropdown(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de Pessoa *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPersonType('employee');
                      setNewRequest({ ...newRequest, person_id: '' });
                      setPersonSearchTerm('');
                      setShowPersonDropdown(false);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                      personType === 'employee'
                        ? 'border-slate-600 bg-slate-50 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    disabled={creating}
                  >
                    <User className="w-5 h-5" />
                    Colaborador
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonType('visitor');
                      setNewRequest({ ...newRequest, person_id: '' });
                      setPersonSearchTerm('');
                      setShowPersonDropdown(false);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                      personType === 'visitor'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    disabled={creating}
                  >
                    <Users className="w-5 h-5" />
                    Visitante
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {personType === 'employee' ? 'Colaborador' : 'Visitante'} *
                  </label>
                  {personType === 'visitor' && (
                    <button
                      type="button"
                      onClick={() => setShowVisitorModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Cadastrar Novo
                    </button>
                  )}
                </div>
                <div className="relative person-search-container">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={personSearchTerm}
                      onChange={(e) => {
                        setPersonSearchTerm(e.target.value);
                        setShowPersonDropdown(true);
                      }}
                      onFocus={() => setShowPersonDropdown(true)}
                      placeholder={personType === 'employee' ? 'Buscar por nome ou matrícula...' : 'Buscar por nome ou documento...'}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      disabled={creating}
                    />
                  </div>
                  {showPersonDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {personType === 'employee' ? (
                        employees
                          .filter(emp =>
                            emp.name.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                            emp.registration_number.includes(personSearchTerm)
                          )
                          .map((emp) => {
                            const isSelected = newRequest.person_id === emp.id;
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setNewRequest({ ...newRequest, person_id: emp.id });
                                  setPersonSearchTerm(`${emp.name} - Mat: ${emp.registration_number}`);
                                  setShowPersonDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                                  isSelected ? 'bg-slate-50' : ''
                                }`}
                                disabled={creating}
                              >
                                <div className="font-medium text-slate-800">{emp.name}</div>
                                <div className="text-sm text-slate-600">
                                  Mat: {emp.registration_number}
                                  {emp.department ? ` - ${emp.department.description}` : ''}
                                </div>
                              </button>
                            );
                          })
                      ) : (
                        visitors
                          .filter(vis =>
                            vis.name.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                            vis.document_number.includes(personSearchTerm)
                          )
                          .map((vis) => {
                            const isSelected = newRequest.person_id === vis.id;
                            return (
                              <button
                                key={vis.id}
                                type="button"
                                onClick={() => {
                                  setNewRequest({ ...newRequest, person_id: vis.id });
                                  setPersonSearchTerm(`${vis.name} - ${vis.document_type}: ${vis.document_number}`);
                                  setShowPersonDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                                  isSelected ? 'bg-slate-50' : ''
                                }`}
                                disabled={creating}
                              >
                                <div className="font-medium text-slate-800">{vis.name}</div>
                                <div className="text-sm text-slate-600">
                                  {vis.document_type}: {vis.document_number}
                                  {vis.company ? ` - ${vis.company}` : ''}
                                </div>
                              </button>
                            );
                          })
                      )}
                      {personType === 'employee' && employees.filter(emp =>
                        emp.name.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                        emp.registration_number.includes(personSearchTerm)
                      ).length === 0 && (
                        <div className="px-4 py-3 text-center text-slate-500">
                          Nenhum colaborador encontrado
                        </div>
                      )}
                      {personType === 'visitor' && visitors.filter(vis =>
                        vis.name.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
                        vis.document_number.includes(personSearchTerm)
                      ).length === 0 && (
                        <div className="px-4 py-3 text-center text-slate-500">
                          Nenhum visitante encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de Solicitacao *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRequest({ ...newRequest, request_type: 'entry' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                      newRequest.request_type === 'entry'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    disabled={creating}
                  >
                    <LogIn className="w-5 h-5" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRequest({ ...newRequest, request_type: 'exit' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                      newRequest.request_type === 'exit'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    disabled={creating}
                  >
                    <LogOut className="w-5 h-5" />
                    Saida
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  value={newRequest.requested_datetime}
                  onChange={(e) => setNewRequest({ ...newRequest, requested_datetime: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Motivo *
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Descreva o motivo da solicitacao..."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
                  rows={4}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPersonSearchTerm('');
                  setShowPersonDropdown(false);
                }}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={creating || !newRequest.person_id || !newRequest.reason.trim()}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Criar Solicitacao
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVisitorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Cadastrar Novo Visitante</h3>
                  <p className="text-sm text-slate-600">Preencha os dados do visitante</p>
                </div>
              </div>
              <button
                onClick={() => setShowVisitorModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  placeholder="Nome completo do visitante"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={creatingVisitor}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo de Documento *
                  </label>
                  <select
                    value={newVisitor.document_type}
                    onChange={(e) => setNewVisitor({ ...newVisitor, document_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={creatingVisitor}
                  >
                    <option value="CPF">CPF</option>
                    <option value="RG">RG</option>
                    <option value="CNH">CNH</option>
                    <option value="RNE">RNE</option>
                    <option value="Passaporte">Passaporte</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Numero do Documento *
                  </label>
                  <input
                    type="text"
                    value={newVisitor.document_number}
                    onChange={(e) => setNewVisitor({ ...newVisitor, document_number: e.target.value })}
                    placeholder="Numero do documento"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={creatingVisitor}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Empresa
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={newVisitor.company}
                    onChange={(e) => setNewVisitor({ ...newVisitor, company: e.target.value })}
                    placeholder="Empresa que representa"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={creatingVisitor}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={newVisitor.phone}
                      onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={creatingVisitor}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      value={newVisitor.email}
                      onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={creatingVisitor}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Observacoes
                </label>
                <textarea
                  value={newVisitor.notes}
                  onChange={(e) => setNewVisitor({ ...newVisitor, notes: e.target.value })}
                  placeholder="Informacoes adicionais sobre o visitante..."
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows={3}
                  disabled={creatingVisitor}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVisitorModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                disabled={creatingVisitor}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateVisitor}
                disabled={creatingVisitor || !newVisitor.name.trim() || !newVisitor.document_number.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingVisitor ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Cadastrar e Usar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${authAction === 'authorize' ? 'bg-green-100' : 'bg-red-100'}`}>
                {authAction === 'authorize' ? (
                  <CheckCircle className={`w-6 h-6 ${authAction === 'authorize' ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {authAction === 'authorize' ? 'Autorizar Solicitacao' : 'Recusar Solicitacao'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedRequest.person_type === 'employee' ? selectedRequest.employee?.name : selectedRequest.visitor?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Tipo:</strong> {selectedRequest.request_type === 'entry' ? 'Entrada' : 'Saida'}
                </p>
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Data/Hora:</strong> {formatDateTime(selectedRequest.requested_datetime)}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Motivo:</strong> {selectedRequest.reason}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Observacoes {authAction === 'reject' && '(obrigatorio)'}
                </label>
                <textarea
                  value={authNotes}
                  onChange={(e) => setAuthNotes(e.target.value)}
                  placeholder="Adicione observacoes sobre esta decisao..."
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
                  rows={3}
                  required={authAction === 'reject'}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submitAuthorization}
                disabled={authAction === 'reject' && !authNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition-colors ${
                  authAction === 'authorize'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
