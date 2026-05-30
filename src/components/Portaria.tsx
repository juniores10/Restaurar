import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, Clock, User, CheckCircle, XCircle, Calendar, Search, Shield, AlertCircle, History } from 'lucide-react';

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
}

export function Portaria() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isTerceirizado, setIsTerceirizado] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    checkUserType();
  }, []);

  useEffect(() => {
    if (currentEmployeeId !== null) {
      loadRequests();

      let interval: NodeJS.Timeout | null = null;
      if (autoRefresh && viewMode === 'today') {
        interval = setInterval(() => {
          loadRequests();
        }, 5000);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoRefresh, viewMode, selectedMonth, selectedDate, currentEmployeeId]);

  async function checkUserType() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id, user_type_id')
          .eq('auth_user_id', user.id)
          .single();

        if (employee) {
          setCurrentEmployeeId(employee.id);
          if (employee.user_type_id === 4) {
            setIsTerceirizado(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);

      let query = supabase
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
          )
        `);


      if (viewMode === 'today') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        query = query.gte('requested_datetime', startOfDay.toISOString());
      } else if (viewMode === 'history') {
        if (selectedDate) {
          const startOfDay = new Date(selectedDate + 'T00:00:00');
          const endOfDay = new Date(selectedDate + 'T23:59:59');
          query = query
            .gte('requested_datetime', startOfDay.toISOString())
            .lte('requested_datetime', endOfDay.toISOString());
        } else if (selectedMonth) {
          const [year, month] = selectedMonth.split('-');
          const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
          const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
          query = query
            .gte('requested_datetime', startOfMonth.toISOString())
            .lte('requested_datetime', endOfMonth.toISOString());
        }
      }

      const { data, error } = await query.order('requested_datetime', { ascending: false });

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'PENDENTE',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          icon: <Clock className="w-6 h-6" />,
          badge: 'bg-yellow-500',
          authorized: false
        };
      case 'authorized':
        return {
          label: 'AUTORIZADO',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: <CheckCircle className="w-6 h-6" />,
          badge: 'bg-blue-500',
          authorized: true
        };
      case 'validated':
        return {
          label: 'VALIDADO',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          icon: <CheckCircle className="w-6 h-6" />,
          badge: 'bg-green-500',
          authorized: true
        };
      case 'rejected':
        return {
          label: 'NAO AUTORIZADO',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          icon: <XCircle className="w-6 h-6" />,
          badge: 'bg-red-500',
          authorized: false
        };
      default:
        return {
          label: 'DESCONHECIDO',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: <AlertCircle className="w-6 h-6" />,
          badge: 'bg-gray-500',
          authorized: false
        };
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'entry' ? (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white">
        <LogIn className="w-5 h-5" />
        ENTRADA
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 text-white">
        <LogOut className="w-5 h-5" />
        SAIDA
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
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
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Portaria</h2>
              <p className="text-slate-300 text-sm">
                {viewMode === 'today' ? 'Monitoramento em tempo real' : 'Histórico de solicitações'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'today' && !isTerceirizado && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-slate-300">
                    {autoRefresh ? 'Atualizacao automatica' : 'Pausado'}
                  </span>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  {autoRefresh ? 'Pausar' : 'Ativar'}
                </button>
              </>
            )}
          </div>
        </div>

        {isTerceirizado && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('today');
                  setAutoRefresh(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  viewMode === 'today'
                    ? 'bg-white text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                Hoje
              </button>
              <button
                onClick={() => {
                  setViewMode('history');
                  setAutoRefresh(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  viewMode === 'history'
                    ? 'bg-white text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Histórico
              </button>

              {viewMode === 'history' && (
                <>
                  <div className="flex items-center gap-2 ml-4">
                    <label className="text-sm font-medium">Mês:</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedDate('');
                      }}
                      className="px-3 py-2 bg-white/90 text-slate-800 rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ou Data:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        if (e.target.value) {
                          setSelectedMonth('');
                        }
                      }}
                      className="px-3 py-2 bg-white/90 text-slate-800 rounded-lg border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((request) => {
            const statusInfo = getStatusInfo(request.status);
            return (
              <div
                key={request.id}
                className={`border-4 ${statusInfo.borderColor} rounded-2xl p-6 ${statusInfo.bgColor} transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      {(request.person_type === 'employee' ? request.employee?.photo_url : request.visitor?.photo_url) ? (
                        <img
                          src={request.person_type === 'employee' ? request.employee!.photo_url! : request.visitor!.photo_url!}
                          alt={request.person_type === 'employee' ? request.employee!.name : request.visitor!.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-slate-800">
                        {request.person_type === 'employee' ? request.employee?.name : request.visitor?.name}
                      </h4>
                      {request.person_type === 'employee' ? (
                        <>
                          <p className="text-sm text-slate-600 font-medium">Mat: {request.employee?.registration_number}</p>
                          {request.employee?.department && (
                            <p className="text-xs text-slate-500">{request.employee.department.description}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600 font-medium">{request.visitor?.document_type}: {request.visitor?.document_number}</p>
                          {request.visitor?.company && (
                            <p className="text-xs text-slate-500">{request.visitor.company}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                    {statusInfo.icon}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getTypeBadge(request.request_type)}
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-lg font-bold">{formatTime(request.requested_datetime)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{formatDateTime(request.requested_datetime)}</p>
                    </div>
                  </div>

                  <div className={`${statusInfo.badge} rounded-xl p-4 text-white`}>
                    <p className="text-center text-2xl font-bold tracking-wide">
                      {statusInfo.label}
                    </p>
                  </div>

                  {statusInfo.authorized && (
                    <div className="bg-white rounded-xl p-3 border-2 border-green-300">
                      <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
                        <CheckCircle className="w-5 h-5" />
                        <span>PODE PASSAR</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {request.status === 'validated' ? 'Validado pelo RH' : 'Autorizado pelo gestor'}
                      </p>
                    </div>
                  )}

                  {!statusInfo.authorized && request.status === 'rejected' && (
                    <div className="bg-white rounded-xl p-3 border-2 border-red-300">
                      <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                        <XCircle className="w-5 h-5" />
                        <span>NAO LIBERADO</span>
                      </div>
                      <p className="text-xs text-slate-600">Solicitacao recusada</p>
                    </div>
                  )}

                  {!statusInfo.authorized && request.status === 'pending' && (
                    <div className="bg-white rounded-xl p-3 border-2 border-yellow-300">
                      <div className="flex items-center gap-2 text-yellow-700 font-bold mb-1">
                        <Clock className="w-5 h-5" />
                        <span>AGUARDANDO AUTORIZACAO</span>
                      </div>
                      <p className="text-xs text-slate-600">Solicitacao em analise</p>
                    </div>
                  )}

                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold mb-1">Motivo:</p>
                    <p className="text-sm text-slate-800">{request.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">
              {viewMode === 'today' ? 'Nenhuma solicitacao hoje' : 'Nenhuma solicitacao encontrada'}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              {viewMode === 'today'
                ? 'As solicitacoes do dia aparecerao aqui'
                : selectedDate
                  ? `Nenhuma solicitacao encontrada para ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
                  : `Nenhuma solicitacao encontrada para ${new Date(selectedMonth + '-15T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
