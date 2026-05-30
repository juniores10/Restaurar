import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, Clock, User, AlertCircle, CheckCircle, XCircle, Calendar, Search, ShieldCheck } from 'lucide-react';

interface GateRequest {
  id: string;
  person_type: 'employee' | 'visitor';
  employee_id: string | null;
  visitor_id: string | null;
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
  validator?: {
    name: string;
  };
}

export function GateValidation() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GateRequest | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    loadCurrentEmployee();
  }, []);

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
          authorizer:employees!gate_control_requests_authorized_by_fkey(name),
          validator:employees!gate_control_requests_validated_by_fkey(name)
        `)
        .eq('status', 'authorized')
        .order('authorized_at', { ascending: false });

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
    return matchesSearch;
  });

  const handleValidate = (request: GateRequest) => {
    setSelectedRequest(request);
    setValidationNotes('');
    setShowValidateModal(true);
  };

  const submitValidation = async () => {
    if (!selectedRequest || !currentEmployeeId) return;

    try {
      const { error } = await supabase
        .from('gate_control_requests')
        .update({
          status: 'validated',
          validated_by: currentEmployeeId,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await loadRequests();
      setShowValidateModal(false);
      setSelectedRequest(null);
      setValidationNotes('');
    } catch (error) {
      console.error('Error validating request:', error);
      alert('Erro ao validar solicitacao');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Validacao RH</h2>
            <p className="text-blue-200 text-sm">Valide solicitacoes autorizadas pelos gestores</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou matricula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="border-2 border-blue-200 rounded-xl p-4 hover:border-blue-300 transition-all bg-blue-50/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {(request.person_type === 'employee' ? request.employee?.photo_url : request.visitor?.photo_url) ? (
                    <img
                      src={request.person_type === 'employee' ? request.employee!.photo_url! : request.visitor!.photo_url!}
                      alt={request.person_type === 'employee' ? request.employee!.name : request.visitor!.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">
                    {request.person_type === 'employee' ? request.employee?.name : request.visitor?.name}
                  </h4>
                  {request.person_type === 'employee' ? (
                    <>
                      <p className="text-xs text-slate-600">Mat: {request.employee?.registration_number}</p>
                      {request.employee?.department && (
                        <p className="text-xs text-slate-500">{request.employee.department.description}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600">{request.visitor?.document_type}: {request.visitor?.document_number}</p>
                      {request.visitor?.company && (
                        <p className="text-xs text-slate-500">{request.visitor.company}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  {getTypeBadge(request.request_type)}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />
                    Aguardando
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(request.requested_datetime)}
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Motivo:</p>
                  <p className="text-sm text-slate-800">{request.reason}</p>
                </div>

                {request.authorization_notes && (
                  <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Obs. do Autorizador:</p>
                    <p className="text-sm text-green-800">{request.authorization_notes}</p>
                    {request.authorizer && (
                      <p className="text-xs text-green-600 mt-1">Por: {request.authorizer.name}</p>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <p className="text-xs text-slate-600">
                    <strong>Autorizado em:</strong> {request.authorized_at ? formatDateTime(request.authorized_at) : '-'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleValidate(request)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <ShieldCheck className="w-4 h-4" />
                Validar
              </button>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Nenhuma solicitacao aguardando validacao</p>
          </div>
        )}
      </div>

      {showValidateModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-100">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Validar Solicitacao</h3>
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
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Motivo:</strong> {selectedRequest.reason}
                </p>
                {selectedRequest.authorizer && (
                  <p className="text-sm text-slate-600">
                    <strong>Autorizado por:</strong> {selectedRequest.authorizer.name}
                  </p>
                )}
              </div>

              {selectedRequest.authorization_notes && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Observacoes do Autorizador:</p>
                  <p className="text-sm text-green-800">{selectedRequest.authorization_notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Observacoes da Validacao (opcional)
                </label>
                <textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Adicione observacoes sobre esta validacao..."
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowValidateModal(false)}
                className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submitValidation}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Confirmar Validacao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
