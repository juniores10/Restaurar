import React, { useState, useEffect } from 'react';
import { FileText, Upload, X, Users, Download, Trash2, CheckCircle2, Building, Inbox, Clock, Eye, MessageSquare, User } from 'lucide-react';
import { documentService, DocumentWithStats } from '../services/documentService';
import { employeeService } from '../services/employeeService';
import { dataTypeService } from '../services/dataTypeService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { DataType } from '../types/database';

interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
}

interface EmployeeSubmission {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  status: number;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  employee?: { name: string };
}

type SelectionMode = 'individual' | 'all' | 'department';
type TabType = 'sent' | 'received';

interface DocViewDetails {
  viewed: { id: string; name: string; read_at: string }[];
  notViewed: { id: string; name: string }[];
}

export function DocumentManagement() {
  const { employeeProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('sent');
  const [documents, setDocuments] = useState<DocumentWithStats[]>([]);
  const [submissions, setSubmissions] = useState<EmployeeSubmission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('individual');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<EmployeeSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showDocViewDetails, setShowDocViewDetails] = useState(false);
  const [docViewDetails, setDocViewDetails] = useState<DocViewDetails | null>(null);
  const [docViewDetailsTitle, setDocViewDetailsTitle] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [docsData, empsData, deptsData] = await Promise.all([
        documentService.getDocumentsForAdmin(),
        employeeService.getAllEmployees(),
        dataTypeService.getDepartments(),
        loadSubmissions()
      ]);
      setDocuments(docsData);
      setEmployees(empsData);
      setDepartments(deptsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions() {
    try {
      const { data, error } = await supabase
        .from('employee_submissions')
        .select(`
          *,
          employee:employees!employee_submissions_employee_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }

  async function markSubmissionAsViewed(submission: EmployeeSubmission) {
    if (submission.status === 1) return;

    try {
      const { error } = await supabase
        .from('employee_submissions')
        .update({
          status: 1,
          reviewed_by: employeeProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) throw error;
      await loadSubmissions();
    } catch (error) {
      console.error('Error marking submission as viewed:', error);
    }
  }

  async function saveAdminNotes() {
    if (!selectedSubmission) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('employee_submissions')
        .update({
          admin_notes: adminNotes,
          status: 1,
          reviewed_by: employeeProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;
      await loadSubmissions();
      setSelectedSubmission(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error saving admin notes:', error);
      alert('Erro ao salvar resposta');
    } finally {
      setSavingNotes(false);
    }
  }

  const pendingSubmissionsCount = submissions.filter(s => s.status === 0).length;

  function showDocumentViewDetails(doc: DocumentWithStats) {
    setDocViewDetailsTitle(doc.title);

    const readMap = new Map(doc.reads.map(r => [r.employee_id, r.read_at]));

    const viewed = doc.recipients
      .filter(r => readMap.has(r.employee_id))
      .map(r => ({
        id: r.employee_id,
        name: r.name,
        read_at: readMap.get(r.employee_id)!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const notViewed = doc.recipients
      .filter(r => !readMap.has(r.employee_id))
      .map(r => ({
        id: r.employee_id,
        name: r.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setDocViewDetails({ viewed, notViewed });
    setShowDocViewDetails(true);
  }

  async function handleUpload() {
    if (!selectedFile || !title.trim()) {
      alert('Por favor, selecione um arquivo e preencha o título');
      return;
    }

    if (selectedEmployees.length === 0) {
      alert('Por favor, selecione pelo menos um colaborador');
      return;
    }

    try {
      setUploading(true);

      const fileUrl = await documentService.uploadDocument(selectedFile);

      await documentService.createDocument(
        title,
        description,
        fileUrl,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type,
        selectedEmployees
      );

      setShowUploadModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setSelectedEmployees([]);
    setSelectionMode('individual');
    setSelectedDepartment('');
  }

  function toggleEmployee(employeeId: string) {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  }

  function selectAllEmployees() {
    setSelectedEmployees(employees.map(e => e.id));
  }

  function deselectAllEmployees() {
    setSelectedEmployees([]);
  }

  function handleSelectionModeChange(mode: SelectionMode) {
    setSelectionMode(mode);
    if (mode === 'all') {
      setSelectedEmployees(employees.map(e => e.id));
      setSelectedDepartment('');
    } else if (mode === 'individual') {
      setSelectedEmployees([]);
      setSelectedDepartment('');
    } else if (mode === 'department') {
      setSelectedEmployees([]);
      setSelectedDepartment('');
    }
  }

  function handleDepartmentChange(departmentId: string) {
    setSelectedDepartment(departmentId);
    if (departmentId) {
      const deptEmployees = employees.filter(e => e.department_id === departmentId);
      setSelectedEmployees(deptEmployees.map(e => e.id));
    } else {
      setSelectedEmployees([]);
    }
  }

  const filteredEmployees = selectionMode === 'department' && selectedDepartment
    ? employees.filter(e => e.department_id === selectedDepartment)
    : employees;

  async function handleDelete(documentId: string) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await documentService.deleteDocument(documentId);
      loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erro ao excluir documento');
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando documentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Documentos</h2>
          <p className="text-gray-600 mt-1">Envie e gerencie documentos para os colaboradores</p>
        </div>
        {activeTab === 'sent' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Enviar Documento
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Documentos Enviados
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'received'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Documentos Recebidos
          {pendingSubmissionsCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'received' && (
        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Inbox className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Nenhum documento recebido dos colaboradores</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
                  submission.status === 0 ? 'border-l-4 border-amber-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{submission.title}</h3>
                        <p className="text-sm text-gray-500">
                          Enviado por: <span className="font-medium">{submission.employee?.name || 'Colaborador'}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          submission.status === 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {submission.status === 0 ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Visualizado
                          </>
                        )}
                      </span>
                    </div>

                    {submission.description && (
                      <p className="text-gray-600 mb-3 ml-13">{submission.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 ml-13">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(submission.created_at)}
                      </span>
                      {submission.file_url && (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{submission.file_name}</span>
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {submission.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg ml-13">
                        <p className="text-xs font-medium text-blue-800 mb-1">Sua resposta:</p>
                        <p className="text-sm text-blue-700">{submission.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {submission.status === 0 && (
                      <button
                        onClick={() => markSubmissionAsViewed(submission)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar como visualizado"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setAdminNotes(submission.admin_notes || '');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Responder"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sent' && (
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Nenhum documento enviado ainda</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                  </div>

                  {doc.description && (
                    <p className="text-gray-600 mb-3">{doc.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {doc.file_name}
                    </span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{doc.total_recipients}</span>
                      <span className="text-gray-600">destinatários</span>
                    </div>
                    {doc.total_reads === doc.total_recipients && doc.total_recipients > 0 ? (
                      <button
                        onClick={() => showDocumentViewDetails(doc)}
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Todos visualizaram</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => showDocumentViewDetails(doc)}
                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="font-medium">{doc.total_recipients - doc.total_reads}</span>
                        <span>faltam visualizar</span>
                      </button>
                    )}
                  </div>

                  {doc.recipients.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Destinatários:</p>
                      <div className="flex flex-wrap gap-2">
                        {doc.recipients.slice(0, 5).map((recipient) => (
                          <span
                            key={recipient.employee_id}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {recipient.name}
                          </span>
                        ))}
                        {doc.recipients.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{doc.recipients.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Responder ao Colaborador</h3>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">{selectedSubmission.title}</p>
                <p className="text-sm text-gray-500">De: {selectedSubmission.employee?.name}</p>
                {selectedSubmission.description && (
                  <p className="text-sm text-gray-600 mt-2">{selectedSubmission.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua Resposta
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Escreva uma resposta para o colaborador..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveAdminNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Salvando...' : 'Salvar Resposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDocViewDetails && docViewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
              <div>
                <h3 className="text-lg font-bold text-white">Detalhes de Visualizacao</h3>
                <p className="text-blue-100 text-sm truncate max-w-xs">{docViewDetailsTitle}</p>
              </div>
              <button
                onClick={() => {
                  setShowDocViewDetails(false);
                  setDocViewDetails(null);
                }}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">
                    Faltam Visualizar ({docViewDetails.notViewed.length})
                  </h4>
                </div>
                {docViewDetails.notViewed.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-10">Todos visualizaram!</p>
                ) : (
                  <div className="space-y-2 ml-10">
                    {docViewDetails.notViewed.map((emp) => (
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
                    Visualizaram ({docViewDetails.viewed.length})
                  </h4>
                </div>
                {docViewDetails.viewed.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-10">Nenhuma visualizacao ainda</p>
                ) : (
                  <div className="space-y-2 ml-10">
                    {docViewDetails.viewed.map((emp) => (
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
                          {new Date(emp.read_at).toLocaleDateString('pt-BR', {
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
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">Enviar Documento</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">Clique para selecionar um arquivo</p>
                        <p className="text-xs text-gray-400">PDF, DOC, XLS, IMG até 50MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Política de Férias 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do documento..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enviar para *
                </label>

                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleSelectionModeChange('all')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectionMode === 'all'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectionModeChange('department')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectionMode === 'department'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Building className="w-4 h-4 inline mr-2" />
                    Por Departamento/Setor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectionModeChange('individual')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectionMode === 'individual'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Individual
                  </button>
                </div>

                {selectionMode === 'all' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <Users className="w-4 h-4 inline mr-2" />
                      O documento sera enviado para <strong>todos os {employees.length} colaboradores</strong> ativos.
                    </p>
                  </div>
                )}

                {selectionMode === 'department' && (
                  <div className="space-y-3">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um departamento/setor</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.description}</option>
                      ))}
                    </select>
                    {selectedDepartment && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <Building className="w-4 h-4 inline mr-2" />
                          O documento sera enviado para <strong>{filteredEmployees.length} colaborador(es)</strong> do departamento/setor selecionado.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectionMode === 'individual' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {selectedEmployees.length} selecionado(s)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllEmployees}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Todos
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={deselectAllEmployees}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Nenhum
                        </button>
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                      {employees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Nenhum colaborador encontrado
                        </div>
                      ) : (
                        employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployee(employee.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.email}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !title.trim() || selectedEmployees.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Enviando...' : 'Enviar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
