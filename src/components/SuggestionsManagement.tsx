import { useState, useEffect } from 'react';
import { Search, MessageSquare, CheckCircle, XCircle, Clock, Eye, EyeOff, User, Calendar, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: number;
  is_anonymous: boolean;
  admin_response: string | null;
  created_at: string;
  updated_at: string | null;
  employee_id: string | null;
  employee_name?: string;
}

export function SuggestionsManagement() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1 | 2>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select(`
          id,
          title,
          description,
          status,
          is_anonymous,
          admin_response,
          created_at,
          updated_at,
          employee_id,
          employees!suggestions_employee_id_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        is_anonymous: item.is_anonymous,
        admin_response: item.admin_response,
        created_at: item.created_at,
        updated_at: item.updated_at,
        employee_id: item.employee_id,
        employee_name: item.employees?.name || 'Desconhecido',
      }));

      setSuggestions(formattedData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      alert('Erro ao carregar sugestoes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (suggestionId: string, newStatus: number) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          status: newStatus,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => prev.map(s =>
        s.id === suggestionId ? { ...s, status: newStatus } : s
      ));

      if (selectedSuggestion?.id === suggestionId) {
        setSelectedSuggestion(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedSuggestion || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          admin_response: responseText,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSuggestion.id);

      if (error) throw error;

      setSuggestions(prev => prev.map(s =>
        s.id === selectedSuggestion.id ? { ...s, admin_response: responseText } : s
      ));

      setSelectedSuggestion(prev => prev ? { ...prev, admin_response: responseText } : null);
      setResponseText('');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return { label: 'Aprovada', color: 'bg-green-100 text-green-700 border-green-200', iconColor: 'text-green-500' };
      case 2:
        return { label: 'Reprovada', color: 'bg-red-100 text-red-700 border-red-200', iconColor: 'text-red-500' };
      default:
        return { label: 'Em Analise', color: 'bg-amber-100 text-amber-700 border-amber-200', iconColor: 'text-amber-500' };
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return CheckCircle;
      case 2:
        return XCircle;
      default:
        return Clock;
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (!s.is_anonymous && s.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 0).length,
    approved: suggestions.filter(s => s.status === 1).length,
    rejected: suggestions.filter(s => s.status === 2).length,
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestao de Sugestoes</h2>
        <p className="text-gray-500 mt-1">Visualize e responda as sugestoes dos colaboradores</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              <p className="text-xs text-gray-500">Em Analise</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
              <p className="text-xs text-gray-500">Aprovadas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Reprovadas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por titulo, descricao ou colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter(0)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              statusFilter === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Em Analise
          </button>
          <button
            onClick={() => setStatusFilter(1)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              statusFilter === 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setStatusFilter(2)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              statusFilter === 2 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Reprovadas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Lista de Sugestoes</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredSuggestions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma sugestao encontrada</p>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => {
                const statusInfo = getStatusInfo(suggestion.status);
                const StatusIcon = getStatusIcon(suggestion.status);
                return (
                  <div
                    key={suggestion.id}
                    onClick={() => {
                      setSelectedSuggestion(suggestion);
                      setResponseText(suggestion.admin_response || '');
                    }}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSuggestion?.id === suggestion.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gray-800 truncate">{suggestion.title}</h4>
                          {suggestion.is_anonymous && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              Anonima
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2">{suggestion.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {!suggestion.is_anonymous && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {suggestion.employee_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Detalhes da Sugestao</h3>
          </div>
          {selectedSuggestion ? (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="text-lg font-bold text-gray-800">{selectedSuggestion.title}</h4>
                  {selectedSuggestion.is_anonymous && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Anonima
                    </span>
                  )}
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedSuggestion.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  {!selectedSuggestion.is_anonymous && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedSuggestion.employee_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedSuggestion.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedSuggestion.id, 0)}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      selectedSuggestion.status === 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Em Analise
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedSuggestion.id, 1)}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      selectedSuggestion.status === 1
                        ? 'bg-green-500 text-white'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedSuggestion.id, 2)}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      selectedSuggestion.status === 2
                        ? 'bg-red-500 text-white'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reprovar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resposta para o Colaborador</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Digite uma resposta para o colaborador (opcional)"
                  rows={4}
                />
                <button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !responseText.trim()}
                  className="mt-3 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500">Selecione uma sugestao para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
