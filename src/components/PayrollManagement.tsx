import { useState, useEffect } from 'react';
import { FileText, Upload, X, Calendar, Users, Check, Eye, Download, Trash2, Plus, FileSpreadsheet, DollarSign, ChevronDown, ChevronUp, FileCheck, MapPin, Globe, Monitor, Camera, Info, CheckCircle, XCircle, Clock, FileDown, Shield, Lock, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import { formatHash } from '../utils/documentIntegrity';

interface PayrollDocument {
  id: string;
  document_type: 'payslip' | 'timesheet';
  reference_month: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  created_by: string | null;
  total_employees: number;
  viewed_count: number;
  signed_count: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface SignatureAudit {
  selfie_url: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
  face_detected: boolean;
  faces_count: number;
  face_confidence: string | number | null;
  face_detection_error: string | null;
  document_hash_before: string | null;
  document_hash_after: string | null;
  timestamp_authority: string | null;
  is_locked: boolean;
  version_number: number;
  previous_version_id: string | null;
}

interface DocumentAssignment {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  viewed_at: string | null;
  signed_at: string | null;
  signed_file_url: string | null;
  signature_data: string | null;
  created_at: string;
  signature_audit: SignatureAudit | null;
}

export function PayrollManagement() {
  console.log('🚀 PayrollManagement component montado/renderizado');

  const { employeeProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'payslip' | 'timesheet'>('payslip');
  const [documents, setDocuments] = useState<PayrollDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [documentAssignments, setDocumentAssignments] = useState<Record<string, DocumentAssignment[]>>({});
  const [expandedAudits, setExpandedAudits] = useState<Set<string>>(new Set());
  const [selfieModalUrl, setSelfieModalUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('📊 PayrollManagement useEffect disparado, activeTab:', activeTab);
    loadEmployees();
    loadDocuments();
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: docs, error } = await supabase
        .from('payroll_documents')
        .select(`
          *,
          assignments:payroll_document_assignments(viewed_at, signed_at)
        `)
        .eq('document_type', activeTab)
        .order('reference_month', { ascending: false });

      if (error) throw error;

      const docsWithStats = (docs || []).map(doc => {
        const assignments = doc.assignments || [];
        return {
          ...doc,
          total_employees: assignments.length,
          viewed_count: assignments.filter((a: any) => a.viewed_at).length,
          signed_count: assignments.filter((a: any) => a.signed_at).length,
        };
      });

      setDocuments(docsWithStats);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedMonth || !title || selectedEmployees.length === 0) {
      alert('Preencha todos os campos obrigatórios e selecione pelo menos um colaborador');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${activeTab}_${selectedMonth}_${Date.now()}.${fileExt}`;
      const filePath = `${activeTab}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payroll-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payroll-documents')
        .getPublicUrl(filePath);

      const { data: doc, error: docError } = await supabase
        .from('payroll_documents')
        .insert({
          document_type: activeTab,
          reference_month: selectedMonth + '-01',
          title,
          description,
          file_url: filePath,
          created_by: employeeProfile?.id
        })
        .select()
        .single();

      if (docError) throw docError;

      const assignments = selectedEmployees.map(empId => ({
        document_id: doc.id,
        employee_id: empId
      }));

      const { error: assignError } = await supabase
        .from('payroll_document_assignments')
        .insert(assignments);

      if (assignError) throw assignError;

      setShowUploadModal(false);
      resetForm();
      loadDocuments();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('payroll-documents')
        .remove([fileUrl]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('payroll_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      loadDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      alert('Erro ao deletar documento');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payroll-documents')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedMonth('');
    setSelectedFile(null);
    setSelectedEmployees([]);
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(e => e.id));
  };

  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const loadDocumentAssignments = async (documentId: string) => {
    console.log('⚡ FUNÇÃO loadDocumentAssignments INICIADA para documento:', documentId);
    try {
      console.log('🔍 Carregando assignments para documento:', documentId);

      const { data, error } = await supabase
        .from('payroll_document_assignments')
        .select(`
          id,
          employee_id,
          viewed_at,
          signed_at,
          signed_file_url,
          signature_data,
          created_at,
          employees (
            name,
            email
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar assignments:', error);
        throw error;
      }

      console.log('✅ Assignments carregados:', data?.length || 0);

      const assignmentsWithAudit = await Promise.all((data || []).map(async (item) => {
        let signatureAudit: SignatureAudit | null = null;

        if (item.signed_at) {
          console.log('🔍 Buscando auditoria para assignment:', item.id);

          const { data: auditData, error: auditError } = await supabase
            .from('payroll_signatures')
            .select('selfie_url, latitude, longitude, ip_address, user_agent, signed_at, face_detected, faces_count, face_confidence, face_detection_error, document_hash_before, document_hash_after, timestamp_authority, is_locked, version_number, previous_version_id')
            .eq('payroll_assignment_id', item.id)
            .maybeSingle();

          console.log('📊 Resultado da query de auditoria:', {
            assignment_id: item.id,
            tem_erro: !!auditError,
            tem_dados: !!auditData,
            dados_completos: auditData,
            erro_completo: auditError
          });

          if (auditError) {
            console.error('❌ Erro ao carregar dados de auditoria:', {
              assignment_id: item.id,
              error: auditError,
              error_message: auditError.message,
              error_code: auditError.code
            });
          } else if (auditData) {
            signatureAudit = auditData;
            console.log('✅ Dados de auditoria encontrados:', {
              assignment_id: item.id,
              employee_name: (item.employees as any)?.name,
              has_selfie: !!auditData.selfie_url,
              has_gps: !!(auditData.latitude && auditData.longitude),
              has_ip: !!auditData.ip_address,
              face_detected: auditData.face_detected
            });
          } else {
            console.warn('⚠️ Nenhum dado de auditoria encontrado:', {
              assignment_id: item.id,
              employee_name: (item.employees as any)?.name,
              signed_at: item.signed_at,
              nota: 'Dados devem estar na tabela payroll_signatures'
            });
          }
        }

        return {
          id: item.id,
          employee_id: item.employee_id,
          employee_name: (item.employees as any)?.name || 'Nome não disponível',
          employee_email: (item.employees as any)?.email || '',
          viewed_at: item.viewed_at,
          signed_at: item.signed_at,
          signed_file_url: item.signed_file_url,
          signature_data: item.signature_data,
          created_at: item.created_at,
          signature_audit: signatureAudit
        };
      }));

      console.log('✅ Total de assignments processados:', assignmentsWithAudit.length);
      console.log('✅ Assignments com auditoria:', assignmentsWithAudit.filter(a => a.signature_audit).length);

      setDocumentAssignments(prev => ({
        ...prev,
        [documentId]: assignmentsWithAudit
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  };

  const toggleDocumentExpansion = (documentId: string) => {
    console.log('🖱️ CLIQUE: Histórico de Envios clicado para documento:', documentId);
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentId)) {
      console.log('📤 Fechando histórico');
      newExpanded.delete(documentId);
    } else {
      console.log('📥 Abrindo histórico - Carregando dados...');
      newExpanded.add(documentId);
      loadDocumentAssignments(documentId);
    }
    setExpandedDocuments(newExpanded);
  };

  const toggleAuditExpansion = (assignmentId: string) => {
    const newExpanded = new Set(expandedAudits);
    if (newExpanded.has(assignmentId)) {
      newExpanded.delete(assignmentId);
    } else {
      newExpanded.add(assignmentId);
    }
    setExpandedAudits(newExpanded);
  };

  const viewSelfie = async (selfieUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('signature-selfies')
        .download(selfieUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setSelfieModalUrl(url);
    } catch (error) {
      console.error('Erro ao carregar selfie:', error);
      alert('Erro ao carregar selfie');
    }
  };

  const exportAuditToPDF = async (assignment: DocumentAssignment, documentTitle: string) => {
    try {
      // Buscar dados completos do funcionário
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('cpf, rg, birth_date, rg_document_url')
        .eq('id', assignment.employee_id)
        .maybeSingle();

      if (employeeError) {
        console.error('Erro ao buscar dados do funcionário:', employeeError);
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trilha de Auditoria de Assinatura', pageWidth / 2, yPos, { align: 'center' });

      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Documento: ${documentTitle}`, 20, yPos);

      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dados do Funcionário', 20, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nome: ${assignment.employee_name}`, 20, yPos);

      if (assignment.employee_email) {
        yPos += 6;
        pdf.text(`E-mail: ${assignment.employee_email}`, 20, yPos);
      }

      if (employeeData?.cpf) {
        yPos += 6;
        pdf.text(`CPF: ${employeeData.cpf}`, 20, yPos);
      }

      if (employeeData?.rg) {
        yPos += 6;
        pdf.text(`RG: ${employeeData.rg}`, 20, yPos);
      }

      if (employeeData?.birth_date) {
        yPos += 6;
        const birthDate = new Date(employeeData.birth_date).toLocaleDateString('pt-BR');
        pdf.text(`Data de Nascimento: ${birthDate}`, 20, yPos);
      }

      yPos += 12;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      if (assignment.signature_audit) {
        const audit = assignment.signature_audit;

        // Data e Hora
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data e Hora da Assinatura', 20, yPos);
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          new Date(audit.signed_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          20,
          yPos
        );

        yPos += 12;

        // Validação Facial
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Validação Facial', 20, yPos);
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        if (audit.face_detected) {
          pdf.setTextColor(0, 128, 0);
          pdf.text('✓ Validação Facial Aprovada', 20, yPos);
          yPos += 6;
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            `${audit.faces_count} ${audit.faces_count === 1 ? 'rosto detectado' : 'rostos detectados'}`,
            20,
            yPos
          );
          if (audit.face_confidence) {
            yPos += 6;
            pdf.text(
              `Confiança: ${(Number(audit.face_confidence) * 100).toFixed(1)}%`,
              20,
              yPos
            );
          }
        } else {
          pdf.setTextColor(255, 0, 0);
          pdf.text('✗ Validação Facial Falhou', 20, yPos);
          yPos += 6;
          pdf.setTextColor(0, 0, 0);
          pdf.text(audit.face_detection_error || 'Nenhum rosto detectado', 20, yPos);
        }
        pdf.setTextColor(0, 0, 0);

        yPos += 12;

        // Localização GPS
        if (audit.latitude && audit.longitude) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Localização GPS', 20, yPos);
          yPos += 7;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Latitude: ${Number(audit.latitude).toFixed(6)}`, 20, yPos);
          yPos += 6;
          pdf.text(`Longitude: ${Number(audit.longitude).toFixed(6)}`, 20, yPos);
          yPos += 6;
          pdf.setTextColor(0, 0, 255);
          pdf.textWithLink(
            'Ver no Google Maps',
            20,
            yPos,
            { url: `https://www.google.com/maps?q=${audit.latitude},${audit.longitude}` }
          );
          pdf.setTextColor(0, 0, 0);
          yPos += 12;
        }

        // Endereço IP
        if (audit.ip_address) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Endereço IP', 20, yPos);
          yPos += 7;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(audit.ip_address, 20, yPos);
          yPos += 12;
        }

        // Dispositivo/Navegador
        if (audit.user_agent) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Dispositivo/Navegador', 20, yPos);
          yPos += 7;
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          const userAgentLines = pdf.splitTextToSize(audit.user_agent, pageWidth - 40);
          pdf.text(userAgentLines, 20, yPos);
          yPos += (userAgentLines.length * 5) + 12;
        }

        // Adicionar nova página para integridade
        if (yPos > 180) {
          pdf.addPage();
          yPos = 20;
        }

        // INTEGRIDADE DO DOCUMENTO
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 100, 0);
        pdf.text('INTEGRIDADE DO DOCUMENTO', 20, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 10;

        pdf.setDrawColor(0, 100, 0);
        pdf.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // Hash do documento antes da assinatura
        if (audit.document_hash_before) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Hash do Documento (Antes da Assinatura)', 20, yPos);
          yPos += 7;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const hashBeforeLines = pdf.splitTextToSize(audit.document_hash_before, pageWidth - 40);
          pdf.text(hashBeforeLines, 20, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += (hashBeforeLines.length * 4) + 10;
        }

        // Hash do documento após assinatura
        if (audit.document_hash_after) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Hash do Documento (Após a Assinatura)', 20, yPos);
          yPos += 7;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const hashAfterLines = pdf.splitTextToSize(audit.document_hash_after, pageWidth - 40);
          pdf.text(hashAfterLines, 20, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += (hashAfterLines.length * 4) + 10;
        }

        // Verificação de integridade
        if (audit.document_hash_before && audit.document_hash_after) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Verificação de Integridade', 20, yPos);
          yPos += 7;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');

          if (audit.document_hash_before !== audit.document_hash_after) {
            pdf.setTextColor(0, 150, 0);
            pdf.text('✓ Hashes diferentes - Documento foi assinado corretamente', 20, yPos);
          } else {
            pdf.setTextColor(200, 0, 0);
            pdf.text('✗ Hashes idênticos - Possível problema na assinatura', 20, yPos);
          }
          pdf.setTextColor(0, 0, 0);
          yPos += 10;
        }

        // Carimbo de tempo (Timestamp Authority)
        if (audit.timestamp_authority) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Carimbo de Tempo (TSA)', 20, yPos);
          yPos += 7;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const tsaDate = new Date(audit.timestamp_authority).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          });
          pdf.text(tsaDate, 20, yPos);
          yPos += 6;
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Registro de data/hora confiável da assinatura', 20, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += 10;
        }

        // Status de bloqueio
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Bloqueio de Edição', 20, yPos);
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        if (audit.is_locked) {
          pdf.setTextColor(0, 150, 0);
          pdf.text('✓ DOCUMENTO BLOQUEADO - Não pode ser editado', 20, yPos);
        } else {
          pdf.setTextColor(200, 0, 0);
          pdf.text('✗ Documento não está bloqueado', 20, yPos);
        }
        pdf.setTextColor(0, 0, 0);
        yPos += 10;

        // Versionamento
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Versionamento', 20, yPos);
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Versão do documento: ${audit.version_number || 1}`, 20, yPos);
        yPos += 6;
        if (audit.previous_version_id) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Este documento possui versões anteriores', 20, yPos);
          pdf.setTextColor(0, 0, 0);
        } else {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Esta é a primeira versão do documento', 20, yPos);
          pdf.setTextColor(0, 0, 0);
        }
        yPos += 15;

        // Selfie (se disponível)
        if (audit.selfie_url) {
          try {
            const { data, error } = await supabase.storage
              .from('signature-selfies')
              .download(audit.selfie_url);

            if (!error && data) {
              const reader = new FileReader();
              await new Promise((resolve) => {
                reader.onloadend = () => {
                  const imgData = reader.result as string;

                  // Adicionar nova página se necessário
                  if (yPos > 200) {
                    pdf.addPage();
                    yPos = 20;
                  }

                  pdf.setFontSize(12);
                  pdf.setFont('helvetica', 'bold');
                  pdf.text('Selfie de Verificação', 20, yPos);
                  yPos += 10;

                  const imgWidth = 80;
                  const imgHeight = 80;
                  pdf.addImage(imgData, 'JPEG', 20, yPos, imgWidth, imgHeight);

                  resolve(true);
                };
                reader.readAsDataURL(data);
              });
            }
          } catch (error) {
            console.error('Erro ao carregar selfie para PDF:', error);
          }
        }

        // Assinatura Digital (se disponível)
        if (assignment.signature_data) {
          try {
            // Adicionar nova página se necessário
            if (yPos > 200) {
              pdf.addPage();
              yPos = 20;
            } else {
              yPos += 100;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Assinatura Digital', 20, yPos);
            yPos += 10;

            const signatureWidth = 100;
            const signatureHeight = 40;
            pdf.addImage(assignment.signature_data, 'PNG', 20, yPos, signatureWidth, signatureHeight);
            yPos += signatureHeight + 10;
          } catch (error) {
            console.error('Erro ao adicionar assinatura ao PDF:', error);
          }
        }

        // Documento RG/CPF (se disponível)
        if (employeeData?.rg_document_url) {
          try {
            const { data, error } = await supabase.storage
              .from('employee-documents')
              .download(employeeData.rg_document_url);

            if (!error && data) {
              const reader = new FileReader();
              await new Promise((resolve) => {
                reader.onloadend = () => {
                  const imgData = reader.result as string;

                  // Adicionar nova página
                  pdf.addPage();
                  yPos = 20;

                  pdf.setFontSize(12);
                  pdf.setFont('helvetica', 'bold');
                  pdf.text('Documento RG/CPF', 20, yPos);
                  yPos += 10;

                  // Se for PDF, apenas indicar que está disponível
                  if (data.type === 'application/pdf') {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text('Documento em formato PDF disponível no sistema', 20, yPos);
                  } else {
                    // Se for imagem, adicionar ao PDF
                    const imgWidth = 170;
                    const imgHeight = 100;
                    pdf.addImage(imgData, 'JPEG', 20, yPos, imgWidth, imgHeight);
                  }

                  resolve(true);
                };
                reader.readAsDataURL(data);
              });
            }
          } catch (error) {
            console.error('Erro ao carregar documento RG para PDF:', error);
          }
        }
      }

      // Salvar PDF
      const fileName = `auditoria_${assignment.employee_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF de auditoria');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Holerites e Espelhos de Ponto</h1>
        <p className="text-gray-600">Envie e gerencie documentos mensais para os colaboradores</p>
      </div>

      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('payslip')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'payslip'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Holerites
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'timesheet'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              Espelhos de Ponto
            </button>
          </div>
        </div>

        <div className="p-6">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Enviar Novo {activeTab === 'payslip' ? 'Holerite' : 'Espelho de Ponto'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum documento encontrado</p>
          <p className="text-gray-400 mt-2">
            Comece enviando {activeTab === 'payslip' ? 'holerites' : 'espelhos de ponto'} para os colaboradores
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {activeTab === 'payslip' ? (
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    ) : (
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-800">{doc.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {doc.total_employees} colaboradores
                    </div>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc.file_url, doc.title)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_url)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Enviados</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{doc.total_employees}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Visualizados</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{doc.viewed_count}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Assinados</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{doc.signed_count}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleDocumentExpansion(doc.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span>Histórico de Envios</span>
                  {expandedDocuments.has(doc.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedDocuments.has(doc.id) && (
                  <div className="mt-3 space-y-2">
                    {!documentAssignments[doc.id] ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : documentAssignments[doc.id].length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Nenhum envio registrado
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 max-h-80 overflow-y-auto">
                        <div className="space-y-2">
                          {(() => {
                            console.log('📋 Renderizando assignments do documento:', doc.title, {
                              total_assignments: documentAssignments[doc.id].length,
                              assignments_with_audit: documentAssignments[doc.id].filter(a => a.signature_audit).length,
                              details: documentAssignments[doc.id].map(a => ({
                                id: a.id,
                                employee: a.employee_name,
                                signed: !!a.signed_at,
                                has_audit: !!a.signature_audit
                              }))
                            });
                            return null;
                          })()}
                          {documentAssignments[doc.id].map((assignment) => (
                            <div
                              key={assignment.id}
                              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800">{assignment.employee_name}</p>
                                  {assignment.employee_email && (
                                    <p className="text-sm text-gray-500 mt-0.5">{assignment.employee_email}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${assignment.viewed_at ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                      <span className="text-xs text-gray-600">
                                        {assignment.viewed_at ? 'Visualizado' : 'Não visualizado'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {assignment.signed_at ? (
                                        <>
                                          <FileCheck className="w-3.5 h-3.5 text-green-600" />
                                          <span className="text-xs text-green-600 font-medium">
                                            Assinado
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                          <span className="text-xs text-gray-600">
                                            Não assinado
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {assignment.viewed_at && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Visualizado em: {new Date(assignment.viewed_at).toLocaleString('pt-BR')}
                                    </p>
                                  )}
                                  {assignment.signed_at && (
                                    <p className="text-xs text-gray-400">
                                      Assinado em: {new Date(assignment.signed_at).toLocaleString('pt-BR')}
                                    </p>
                                  )}

                                  {assignment.signed_at && (
                                    <div className="mt-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                          onClick={() => toggleAuditExpansion(assignment.id)}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          <Info className="w-3.5 h-3.5" />
                                          {expandedAudits.has(assignment.id) ? 'Ocultar' : 'Ver'} Trilha de Auditoria
                                          {expandedAudits.has(assignment.id) ? (
                                            <ChevronUp className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          )}
                                        </button>

                                        {assignment.signature_audit && (
                                          <button
                                            onClick={() => exportAuditToPDF(assignment, doc.title)}
                                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                                          >
                                            <FileDown className="w-3.5 h-3.5" />
                                            Exportar PDF
                                          </button>
                                        )}
                                      </div>

                                      {expandedAudits.has(assignment.id) && (
                                        <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Dados de Verificação</h4>
                                          {(() => {
                                            console.log('🔍 Renderizando trilha de auditoria:', {
                                              assignment_id: assignment.id,
                                              employee_name: assignment.employee_name,
                                              has_signature_audit: !!assignment.signature_audit,
                                              signature_audit: assignment.signature_audit
                                            });
                                            return null;
                                          })()}

                                          {assignment.signature_audit ? (
                                            <>
                                              <div className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-gray-300">
                                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                <div>
                                                  <span className="font-medium text-gray-700">Assinado em: </span>
                                                  <span className="text-gray-900">
                                                    {new Date(assignment.signature_audit.signed_at).toLocaleString('pt-BR', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  second: '2-digit'
                                                    })}
                                                  </span>
                                                </div>
                                              </div>

                                              {assignment.signature_audit.selfie_url && (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>Selfie de Verificação</span>
                                                  </div>
                                                  <button
                                                    onClick={() => viewSelfie(assignment.signature_audit!.selfie_url!)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                  >
                                                    Visualizar
                                                  </button>
                                                </div>
                                              )}

                                              <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                                                assignment.signature_audit.face_detected
                                                  ? 'bg-green-50 text-green-800 border border-green-200'
                                                  : 'bg-red-50 text-red-800 border border-red-200'
                                              }`}>
                                                {assignment.signature_audit.face_detected ? (
                                                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                  <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div>
                                                  <p className="font-medium">
                                                    {assignment.signature_audit.face_detected
                                                      ? 'Validação Facial Aprovada'
                                                      : 'Validação Facial Falhou'}
                                                  </p>
                                                  {assignment.signature_audit.face_detected ? (
                                                    <p className={assignment.signature_audit.face_detected ? 'text-green-600' : 'text-red-600'}>
                                                      {assignment.signature_audit.faces_count} {assignment.signature_audit.faces_count === 1 ? 'rosto detectado' : 'rostos detectados'}
                                                      {assignment.signature_audit.face_confidence &&
                                                        ` • Confiança: ${(Number(assignment.signature_audit.face_confidence) * 100).toFixed(1)}%`
                                                      }
                                                    </p>
                                                  ) : (
                                                    <p className="text-red-600">
                                                      {assignment.signature_audit.face_detection_error || 'Nenhum rosto detectado'}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>

                                              {assignment.signature_audit.latitude && assignment.signature_audit.longitude && (
                                                <div className="flex items-start gap-2 text-xs text-gray-600">
                                                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="font-medium">Localização GPS</p>
                                                    <p className="text-gray-500">
                                                      Lat: {Number(assignment.signature_audit.latitude).toFixed(6)},
                                                      Long: {Number(assignment.signature_audit.longitude).toFixed(6)}
                                                    </p>
                                                    <a
                                                      href={`https://www.google.com/maps?q=${assignment.signature_audit.latitude},${assignment.signature_audit.longitude}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                      Ver no mapa
                                                    </a>
                                                  </div>
                                                </div>
                                              )}

                                              {assignment.signature_audit.ip_address && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                  <Globe className="w-3.5 h-3.5" />
                                                  <div>
                                                    <span className="font-medium">IP: </span>
                                                    <span className="text-gray-500">{assignment.signature_audit.ip_address}</span>
                                                  </div>
                                                </div>
                                              )}

                                              {assignment.signature_audit.user_agent && (
                                                <div className="flex items-start gap-2 text-xs text-gray-600">
                                                  <Monitor className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="font-medium">Dispositivo/Navegador</p>
                                                    <p className="text-gray-500 break-all">{assignment.signature_audit.user_agent}</p>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Seção de Integridade do Documento */}
                                              <div className="mt-4 pt-4 border-t-2 border-green-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                  <Shield className="w-4 h-4 text-green-700" />
                                                  <h4 className="text-sm font-bold text-green-800">INTEGRIDADE DO DOCUMENTO</h4>
                                                </div>

                                                {assignment.signature_audit.document_hash_before && (
                                                  <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
                                                    <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                                                    <div className="flex-1">
                                                      <p className="font-medium">Hash Antes da Assinatura</p>
                                                      <p className="text-gray-500 font-mono text-[10px] break-all">
                                                        {formatHash(assignment.signature_audit.document_hash_before, 32)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}

                                                {assignment.signature_audit.document_hash_after && (
                                                  <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
                                                    <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                                                    <div className="flex-1">
                                                      <p className="font-medium">Hash Após a Assinatura</p>
                                                      <p className="text-gray-500 font-mono text-[10px] break-all">
                                                        {formatHash(assignment.signature_audit.document_hash_after, 32)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}

                                                {assignment.signature_audit.document_hash_before && assignment.signature_audit.document_hash_after && (
                                                  <div className={`flex items-start gap-2 text-xs p-2 rounded-lg mb-2 ${
                                                    assignment.signature_audit.document_hash_before !== assignment.signature_audit.document_hash_after
                                                      ? 'bg-green-50 text-green-800 border border-green-200'
                                                      : 'bg-red-50 text-red-800 border border-red-200'
                                                  }`}>
                                                    {assignment.signature_audit.document_hash_before !== assignment.signature_audit.document_hash_after ? (
                                                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <div>
                                                      <p className="font-medium">
                                                        {assignment.signature_audit.document_hash_before !== assignment.signature_audit.document_hash_after
                                                          ? 'Verificação de Integridade Aprovada'
                                                          : 'Alerta: Hashes Idênticos'}
                                                      </p>
                                                      <p className={assignment.signature_audit.document_hash_before !== assignment.signature_audit.document_hash_after ? 'text-green-600' : 'text-red-600'}>
                                                        {assignment.signature_audit.document_hash_before !== assignment.signature_audit.document_hash_after
                                                          ? 'Documento foi assinado corretamente'
                                                          : 'Possível problema na assinatura'}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}

                                                {assignment.signature_audit.timestamp_authority && (
                                                  <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
                                                    <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-600" />
                                                    <div>
                                                      <p className="font-medium">Carimbo de Tempo (TSA)</p>
                                                      <p className="text-gray-500">
                                                        {new Date(assignment.signature_audit.timestamp_authority).toLocaleString('pt-BR', {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                          second: '2-digit',
                                                          timeZoneName: 'short'
                                                        })}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}

                                                <div className={`flex items-start gap-2 text-xs p-2 rounded-lg mb-2 ${
                                                  assignment.signature_audit.is_locked
                                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                  <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="font-medium">Bloqueio de Edição</p>
                                                    <p>
                                                      {assignment.signature_audit.is_locked
                                                        ? 'Documento bloqueado - Não pode ser editado'
                                                        : 'Documento não está bloqueado'}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-start gap-2 text-xs text-gray-600">
                                                  <History className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                                                  <div>
                                                    <p className="font-medium">Versionamento</p>
                                                    <p className="text-gray-500">
                                                      Versão: {assignment.signature_audit.version_number || 1}
                                                      {assignment.signature_audit.previous_version_id
                                                        ? ' • Possui versões anteriores'
                                                        : ' • Primeira versão'}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-center py-4 text-sm text-gray-500">
                                              <p>Nenhum dado de auditoria disponível para esta assinatura.</p>
                                              <p className="text-xs mt-1">Esta assinatura pode ter sido feita antes da implementação do sistema de auditoria.</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const fileUrl = assignment.signed_file_url || doc.file_url;
                                    const fileName = assignment.signed_at
                                      ? `${doc.title} - ${assignment.employee_name} - Assinado.pdf`
                                      : `${doc.title} - ${assignment.employee_name}.pdf`;
                                    handleDownload(fileUrl, fileName);
                                  }}
                                  className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 border border-blue-200 hover:border-blue-300"
                                  title={assignment.signed_at ? "Baixar PDF Assinado" : "Baixar PDF"}
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Enviar {activeTab === 'payslip' ? 'Holerite' : 'Espelho de Ponto'}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês de Referência *
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex: ${activeTab === 'payslip' ? 'Holerite Janeiro 2026' : 'Espelho de Ponto Janeiro 2026'}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo PDF *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo PDF'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Colaboradores * ({selectedEmployees.length} selecionados)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllEmployees}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Selecionar todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllEmployees}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployeeSelection(emp.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        {emp.email && (
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUploading}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Enviando...' : 'Enviar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selfieModalUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => {
            URL.revokeObjectURL(selfieModalUrl);
            setSelfieModalUrl(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Selfie de Verificação</h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(selfieModalUrl);
                  setSelfieModalUrl(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selfieModalUrl}
              alt="Selfie de verificação"
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
