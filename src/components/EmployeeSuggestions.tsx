import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, Send, Eye, EyeOff, CheckCircle, XCircle, Clock3, Loader2 } from 'lucide-react';
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
}

export function EmployeeSuggestions() {
  const { employeeProfile, user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionForm, setSuggestionForm] = useState({ title: '', description: '', is_anonymous: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employeeProfile) {
      loadSuggestions();
    }
  }, [employeeProfile]);

  const loadSuggestions = async () => {
    try {
      if (!employeeProfile?.id) return;

      const { data, error } = await supabase
        .from('suggestions')
        .select('id, title, description, status, is_anonymous, admin_response, created_at')
        .eq('employee_id', employeeProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeProfile?.id || !suggestionForm.title.trim() || !suggestionForm.description.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{
          title: suggestionForm.title,
          description: suggestionForm.description,
          is_anonymous: suggestionForm.is_anonymous,
          employee_id: employeeProfile.id,
          created_by: user?.id,
          status: 0,
        }]);

      if (error) throw error;

      setSuggestionForm({ title: '', description: '', is_anonymous: false });
      await loadSuggestions();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Erro ao enviar sugestao. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return { label: 'Aprovada', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 2:
        return { label: 'Reprovada', color: 'bg-red-100 text-red-700', icon: XCircle };
      default:
        return { label: 'Em Analise', color: 'bg-amber-100 text-amber-700', icon: Clock3 };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24 md:pb-8">
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 pt-6 pb-12 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Sugestoes</h1>
              <p className="text-teal-100 text-sm md:text-base">Compartilhe suas ideias e acompanhe o status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-6 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800">Nova Sugestao</h3>
                <p className="text-xs text-slate-400">Compartilhe suas ideias conosco</p>
              </div>
            </div>

            <form onSubmit={handleSubmitSuggestion} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titulo *</label>
                <input
                  type="text"
                  value={suggestionForm.title}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="Digite o titulo da sugestao"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descricao *</label>
                <textarea
                  value={suggestionForm.description}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                  placeholder="Descreva sua sugestao em detalhes"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSuggestionForm({ ...suggestionForm, is_anonymous: !suggestionForm.is_anonymous })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    suggestionForm.is_anonymous ? 'bg-teal-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    suggestionForm.is_anonymous ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
                <div className="flex items-center gap-2">
                  {suggestionForm.is_anonymous ? (
                    <EyeOff className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-700">
                    {suggestionForm.is_anonymous ? 'Sugestao anonima' : 'Sugestao identificada'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !suggestionForm.title.trim() || !suggestionForm.description.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar Sugestao'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">Minhas Sugestoes</h3>
                  <p className="text-xs text-slate-400">Acompanhe o status das suas sugestoes</p>
                </div>
              </div>
              {suggestions.length > 0 && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                  {suggestions.length}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {suggestions.length === 0 ? (
                <div className="px-4 md:px-6 py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhuma sugestao enviada</p>
                  <p className="text-slate-400 text-sm mt-1">Envie sua primeira sugestao acima</p>
                </div>
              ) : (
                suggestions.map((suggestion) => {
                  const statusInfo = getStatusInfo(suggestion.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={suggestion.id} className="px-4 md:px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-slate-800 text-sm md:text-base">
                              {suggestion.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {suggestion.is_anonymous && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Anonima
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs md:text-sm">{suggestion.description}</p>
                          {suggestion.admin_response && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-xs font-medium text-blue-700 mb-1">Resposta da Administracao:</p>
                              <p className="text-sm text-blue-600">{suggestion.admin_response}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(suggestion.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
