import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle2, Clock, Send, Upload, X, Plus, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { documentService } from '../services/documentService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
  is_read: boolean;
}

interface Submission {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  status: number;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function EmployeeDocuments() {
  const { employeeProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (employeeProfile) {
      loadData();
    }
  }, [employeeProfile]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadDocuments(), loadSubmissions()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    if (!employeeProfile) return;
    try {
      const data = await documentService.getDocumentsForEmployee(employeeProfile.id);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  async function loadSubmissions() {
    if (!employeeProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('employee_submissions')
        .select('*')
        .eq('employee_id', employeeProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }

  async function handleView(documentId: string) {
    if (!employeeProfile) return;
    try {
      await documentService.markAsRead(documentId, employeeProfile.id);
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId ? { ...doc, is_read: true } : doc
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeProfile?.id || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const filePath = `${employeeProfile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-submissions')
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('employee-submissions')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = formData.file.name;
        fileType = formData.file.type;
      }

      const { error } = await supabase
        .from('employee_submissions')
        .insert({
          employee_id: employeeProfile.id,
          title: formData.title,
          description: formData.description || null,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
        });

      if (error) throw error;

      setFormData({ title: '', description: '', file: null });
      setShowForm(false);
      await loadSubmissions();
    } catch (error) {
      console.error('Error submitting document:', error);
      alert('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 1:
        return { label: 'Visualizado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'unread') return !doc.is_read;
    if (filter === 'read') return doc.is_read;
    return true;
  });

  const unreadCount = documents.filter(doc => !doc.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Documentos</h2>
        <p className="text-sm md:text-base text-gray-600 mt-1">Gerencie seus documentos recebidos e enviados</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'received'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Documentos </span>Recebidos
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'send'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" />
            Enviar<span className="hidden sm:inline"> Documento</span>
          </button>
        </div>

        {activeTab === 'received' && (
          <div className="p-4 md:p-6">
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-xs md:text-sm ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todos ({documents.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-xs md:text-sm ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Nao lidos ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-xs md:text-sm ${
                  filter === 'read'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Lidos ({documents.length - unreadCount})
              </button>
            </div>

            <div className="space-y-4">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">
                    {filter === 'unread' && 'Voce leu todos os documentos!'}
                    {filter === 'read' && 'Nenhum documento lido ainda'}
                    {filter === 'all' && 'Nenhum documento compartilhado com voce'}
                  </p>
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-lg border p-4 md:p-6 hover:shadow-md transition-all ${
                      !doc.is_read ? 'border-l-4 border-l-blue-600 border-slate-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className={`w-6 h-6 flex-shrink-0 ${doc.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h3>
                          {!doc.is_read && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                              NOVO
                            </span>
                          )}
                          {doc.is_read && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" title="Lido" />
                          )}
                        </div>

                        {doc.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{doc.file_name}</span>
                          </span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleView(doc.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Visualizar</span>
                        </a>
                        <a
                          href={doc.file_url}
                          download
                          onClick={() => handleView(doc.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Baixar"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Enviar Documento</h3>
                <p className="text-slate-500 text-sm">Envie documentos e mensagens para o RH</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span className="hidden sm:inline">{showForm ? 'Cancelar' : 'Novo Envio'}</span>
              </button>
            </div>

            {showForm && (
              <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                <h4 className="text-base font-bold text-slate-800 mb-4">Novo Documento</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Atestado Medico, Declaracao, etc."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o motivo do envio ou adicione informacoes importantes..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Anexar Arquivo (opcional)
                    </label>
                    <label className="cursor-pointer">
                      <div className={`flex items-center gap-3 px-4 py-4 border-2 border-dashed rounded-xl transition-colors bg-white ${formData.file ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}>
                        <Upload className={`w-6 h-6 ${formData.file ? 'text-blue-500' : 'text-slate-400'}`} />
                        <div className="flex-1">
                          {formData.file ? (
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span className="text-sm text-slate-700 font-medium">{formData.file.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Clique para selecionar (PDF, Word, Imagem)</span>
                          )}
                        </div>
                        {formData.file && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, file: null });
                            }}
                            className="p-1 text-red-500 hover:bg-red-100 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">
                      Formatos aceitos: PDF, Word, JPG, PNG. Tamanho maximo: 10MB
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar para o RH
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-800">Meus Envios</h4>
                <p className="text-xs text-slate-500">Historico de documentos enviados</p>
              </div>

              {submissions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum documento enviado</p>
                  <p className="text-slate-400 text-sm mt-1">Clique em "Novo Envio" para enviar seu primeiro documento</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map((submission) => {
                    const statusInfo = getStatusInfo(submission.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={submission.id} className="px-4 md:px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-slate-800">{submission.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>
                            {submission.description && (
                              <p className="text-sm text-slate-500 line-clamp-2 mb-2">{submission.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(submission.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {submission.file_url && (
                                <a
                                  href={submission.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{submission.file_name}</span>
                                  <Download className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {submission.admin_notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs font-medium text-blue-800 mb-1">Resposta do RH:</p>
                                <p className="text-sm text-blue-700">{submission.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
