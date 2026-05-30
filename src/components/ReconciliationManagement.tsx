import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Search, AlertCircle, CheckCircle2, GitMerge, Download, Save, History, Trash2, Edit3, Eye, Clock, FileText, ChevronLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface UploadedFile {
  id: string;
  name: string;
  data: any[][];
  headers: string[];
}

interface DifferenceItem {
  row: number;
  column: string;
  file1Value: any;
  file2Value: any;
  file1Name: string;
  file2Name: string;
}

interface UnifiedRecord {
  nome: string;
  cpfCnpj: string;
  linhaTelefonica: string;
  plano: string;
  status: string;
}

interface EnrichedRecord extends UnifiedRecord {
  idContrato: string;
  statusLinha: string;
}

interface SavedReconciliation {
  id: string;
  name: string;
  description: string;
  file1_name: string;
  file2_name: string;
  total_records: number;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'main' | 'history' | 'view-saved';

export function ReconciliationManagement() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [differences, setDifferences] = useState<DifferenceItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonDone, setComparisonDone] = useState(false);
  const [unifiedData, setUnifiedData] = useState<UnifiedRecord[]>([]);
  const [isUnifying, setIsUnifying] = useState(false);
  const [unificationDone, setUnificationDone] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [savedReconciliations, setSavedReconciliations] = useState<SavedReconciliation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<SavedReconciliation | null>(null);
  const [savedRecords, setSavedRecords] = useState<UnifiedRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReconciliation, setEditingReconciliation] = useState<SavedReconciliation | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const [contractFile, setContractFile] = useState<UploadedFile | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedRecord[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentDone, setEnrichmentDone] = useState(false);
  const [showSecondStage, setShowSecondStage] = useState(false);

  const diagnosticPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEnriching && diagnosticLogs.length > 0 && showDiagnostics) {
      setTimeout(() => {
        diagnosticPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [diagnosticLogs.length, isEnriching, showDiagnostics]);

  useEffect(() => {
    if (viewMode === 'history') {
      loadSavedReconciliations();
    }
  }, [viewMode]);

  const addLog = (message: string, isError: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDiagnosticLogs(prev => [...prev, isError ? `❌ ${logMessage}` : `✓ ${logMessage}`]);
  };

  const clearLogs = () => {
    setDiagnosticLogs([]);
    setShowDiagnostics(false);
  };

  const loadSavedReconciliations = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('reconciliations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReconciliations(data || []);
    } catch (error) {
      console.error('Error loading reconciliations:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadReconciliationRecords = async (reconciliationId: string) => {
    setLoadingRecords(true);
    try {
      const { data, error } = await supabase
        .from('reconciliation_records')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const records: UnifiedRecord[] = (data || []).map(r => ({
        nome: r.nome || '',
        cpfCnpj: r.cpf_cnpj || '',
        linhaTelefonica: r.linha_telefonica || '',
        plano: r.plano || '',
        status: r.status || '',
      }));

      setSavedRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleViewSaved = async (reconciliation: SavedReconciliation) => {
    setSelectedReconciliation(reconciliation);
    setViewMode('view-saved');
    await loadReconciliationRecords(reconciliation.id);
  };

  const handleSaveReconciliation = async () => {
    if (!saveName.trim()) {
      alert('Por favor, informe um nome para a conciliação');
      return;
    }

    setIsSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      const { data: reconciliation, error: reconciliationError } = await supabase
        .from('reconciliations')
        .insert({
          name: saveName.trim(),
          description: saveDescription.trim(),
          file1_name: uploadedFiles[0]?.name || '',
          file2_name: uploadedFiles[1]?.name || '',
          total_records: unifiedData.length,
          created_by: user?.user?.id,
        })
        .select()
        .single();

      if (reconciliationError) throw reconciliationError;

      const recordsToInsert = unifiedData.map(record => ({
        reconciliation_id: reconciliation.id,
        nome: record.nome,
        cpf_cnpj: record.cpfCnpj,
        linha_telefonica: record.linhaTelefonica,
        plano: record.plano,
        status: record.status,
      }));

      const batchSize = 500;
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        const { error: recordsError } = await supabase
          .from('reconciliation_records')
          .insert(batch);

        if (recordsError) throw recordsError;
      }

      setShowSaveModal(false);
      setSaveName('');
      setSaveDescription('');
      alert('Conciliação salva com sucesso!');
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      alert('Erro ao salvar conciliação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (reconciliation: SavedReconciliation) => {
    setEditingReconciliation(reconciliation);
    setEditName(reconciliation.name);
    setEditDescription(reconciliation.description || '');
    setShowEditModal(true);
  };

  const handleUpdateReconciliation = async () => {
    if (!editingReconciliation || !editName.trim()) {
      alert('Por favor, informe um nome para a conciliação');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('reconciliations')
        .update({
          name: editName.trim(),
          description: editDescription.trim(),
        })
        .eq('id', editingReconciliation.id);

      if (error) throw error;

      setSavedReconciliations(prev =>
        prev.map(r =>
          r.id === editingReconciliation.id
            ? { ...r, name: editName.trim(), description: editDescription.trim() }
            : r
        )
      );

      setShowEditModal(false);
      setEditingReconciliation(null);
      setEditName('');
      setEditDescription('');
    } catch (error) {
      console.error('Error updating reconciliation:', error);
      alert('Erro ao atualizar conciliação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('reconciliations')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      setSavedReconciliations(prev => prev.filter(r => r.id !== deletingId));
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting reconciliation:', error);
      alert('Erro ao excluir conciliação');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportSavedData = () => {
    if (savedRecords.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const exportData = savedRecords.map((record) => ({
      'Nome': record.nome,
      'CPF/CNPJ': record.cpfCnpj,
      'Linha Telefônica': record.linhaTelefonica,
      'Plano': record.plano,
      'Status': record.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    const fileName = selectedReconciliation?.name || 'Conciliacao';
    XLSX.writeFile(wb, `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isMergedTitleRow = (row: any[]): boolean => {
    const nonEmptyCells = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
    return nonEmptyCells.length <= 2 && row.length > 2;
  };

  const findHeaderRow = (jsonData: any[][]): { headerIndex: number; headers: string[] } => {
    for (let i = 0; i < Math.min(jsonData.length, 3); i++) {
      const row = jsonData[i];
      if (!isMergedTitleRow(row)) {
        const nonEmptyCells = row.filter(cell =>
          cell !== undefined &&
          cell !== null &&
          String(cell).trim() !== ''
        );

        if (nonEmptyCells.length >= 3) {
          return {
            headerIndex: i,
            headers: row.map(cell => String(cell || '').trim())
          };
        }
      }
    }

    return {
      headerIndex: 0,
      headers: jsonData[0].map(cell => String(cell || '').trim())
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];

        if (jsonData.length === 0) {
          alert(`Arquivo ${file.name} está vazio`);
          continue;
        }

        const { headerIndex, headers } = findHeaderRow(jsonData);
        const allDataRows = jsonData.slice(headerIndex + 1);

        addLog(`=== LEITURA DO ARQUIVO: ${file.name} ===`);
        addLog(`Total de linhas após cabeçalho: ${allDataRows.length}`);

        const dataRows = allDataRows.filter((row, index) => {
          const filledCells = row.filter(cell =>
            cell !== undefined &&
            cell !== null &&
            String(cell).trim() !== ''
          );

          const emptyCells = row.length - filledCells.length;
          const hasData = filledCells.length > 0;

          if (!hasData) {
            addLog(`Linha ${index + headerIndex + 2} descartada (100% vazia - ${row.length} células)`, true);
          } else if (emptyCells > row.length * 0.7) {
            addLog(`Linha ${index + headerIndex + 2}: ${emptyCells} células vazias de ${row.length} (possível linha de total/consolidado)`, false);
          }

          return hasData;
        });

        addLog(`Linhas com dados: ${dataRows.length}`);
        const discarded = allDataRows.length - dataRows.length;
        if (discarded > 0) {
          addLog(`Total de ${discarded} linhas completamente vazias descartadas`, true);
        }

        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          data: dataRows,
          headers: headers,
        };

        setUploadedFiles((prev) => [...prev, newFile]);
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Erro ao ler arquivo ${file.name}`);
      }
    }

    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setDifferences([]);
    setComparisonDone(false);
    setUnifiedData([]);
    setUnificationDone(false);
  };

  const compareFiles = () => {
    if (uploadedFiles.length < 2) {
      alert('É necessário importar pelo menos 2 arquivos para comparar');
      return;
    }

    setIsComparing(true);
    setDifferences([]);

    try {
      const file1 = uploadedFiles[0];
      const file2 = uploadedFiles[1];

      const foundDifferences: DifferenceItem[] = [];

      const maxRows = Math.max(file1.data.length, file2.data.length);
      const maxCols = Math.max(file1.headers.length, file2.headers.length);

      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row1 = file1.data[rowIndex] || [];
        const row2 = file2.data[rowIndex] || [];

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
          const header = file1.headers[colIndex] || file2.headers[colIndex] || `Coluna ${colIndex + 1}`;
          const value1 = row1[colIndex];
          const value2 = row2[colIndex];

          const normalizedValue1 = normalizeValue(value1);
          const normalizedValue2 = normalizeValue(value2);

          if (normalizedValue1 !== normalizedValue2) {
            foundDifferences.push({
              row: rowIndex + 2,
              column: header,
              file1Value: value1 === undefined || value1 === null ? '' : value1,
              file2Value: value2 === undefined || value2 === null ? '' : value2,
              file1Name: file1.name,
              file2Name: file2.name,
            });
          }
        }
      }

      setDifferences(foundDifferences);
      setComparisonDone(true);
    } catch (error) {
      console.error('Error comparing files:', error);
      alert('Erro ao comparar arquivos');
    } finally {
      setIsComparing(false);
    }
  };

  const normalizeValue = (value: any): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return value.toString();
    return String(value).trim();
  };

  const exportDifferences = () => {
    if (differences.length === 0) {
      alert('Não há diferenças para exportar');
      return;
    }

    const exportData = differences.map((diff) => ({
      'Linha': diff.row,
      'Coluna': diff.column,
      [`${diff.file1Name}`]: diff.file1Value,
      [`${diff.file2Name}`]: diff.file2Value,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diferenças');

    XLSX.writeFile(wb, `Conciliacao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    const normalizedHeaders = headers.map(h => {
      const str = String(h || '').toLowerCase().trim();
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ');
    });

    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ');

      const exactIndex = normalizedHeaders.findIndex(h => h === normalizedName);
      if (exactIndex !== -1) return exactIndex;
    }

    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ');

      const includesIndex = normalizedHeaders.findIndex(h => h.includes(normalizedName));
      if (includesIndex !== -1) return includesIndex;

      const reverseIncludesIndex = normalizedHeaders.findIndex(h => normalizedName.includes(h) && h.length >= 3);
      if (reverseIncludesIndex !== -1) return reverseIncludesIndex;
    }

    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ');
      const nameWords = normalizedName.split(/\s+/);

      const wordMatchIndex = normalizedHeaders.findIndex(h => {
        const headerWords = h.split(/\s+/);
        return nameWords.some(word => word.length >= 3 && headerWords.some(hw => hw.includes(word) || word.includes(hw)));
      });
      if (wordMatchIndex !== -1) return wordMatchIndex;
    }

    return -1;
  };

  const mergeValues = (value1: string, value2: string): string => {
    const trimmed1 = (value1 || '').trim();
    const trimmed2 = (value2 || '').trim();

    if (trimmed1 && trimmed2) {
      return trimmed1;
    }

    return trimmed2 || trimmed1;
  };

  const unifyFiles = () => {
    if (uploadedFiles.length < 2) {
      alert('É necessário importar pelo menos 2 arquivos para unificar');
      return;
    }

    clearLogs();
    setShowDiagnostics(true);
    setIsUnifying(true);
    setUnifiedData([]);

    try {
      const file1 = uploadedFiles[0];
      const file2 = uploadedFiles[1];

      const file1NameIdx = findColumnIndex(file1.headers, [
        'nome', 'name', 'cliente', 'razao social', 'razão social', 'empresa', 'responsavel', 'responsável',
        'nome do titular', 'nome titular', 'titular', 'nome completo', 'nome fantasia', 'nome do cliente',
        'assinante', 'nome assinante', 'usuario', 'usuário', 'nome usuario', 'nome usuário',
        'razao_social', 'nome_titular', 'nome_completo', 'nome_cliente', 'nome_fantasia',
        'beneficiario', 'beneficiário', 'nome beneficiario', 'nome beneficiário',
        'contratante', 'nome contratante', 'proprietario', 'proprietário'
      ]);
      const file1CpfIdx = findColumnIndex(file1.headers, [
        'cpf', 'cnpj', 'cpf/cnpj', 'cpf cnpj', 'documento', 'doc', 'identificacao', 'identificação',
        'cpf do titular', 'cnpj do titular', 'cpf titular', 'cnpj titular', 'cpf_cnpj',
        'num documento', 'número documento', 'numero documento', 'inscricao', 'inscrição',
        'cpf cliente', 'cnpj cliente', 'documento cliente', 'id fiscal'
      ]);
      const file1TelIdx = findColumnIndex(file1.headers, [
        'telefone', 'linha', 'tel', 'phone', 'celular', 'linha telefonica', 'linha telefônica',
        'numero', 'número', 'fone', 'contato', 'linha de telefone', 'nº linha', 'n linha',
        'terminal', 'msisdn', 'ddd + telefone', 'ddd telefone', 'telefone celular',
        'numero linha', 'número linha', 'num telefone', 'numero telefone', 'número telefone',
        'tel celular', 'telefone movel', 'telefone móvel', 'mobile', 'num celular',
        'numero celular', 'número celular', 'telefone principal', 'tel principal'
      ]);
      const file1PlanoIdx = findColumnIndex(file1.headers, [
        'plano', 'plan', 'tipo', 'servico', 'serviço', 'produto', 'pacote', 'oferta',
        'tipo de plano', 'tipo plano', 'categoria'
      ]);
      const file1StatusIdx = findColumnIndex(file1.headers, [
        'status', 'situacao', 'situação', 'state', 'estado', 'ativo', 'ativa'
      ]);

      addLog(`=== MAPEAMENTO DE COLUNAS ARQUIVO 1 ===`);
      addLog(`Cabeçalhos encontrados: ${file1.headers.join(' | ')}`);
      addLog(`NOME: ${file1NameIdx !== -1 ? `coluna ${file1NameIdx} (${file1.headers[file1NameIdx]})` : 'NÃO ENCONTRADA'}`, file1NameIdx === -1);
      addLog(`CPF/CNPJ: ${file1CpfIdx !== -1 ? `coluna ${file1CpfIdx} (${file1.headers[file1CpfIdx]})` : 'NÃO ENCONTRADA'}`, file1CpfIdx === -1);
      addLog(`TELEFONE: ${file1TelIdx !== -1 ? `coluna ${file1TelIdx} (${file1.headers[file1TelIdx]})` : 'NÃO ENCONTRADA'}`, file1TelIdx === -1);
      addLog(`PLANO: ${file1PlanoIdx !== -1 ? `coluna ${file1PlanoIdx} (${file1.headers[file1PlanoIdx]})` : 'NÃO ENCONTRADA'}`, file1PlanoIdx === -1);
      addLog(`STATUS: ${file1StatusIdx !== -1 ? `coluna ${file1StatusIdx} (${file1.headers[file1StatusIdx]})` : 'NÃO ENCONTRADA'}`, file1StatusIdx === -1);

      const file2NameIdx = findColumnIndex(file2.headers, [
        'nome', 'name', 'cliente', 'razao social', 'razão social', 'empresa', 'responsavel', 'responsável',
        'nome do titular', 'nome titular', 'titular', 'nome completo', 'nome fantasia', 'nome do cliente',
        'assinante', 'nome assinante', 'usuario', 'usuário', 'nome usuario', 'nome usuário',
        'razao_social', 'nome_titular', 'nome_completo', 'nome_cliente', 'nome_fantasia',
        'beneficiario', 'beneficiário', 'nome beneficiario', 'nome beneficiário',
        'contratante', 'nome contratante', 'proprietario', 'proprietário'
      ]);
      const file2CpfIdx = findColumnIndex(file2.headers, [
        'cpf', 'cnpj', 'cpf/cnpj', 'cpf cnpj', 'documento', 'doc', 'identificacao', 'identificação',
        'cpf do titular', 'cnpj do titular', 'cpf titular', 'cnpj titular', 'cpf_cnpj',
        'num documento', 'número documento', 'numero documento', 'inscricao', 'inscrição',
        'cpf cliente', 'cnpj cliente', 'documento cliente', 'id fiscal'
      ]);
      const file2TelIdx = findColumnIndex(file2.headers, [
        'telefone', 'linha', 'tel', 'phone', 'celular', 'linha telefonica', 'linha telefônica',
        'numero', 'número', 'fone', 'contato', 'linha de telefone', 'nº linha', 'n linha',
        'terminal', 'msisdn', 'ddd + telefone', 'ddd telefone', 'telefone celular',
        'numero linha', 'número linha', 'num telefone', 'numero telefone', 'número telefone',
        'tel celular', 'telefone movel', 'telefone móvel', 'mobile', 'num celular',
        'numero celular', 'número celular', 'telefone principal', 'tel principal'
      ]);
      const file2PlanoIdx = findColumnIndex(file2.headers, [
        'plano', 'plan', 'tipo', 'servico', 'serviço', 'produto', 'pacote', 'oferta',
        'tipo de plano', 'tipo plano', 'categoria'
      ]);
      const file2StatusIdx = findColumnIndex(file2.headers, [
        'status', 'situacao', 'situação', 'state', 'estado', 'ativo', 'ativa'
      ]);

      addLog(`=== MAPEAMENTO DE COLUNAS ARQUIVO 2 ===`);
      addLog(`Cabeçalhos encontrados: ${file2.headers.join(' | ')}`);
      addLog(`NOME: ${file2NameIdx !== -1 ? `coluna ${file2NameIdx} (${file2.headers[file2NameIdx]})` : 'NÃO ENCONTRADA'}`, file2NameIdx === -1);
      addLog(`CPF/CNPJ: ${file2CpfIdx !== -1 ? `coluna ${file2CpfIdx} (${file2.headers[file2CpfIdx]})` : 'NÃO ENCONTRADA'}`, file2CpfIdx === -1);
      addLog(`TELEFONE: ${file2TelIdx !== -1 ? `coluna ${file2TelIdx} (${file2.headers[file2TelIdx]})` : 'NÃO ENCONTRADA'}`, file2TelIdx === -1);
      addLog(`PLANO: ${file2PlanoIdx !== -1 ? `coluna ${file2PlanoIdx} (${file2.headers[file2PlanoIdx]})` : 'NÃO ENCONTRADA'}`, file2PlanoIdx === -1);
      addLog(`STATUS: ${file2StatusIdx !== -1 ? `coluna ${file2StatusIdx} (${file2.headers[file2StatusIdx]})` : 'NÃO ENCONTRADA'}`, file2StatusIdx === -1);

      const recordsMap = new Map<string, UnifiedRecord>();

      let file1Count = 0;
      let file1Duplicates = 0;
      addLog(`=== PROCESSANDO ARQUIVO 1: ${file1.name} ===`);
      addLog(`Total de linhas no arquivo 1: ${file1.data.length}`);

      addLog(`=== PRIMEIRAS 3 LINHAS (AMOSTRA) - DADOS RAW ===`);
      file1.data.slice(0, 3).forEach((row, idx) => {
        addLog(`Linha ${idx + 2} RAW:`, false);
        addLog(`  Array completo: [${row.map((v, i) => `[${i}]="${v}"`).join(', ')}]`, false);

        const sampleNome = file1NameIdx !== -1 ? normalizeValue(row[file1NameIdx]) : '';
        const sampleCpf = file1CpfIdx !== -1 ? normalizeValue(row[file1CpfIdx]) : '';
        const sampleTel = file1TelIdx !== -1 ? normalizeValue(row[file1TelIdx]) : '';

        if (file1NameIdx !== -1) {
          addLog(`  Nome - Índice: ${file1NameIdx}, Valor RAW: "${row[file1NameIdx]}", Normalizado: "${sampleNome}"`, false);
        } else {
          addLog(`  Nome - NÃO ENCONTRADO (índice: ${file1NameIdx})`, true);
        }

        addLog(`  Resultado: Nome="${sampleNome}" | CPF="${sampleCpf}" | Tel="${sampleTel}"`, false);
        addLog('', false);
      });

      file1.data.forEach((row, index) => {
        const cpf = file1CpfIdx !== -1 ? normalizeValue(row[file1CpfIdx]) : '';
        const nome = file1NameIdx !== -1 ? normalizeValue(row[file1NameIdx]) : '';
        const telefone = file1TelIdx !== -1 ? normalizeValue(row[file1TelIdx]) : '';
        const plano = file1PlanoIdx !== -1 ? normalizeValue(row[file1PlanoIdx]) : '';
        const status = file1StatusIdx !== -1 ? normalizeValue(row[file1StatusIdx]) : '';

        const hasAnyData = cpf || nome || telefone || plano || status;
        const key = hasAnyData
          ? `${cpf}|${telefone}|${nome}`.toLowerCase()
          : `empty_file1_${index}`;

        if (hasAnyData && recordsMap.has(key)) {
          addLog(`Arquivo 1 - Linha ${index + 2} é DUPLICATA (CPF: ${cpf || 'N/A'}, Tel: ${telefone || 'N/A'}, Nome: ${nome || 'N/A'})`, true);
          file1Duplicates++;
        }

        recordsMap.set(key, {
          nome: nome,
          cpfCnpj: cpf,
          linhaTelefonica: telefone,
          plano: plano,
          status: status,
        });
        file1Count++;
      });

      addLog(`Arquivo 1: ${file1Count} processados, ${file1Duplicates} duplicatas internas${file1Duplicates > 0 ? ' ⚠️' : ''}`);

      const file1UniqueCount = recordsMap.size;

      let file2Count = 0;
      let file2Merged = 0;
      let file2New = 0;
      let file2Duplicates = 0;
      const file2SeenKeys = new Set<string>();

      addLog(`=== PROCESSANDO ARQUIVO 2: ${file2.name} ===`);
      addLog(`Total de linhas no arquivo 2: ${file2.data.length}`);

      addLog(`=== PRIMEIRAS 3 LINHAS (AMOSTRA) - DADOS RAW ===`);
      file2.data.slice(0, 3).forEach((row, idx) => {
        addLog(`Linha ${idx + 2} RAW:`, false);
        addLog(`  Array completo: [${row.map((v, i) => `[${i}]="${v}"`).join(', ')}]`, false);

        const sampleNome = file2NameIdx !== -1 ? normalizeValue(row[file2NameIdx]) : '';
        const sampleCpf = file2CpfIdx !== -1 ? normalizeValue(row[file2CpfIdx]) : '';
        const sampleTel = file2TelIdx !== -1 ? normalizeValue(row[file2TelIdx]) : '';

        if (file2NameIdx !== -1) {
          addLog(`  Nome - Índice: ${file2NameIdx}, Valor RAW: "${row[file2NameIdx]}", Normalizado: "${sampleNome}"`, false);
        } else {
          addLog(`  Nome - NÃO ENCONTRADO (índice: ${file2NameIdx})`, true);
        }

        addLog(`  Resultado: Nome="${sampleNome}" | CPF="${sampleCpf}" | Tel="${sampleTel}"`, false);
        addLog('', false);
      });

      file2.data.forEach((row, index) => {
        const cpf = file2CpfIdx !== -1 ? normalizeValue(row[file2CpfIdx]) : '';
        const nome = file2NameIdx !== -1 ? normalizeValue(row[file2NameIdx]) : '';
        const telefone = file2TelIdx !== -1 ? normalizeValue(row[file2TelIdx]) : '';
        const plano = file2PlanoIdx !== -1 ? normalizeValue(row[file2PlanoIdx]) : '';
        const status = file2StatusIdx !== -1 ? normalizeValue(row[file2StatusIdx]) : '';

        const hasAnyData = cpf || nome || telefone || plano || status;
        const key = hasAnyData
          ? `${cpf}|${telefone}|${nome}`.toLowerCase()
          : `empty_file2_${index}`;
        file2Count++;

        const isDuplicateInFile2 = hasAnyData && file2SeenKeys.has(key);
        file2SeenKeys.add(key);

        if (isDuplicateInFile2) {
          addLog(`Arquivo 2 - Linha ${index + 2} é DUPLICATA INTERNA (CPF: ${cpf || 'N/A'}, Tel: ${telefone || 'N/A'}, Nome: ${nome || 'N/A'})`, true);
          file2Duplicates++;
        }

        if (hasAnyData && recordsMap.has(key)) {
          const existing = recordsMap.get(key)!;
          recordsMap.set(key, {
            nome: mergeValues(existing.nome, nome),
            cpfCnpj: mergeValues(existing.cpfCnpj, cpf),
            linhaTelefonica: mergeValues(existing.linhaTelefonica, telefone),
            plano: mergeValues(existing.plano, plano),
            status: mergeValues(existing.status, status),
          });
          if (!isDuplicateInFile2) {
            file2Merged++;
          }
        } else {
          recordsMap.set(key, {
            nome: nome,
            cpfCnpj: cpf,
            linhaTelefonica: telefone,
            plano: plano,
            status: status,
          });
          if (!isDuplicateInFile2) {
            file2New++;
          }
        }
      });

      addLog(`Arquivo 2: ${file2Count} processados, ${file2Duplicates} duplicatas internas${file2Duplicates > 0 ? ' ⚠️' : ''}`);

      addLog('=== ESTATÍSTICAS DE UNIFICAÇÃO ===');
      addLog(`Arquivo 1: ${file1Count} registros processados, ${file1Duplicates} duplicatas`);
      addLog(`Arquivo 1: ${file1UniqueCount} registros únicos após remoção de duplicatas`);
      addLog(`Arquivo 2: ${file2Count} registros processados, ${file2Duplicates} duplicatas`);
      if (file2Merged > 0) {
        addLog(`Arquivo 2: ${file2Merged} registros mesclados com Arquivo 1`);
      }
      addLog(`Arquivo 2: ${file2New} registros novos adicionados`);
      addLog(`Total no Map: ${recordsMap.size} registros únicos`);

      const unifiedRecords = Array.from(recordsMap.values()).filter(
        record => record.nome || record.cpfCnpj || record.linhaTelefonica || record.plano || record.status
      );

      addLog(`Total após filtro final: ${unifiedRecords.length} registros`);
      addLog('');
      addLog('=== AMOSTRA DOS REGISTROS UNIFICADOS (primeiros 5) ===');
      unifiedRecords.slice(0, 5).forEach((record, idx) => {
        addLog(`[${idx + 1}] Nome: "${record.nome || '(VAZIO)'}" | CPF: "${record.cpfCnpj || '(VAZIO)'}" | Tel: "${record.linhaTelefonica || '(VAZIO)'}" | Plano: "${record.plano || '(VAZIO)'}" | Status: "${record.status || '(VAZIO)'}"`);
      });
      const finalDiscarded = recordsMap.size - unifiedRecords.length;
      if (finalDiscarded > 0) {
        addLog(`Descartados no filtro final: ${finalDiscarded}`, true);
      }

      const totalInput = file1.data.length + file2.data.length;
      const totalProcessed = file1Count + file2Count;
      const totalDuplicates = file1Duplicates + file2Duplicates;
      const totalDiscarded = (file1.data.length - file1Count) + (file2.data.length - file2Count) + finalDiscarded;

      addLog('');
      addLog('=== RESUMO FINAL ===');
      addLog(`📥 Total de linhas nos arquivos: ${totalInput}`);
      addLog(`✅ Total processado: ${totalProcessed}`);
      addLog(`🔄 Total de duplicatas encontradas: ${totalDuplicates}${totalDuplicates > 0 ? ' (sobrescritas automaticamente)' : ''}`);
      addLog(`📊 Registros únicos unificados: ${unifiedRecords.length}`);
      if (totalDiscarded > 0) {
        addLog(`⚠️ Total descartado: ${totalDiscarded}`, true);
      }
      if (totalDuplicates > 0) {
        addLog(`ℹ️ Cálculo: ${file1.data.length} (Arq1) + ${file2.data.length} (Arq2) - ${totalDuplicates} (duplicatas) - ${totalDiscarded} (descartados) = ${unifiedRecords.length} únicos`);
      }

      setUnifiedData(unifiedRecords);
      setUnificationDone(true);
    } catch (error) {
      console.error('Error unifying files:', error);
      alert('Erro ao unificar arquivos');
    } finally {
      setIsUnifying(false);
    }
  };

  const exportUnifiedData = () => {
    if (unifiedData.length === 0) {
      alert('Não há dados unificados para exportar');
      return;
    }

    const exportData = unifiedData.map((record) => ({
      'Nome': record.nome,
      'CPF/CNPJ': record.cpfCnpj,
      'Linha Telefônica': record.linhaTelefonica,
      'Plano': record.plano,
      'Status': record.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados Unificados');

    XLSX.writeFile(wb, `Planilha_Unificada_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleContractFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];

      if (jsonData.length === 0) {
        alert(`Arquivo ${file.name} está vazio`);
        return;
      }

      const { headerIndex, headers } = findHeaderRow(jsonData);
      const allDataRows = jsonData.slice(headerIndex + 1);

      const dataRows = allDataRows.filter((row) => {
        return row.some(cell =>
          cell !== undefined &&
          cell !== null &&
          String(cell).trim() !== ''
        );
      });

      const newFile: UploadedFile = {
        id: `contract-${Date.now()}`,
        name: file.name,
        data: dataRows,
        headers: headers,
      };

      setContractFile(newFile);
      addLog(`=== ARQUIVO DE CONTRATOS CARREGADO ===`);
      addLog(`Nome: ${file.name}`);
      addLog(`Total de linhas: ${dataRows.length}`);
    } catch (error) {
      console.error('Error reading contract file:', error);
      alert(`Erro ao ler arquivo ${file.name}`);
    }

    event.target.value = '';
  };

  const enrichDataWithContracts = () => {
    if (!contractFile) {
      alert('Por favor, faça upload do arquivo de contratos primeiro');
      return;
    }

    if (unifiedData.length === 0) {
      alert('Não há dados unificados para enriquecer');
      return;
    }

    clearLogs();
    setShowDiagnostics(true);
    setIsEnriching(true);
    setEnrichedData([]);

    console.log('INÍCIO DA FUNÇÃO ENRICH DATA');
    console.log('Unified Data:', unifiedData.length, 'registros');
    console.log('Contract File:', contractFile);

    try {
      addLog('=== SEGUNDA ETAPA: ENRIQUECIMENTO COM CONTRATOS ===');
      addLog(`Dados base: ${unifiedData.length} registros`);
      addLog(`Arquivo de contratos: ${contractFile.name} (${contractFile.data.length} linhas)`);
      addLog('');
      addLog('=== AMOSTRA DOS DADOS BASE (primeiros 5 registros) ===');
      unifiedData.slice(0, 5).forEach((record, idx) => {
        addLog(`[${idx + 1}] Nome: "${record.nome || '(vazio)'}" | CPF: "${record.cpfCnpj || '(vazio)'}" | Tel: "${record.linhaTelefonica || '(vazio)'}"`);
      });
      addLog('');

      console.log('Contract File Headers:', contractFile.headers);
      console.log('Contract File Data (first 3 rows):', contractFile.data.slice(0, 3));

      const telIdx = findColumnIndex(contractFile.headers, [
        'telefone', 'linha', 'tel', 'phone', 'celular', 'linha telefonica', 'linha telefônica',
        'numero', 'número', 'fone', 'contato', 'linha de telefone', 'nº linha', 'n linha',
        'terminal', 'msisdn', 'ddd + telefone'
      ]);

      const idContratoIdx = findColumnIndex(contractFile.headers, [
        'id contrato', 'contrato', 'id', 'codigo contrato', 'código contrato',
        'numero contrato', 'número contrato', 'contract id', 'contract'
      ]);

      const statusLinhaIdx = findColumnIndex(contractFile.headers, [
        'status linha', 'status da linha', 'situacao linha', 'situação linha',
        'estado linha', 'line status', 'status line'
      ]);

      console.log('Índices encontrados:');
      console.log('  telIdx:', telIdx);
      console.log('  idContratoIdx:', idContratoIdx);
      console.log('  statusLinhaIdx:', statusLinhaIdx);

      if (telIdx === -1) {
        alert('Não foi possível identificar a coluna de Telefone/Linha no arquivo de contratos');
        setIsEnriching(false);
        return;
      }

      addLog(`Coluna de Telefone identificada: "${contractFile.headers[telIdx]}" (índice ${telIdx})`);
      if (idContratoIdx !== -1) {
        addLog(`Coluna de ID Contrato identificada: "${contractFile.headers[idContratoIdx]}" (índice ${idContratoIdx})`);
      } else {
        addLog('Coluna de ID Contrato não identificada', true);
      }
      if (statusLinhaIdx !== -1) {
        addLog(`Coluna de Status da Linha identificada: "${contractFile.headers[statusLinhaIdx]}" (índice ${statusLinhaIdx})`);
      } else {
        addLog('Coluna de Status da Linha não identificada', true);
      }

      addLog('');
      addLog('=== CABEÇALHOS DO ARQUIVO DE CONTRATOS ===');
      contractFile.headers.forEach((header, idx) => {
        addLog(`[${idx}] ${header}`);
      });

      const contractMap = new Map<string, { idContrato: string; statusLinha: string }>();
      const allContractRecords: { telefone: string; idContrato: string; statusLinha: string; rowIndex: number }[] = [];

      contractFile.data.forEach((row, index) => {
        const telefone = telIdx !== -1 ? normalizeValue(row[telIdx]) : '';
        const idContrato = idContratoIdx !== -1 ? normalizeValue(row[idContratoIdx]) : '';
        const statusLinha = statusLinhaIdx !== -1 ? normalizeValue(row[statusLinhaIdx]) : '';

        allContractRecords.push({ telefone, idContrato, statusLinha, rowIndex: index });

        if (telefone && telefone !== '0') {
          const variations = generatePhoneVariations(telefone);

          variations.forEach(variation => {
            contractMap.set(variation, { idContrato, statusLinha });
          });

          if (index < 5) {
            addLog(`Exemplo linha ${index + 1}: Tel="${telefone}" | Variações: [${variations.join(', ')}] | ID="${idContrato}" | Status="${statusLinha}"`);
          }
        } else {
          if (index < 10) {
            addLog(`Linha ${index + 1}: Tel="${telefone || '(vazio)'}" | ID="${idContrato || '(vazio)'}" | Status="${statusLinha || '(vazio)'}" - incluída no relatório`);
          }
        }
      });

      addLog(`Total de linhas no arquivo de contratos: ${allContractRecords.length}`);

      addLog('');
      addLog(`Contratos indexados: ${contractMap.size} linhas telefônicas únicas`);

      console.log('Contract Map size:', contractMap.size);
      console.log('Contract Map (first 10 entries):', Array.from(contractMap.entries()).slice(0, 10));

      if (contractMap.size > 0) {
        const firstFive = Array.from(contractMap.entries()).slice(0, 5);
        addLog('Primeiros 5 telefones no Map:');
        firstFive.forEach(([phone, data]) => {
          addLog(`  ${phone} -> ID: ${data.idContrato}, Status: ${data.statusLinha}`);
        });
      }

      let matched = 0;
      let notMatched = 0;

      addLog('');
      addLog('=== BUSCANDO MATCHES ===');

      console.log('Unified Data (first 5 phones):', unifiedData.slice(0, 5).map(r => r.linhaTelefonica));

      addLog('');
      addLog('=== AMOSTRA DO MAP DE CONTRATOS (primeiros 20 telefones) ===');
      const contractMapSample = Array.from(contractMap.entries()).slice(0, 20);
      contractMapSample.forEach(([phone, data], idx) => {
        addLog(`  [${idx + 1}] "${phone}" → ID: ${data.idContrato}, Status: ${data.statusLinha}`);
      });
      addLog('');

      const enrichedRecords: EnrichedRecord[] = unifiedData.map((record, index) => {
        const normalizedPhone = normalizeTelefone(record.linhaTelefonica);
        const isDebugCpf = record.cpfCnpj === '13924649782';
        const contractInfo = findInContractMap(record.linhaTelefonica, contractMap, isDebugCpf);

        const showDebug = index < 5 || isDebugCpf;

        if (showDebug) {
          const variations = generatePhoneVariations(record.linhaTelefonica);
          console.log(`Match attempt ${index + 1} (CPF: ${record.cpfCnpj}):`, {
            cpf: record.cpfCnpj,
            original: record.linhaTelefonica,
            normalized: normalizedPhone,
            variations: variations,
            found: !!contractInfo,
            contractInfo: contractInfo
          });

          if (record.cpfCnpj === '13924649782') {
            addLog('');
            addLog('=== DEBUG DETALHADO PARA CPF 13924649782 ===');
            addLog(`Nome: ${record.nome}`);
            addLog(`Telefone original: "${record.linhaTelefonica}"`);
            addLog(`Telefone normalizado: "${normalizedPhone}"`);
            addLog(`Variações geradas: [${variations.join(', ')}]`);
            addLog('');
            addLog('Testando cada variação:');
            variations.forEach((variation, vIdx) => {
              const test = contractMap.get(variation);
              addLog(`  ${vIdx + 1}. "${variation}" → ${test ? `✓ ENCONTRADO (ID: ${test.idContrato})` : '✗ não encontrado'}`);
            });
            addLog('');
          }

          addLog(`[${index + 1}] CPF: ${record.cpfCnpj} | Tel: "${record.linhaTelefonica}"`);
          addLog(`    Variações: [${variations.join(', ')}]`);
          if (contractInfo) {
            const matchInfo = contractInfo.matchedVariation ? ` usando variação "${contractInfo.matchedVariation}"` : '';
            addLog(`    ✓ ENCONTRADO${matchInfo}! ID Contrato: "${contractInfo.idContrato}", Status: "${contractInfo.statusLinha}"`);
          } else {
            addLog(`    ✗ NÃO ENCONTRADO em nenhuma variação`, true);
          }
        }

        if (contractInfo) {
          matched++;
          return {
            ...record,
            idContrato: contractInfo.idContrato,
            statusLinha: contractInfo.statusLinha,
          };
        } else {
          notMatched++;
          if (notMatched <= 10) {
            const variations = generatePhoneVariations(record.linhaTelefonica);
            addLog(`✗ Linha "${record.linhaTelefonica}" não encontrada`, true);
            addLog(`   Variações testadas: ${variations.join(', ')}`, true);
          }
          return {
            ...record,
            idContrato: '',
            statusLinha: '',
          };
        }
      });

      const emptyOrZeroRecords = allContractRecords
        .filter(cr => !cr.telefone || cr.telefone === '0')
        .map(cr => ({
          nome: '',
          cpfCnpj: '',
          linhaTelefonica: cr.telefone || '',
          plano: '',
          status: '',
          idContrato: cr.idContrato,
          statusLinha: cr.statusLinha,
        }));

      const allEnrichedRecords = [...enrichedRecords, ...emptyOrZeroRecords];

      addLog('');
      addLog('=== RESULTADO DO ENRIQUECIMENTO ===');
      addLog(`✅ ${matched} registros encontrados e enriquecidos (${((matched / unifiedData.length) * 100).toFixed(1)}%)`);
      addLog(`⚠️ ${notMatched} registros não encontrados no arquivo de contratos (${((notMatched / unifiedData.length) * 100).toFixed(1)}%)`);
      addLog(`📋 ${emptyOrZeroRecords.length} linhas com telefone vazio ou "0" do arquivo de contratos incluídas`);
      addLog(`📊 Total final: ${allEnrichedRecords.length} registros`);
      addLog('');
      addLog('=== AMOSTRA DOS DADOS ENRIQUECIDOS (primeiros 5) ===');
      allEnrichedRecords.slice(0, 5).forEach((record, idx) => {
        addLog(`[${idx + 1}] Nome: "${record.nome || '(vazio)'}" | CPF: "${record.cpfCnpj || '(vazio)'}" | Tel: "${record.linhaTelefonica || '(vazio)'}" | ID Contrato: "${record.idContrato || '(vazio)'}" | Status Linha: "${record.statusLinha || '(vazio)'}"`);
      });

      setEnrichedData(allEnrichedRecords);
      setEnrichmentDone(true);
    } catch (error) {
      console.error('Error enriching data:', error);
      alert('Erro ao enriquecer dados com contratos');
    } finally {
      setIsEnriching(false);
    }
  };

  const normalizeTelefone = (phone: string): string => {
    if (!phone) return '';
    const phoneStr = String(phone).trim();
    return phoneStr.replace(/\D/g, '');
  };

  const generatePhoneVariations = (phone: string): string[] => {
    const normalized = normalizeTelefone(phone);
    if (!normalized) return [];

    const variations = new Set<string>();
    variations.add(normalized);

    if (normalized.startsWith('55')) {
      const withoutCountryCode = normalized.substring(2);
      variations.add(withoutCountryCode);

      if (withoutCountryCode.startsWith('0')) {
        variations.add(withoutCountryCode.substring(1));
      }
    }

    if (normalized.startsWith('0')) {
      variations.add(normalized.substring(1));
    }

    if (normalized.length >= 11) {
      variations.add(normalized.slice(-11));
      variations.add(normalized.slice(-10));
      variations.add(normalized.slice(-9));
    } else if (normalized.length >= 10) {
      variations.add(normalized.slice(-10));
      variations.add(normalized.slice(-9));
    } else if (normalized.length >= 9) {
      variations.add(normalized.slice(-9));
    }

    if (normalized.length >= 8) {
      variations.add(normalized.slice(-8));
    }

    if (normalized.length > 10) {
      const last11 = normalized.slice(-11);
      if (last11.startsWith('9') && last11.length === 11) {
        const without9 = last11.substring(0, 2) + last11.substring(3);
        variations.add(without9);
      }
    }

    return Array.from(variations).filter(v => v.length >= 8);
  };

  const findInContractMap = (
    phone: string,
    contractMap: Map<string, { idContrato: string; statusLinha: string }>,
    debug = false
  ): { idContrato: string; statusLinha: string; matchedVariation?: string } | null => {
    const variations = generatePhoneVariations(phone);

    for (const variation of variations) {
      const found = contractMap.get(variation);
      if (found) {
        return { ...found, matchedVariation: variation };
      }
    }

    if (debug) {
      console.log('Procurando telefones similares no Map...');
      const normalized = normalizeTelefone(phone);
      const last8 = normalized.slice(-8);

      let similarCount = 0;
      for (const [key] of contractMap.entries()) {
        if (key.includes(last8) || normalized.includes(key)) {
          console.log(`  Telefone similar encontrado: "${key}"`);
          similarCount++;
          if (similarCount >= 5) break;
        }
      }

      if (similarCount === 0) {
        console.log(`  Nenhum telefone similar encontrado para os últimos 8 dígitos: ${last8}`);
      }
    }

    return null;
  };

  const exportEnrichedData = () => {
    if (enrichedData.length === 0) {
      alert('Não há dados enriquecidos para exportar');
      return;
    }

    const exportData = enrichedData.map((record) => ({
      'Nome': record.nome,
      'CPF/CNPJ': record.cpfCnpj,
      'Linha Telefônica': record.linhaTelefonica,
      'Plano': record.plano,
      'Status': record.status,
      'ID Contrato': record.idContrato,
      'Status da Linha': record.statusLinha,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados Completos');

    XLSX.writeFile(wb, `Planilha_Completa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (viewMode === 'view-saved' && selectedReconciliation) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('history');
                  setSelectedReconciliation(null);
                  setSavedRecords([]);
                }}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedReconciliation.name}</h2>
                <p className="text-sm text-slate-600">
                  {selectedReconciliation.total_records} registros | Criado em {formatDate(selectedReconciliation.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={exportSavedData}
              disabled={loadingRecords || savedRecords.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-semibold disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Exportar Excel
            </button>
          </div>

          {selectedReconciliation.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">{selectedReconciliation.description}</p>
            </div>
          )}

          {loadingRecords ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-y-2 border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      CPF/CNPJ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Linha Telefônica
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Plano
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {savedRecords.slice(0, 100).map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                        {record.nome || <span className="text-slate-400 italic">(não informado)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {record.cpfCnpj || <span className="text-slate-400 italic">(não informado)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {record.linhaTelefonica || <span className="text-slate-400 italic">(não informado)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {record.plano || <span className="text-slate-400 italic">(não informado)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.status ? (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            record.status.toLowerCase().includes('ativo') || record.status.toLowerCase().includes('active')
                              ? 'bg-green-100 text-green-800'
                              : record.status.toLowerCase().includes('inativo') || record.status.toLowerCase().includes('inactive')
                              ? 'bg-red-100 text-red-800'
                              : record.status.toLowerCase().includes('pendente') || record.status.toLowerCase().includes('pending')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">(não informado)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {savedRecords.length > 100 && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Exibindo 100 de {savedRecords.length} registros. Exporte para Excel para ver todos.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'history') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('main')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-3 rounded-xl shadow-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Histórico de Conciliações</h2>
                <p className="text-sm text-slate-600">Visualize e gerencie conciliações salvas</p>
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : savedReconciliations.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Nenhuma conciliação salva</h3>
              <p className="text-sm text-slate-500 mt-1">As conciliações salvas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReconciliations.map((reconciliation) => (
                <div
                  key={reconciliation.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{reconciliation.name}</h3>
                      {reconciliation.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{reconciliation.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {reconciliation.total_records} registros
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(reconciliation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewSaved(reconciliation)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditClick(reconciliation)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(reconciliation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Editar Conciliação</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Nome da conciliação"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Descrição da conciliação"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReconciliation(null);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateReconciliation}
                  disabled={isUpdating || !editName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja excluir esta conciliação? Esta ação não pode ser desfeita e todos os registros serão removidos permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingId(null);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-3 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Conciliação de Arquivos</h2>
              <p className="text-sm text-slate-600">Compare planilhas e identifique diferenças</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
          >
            <History className="w-5 h-5" />
            Histórico
          </button>
        </div>

        <div className="mb-6">
          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-slate-400 focus:outline-none">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="font-medium text-slate-600">
                Clique para selecionar um ou mais arquivos
              </span>
              <span className="text-xs text-slate-500">
                Suporta: .xlsx, .xls
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Arquivos Importados ({uploadedFiles.length})
            </h3>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {file.data.length} linhas x {file.headers.length} colunas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadedFiles.length >= 2 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={compareFiles}
              disabled={isComparing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isComparing ? 'Comparando...' : 'Comparar Arquivos'}
            </button>
            <button
              type="button"
              onClick={unifyFiles}
              disabled={isUnifying}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
            >
              <GitMerge className="w-5 h-5" />
              {isUnifying ? 'Unificando...' : 'Unificar Planilhas'}
            </button>
            {comparisonDone && differences.length > 0 && (
              <button
                type="button"
                onClick={exportDifferences}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-semibold"
              >
                Exportar Diferenças
              </button>
            )}
          </div>
        )}
      </div>

      {!showDiagnostics && diagnosticLogs.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Logs de diagnóstico disponíveis ({diagnosticLogs.length} linhas)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDiagnostics(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Visualizar Logs
            </button>
          </div>
        </div>
      )}

      {showDiagnostics && diagnosticLogs.length > 0 && (
        <div ref={diagnosticPanelRef} className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Logs de Diagnóstico</h3>
                <p className="text-sm text-slate-600">Detalhamento do processamento</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDiagnostics(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Ocultar logs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto border-2 border-slate-200">
            <div className="space-y-1 font-mono text-xs">
              {diagnosticLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('❌') || log.includes('⚠️')
                      ? 'text-red-600'
                      : log.includes('===')
                      ? 'text-blue-700 font-semibold mt-2'
                      : 'text-slate-700'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const logText = diagnosticLogs.join('\n');
                const blob = new Blob([logText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diagnostico-conciliacao-${new Date().toISOString().slice(0, 10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Logs
            </button>
            <button
              type="button"
              onClick={clearLogs}
              className="px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>
      )}

      {comparisonDone && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            {differences.length === 0 ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Nenhuma diferença encontrada</h3>
                  <p className="text-sm text-slate-600">Os arquivos são idênticos</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {differences.length} diferença{differences.length !== 1 ? 's' : ''} encontrada{differences.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-slate-600">Comparando: {uploadedFiles[0]?.name} vs {uploadedFiles[1]?.name}</p>
                </div>
              </>
            )}
          </div>

          {differences.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-y-2 border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Linha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Coluna
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {uploadedFiles[0]?.name}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {uploadedFiles[1]?.name}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {differences.slice(0, 100).map((diff, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                        {diff.row}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                        {diff.column}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                          {diff.file1Value || <span className="text-slate-400 italic">(vazio)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                          {diff.file2Value || <span className="text-slate-400 italic">(vazio)</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {differences.length > 100 && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Exibindo 100 de {differences.length} diferenças. Exporte para Excel para ver todas.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {unificationDone && unifiedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <GitMerge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Planilha Unificada</h3>
                <p className="text-sm text-slate-600">
                  {unifiedData.length} registro{unifiedData.length !== 1 ? 's' : ''} unificado{unifiedData.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSaveName('');
                  setSaveDescription('');
                  setShowSaveModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-semibold"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
              <button
                type="button"
                onClick={exportUnifiedData}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-semibold"
              >
                <Download className="w-5 h-5" />
                Exportar Excel
              </button>
              <button
                type="button"
                onClick={() => setShowSecondStage(!showSecondStage)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-semibold"
              >
                <FileSpreadsheet className="w-5 h-5" />
                {showSecondStage ? 'Ocultar' : 'Segunda Etapa'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    CPF/CNPJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Linha Telefônica
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unifiedData.slice(0, 100).map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                      {record.nome || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.cpfCnpj || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.linhaTelefonica || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.plano || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.status ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          record.status.toLowerCase().includes('ativo') || record.status.toLowerCase().includes('active')
                            ? 'bg-green-100 text-green-800'
                            : record.status.toLowerCase().includes('inativo') || record.status.toLowerCase().includes('inactive')
                            ? 'bg-red-100 text-red-800'
                            : record.status.toLowerCase().includes('pendente') || record.status.toLowerCase().includes('pending')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {record.status}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">(não informado)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unifiedData.length > 100 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Exibindo 100 de {unifiedData.length} registros. Exporte para Excel para ver todos.
              </div>
            )}
          </div>
        </div>
      )}

      {showSecondStage && unificationDone && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-xl shadow-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Segunda Etapa - Enriquecimento com Contratos</h3>
              <p className="text-sm text-slate-600">
                Adicione um arquivo com informações de contratos para enriquecer os dados unificados
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Arquivo de Contratos (deve conter: Linha Telefônica, ID Contrato, Status da Linha)
              </label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                  <Upload className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-slate-700">
                    {contractFile ? contractFile.name : 'Selecionar arquivo Excel (.xlsx, .xls)'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleContractFileUpload}
                    className="hidden"
                  />
                </label>
                {contractFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setContractFile(null);
                      setEnrichedData([]);
                      setEnrichmentDone(false);
                    }}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {contractFile && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">
                    Arquivo carregado: {contractFile.name} ({contractFile.data.length} linhas)
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={enrichDataWithContracts}
              disabled={!contractFile || isEnriching}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnriching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <GitMerge className="w-5 h-5" />
                  Enriquecer Dados com Contratos
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {enrichmentDone && enrichedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-xl shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Dados Completos (Enriquecidos)</h3>
                <p className="text-sm text-slate-600">
                  {enrichedData.length} registro{enrichedData.length !== 1 ? 's' : ''} com informações de contratos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportEnrichedData}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-semibold"
            >
              <Download className="w-5 h-5" />
              Exportar Excel Completo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    CPF/CNPJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Linha Telefônica
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wide bg-green-50">
                    ID Contrato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wide bg-green-50">
                    Status da Linha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedData.slice(0, 100).map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                      {record.nome || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.cpfCnpj || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.linhaTelefonica || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.plano || <span className="text-slate-400 italic">(não informado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.status ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          record.status.toLowerCase().includes('ativo') || record.status.toLowerCase().includes('active')
                            ? 'bg-green-100 text-green-800'
                            : record.status.toLowerCase().includes('inativo') || record.status.toLowerCase().includes('inactive')
                            ? 'bg-red-100 text-red-800'
                            : record.status.toLowerCase().includes('pendente') || record.status.toLowerCase().includes('pending')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {record.status}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">(não informado)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm bg-green-50">
                      {record.idContrato ? (
                        <span className="font-medium text-green-800">{record.idContrato}</span>
                      ) : (
                        <span className="text-slate-400 italic">(não encontrado)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm bg-green-50">
                      {record.statusLinha ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          record.statusLinha.toLowerCase().includes('ativo') || record.statusLinha.toLowerCase().includes('active')
                            ? 'bg-green-100 text-green-800'
                            : record.statusLinha.toLowerCase().includes('inativo') || record.statusLinha.toLowerCase().includes('inactive')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {record.statusLinha}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">(não encontrado)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enrichedData.length > 100 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Exibindo 100 de {enrichedData.length} registros. Exporte para Excel para ver todos.
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Save className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Salvar Conciliação</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Conciliação Janeiro 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Adicione observações sobre esta conciliação"
                />
              </div>
              <div className="text-sm text-slate-500">
                <p>Arquivos: {uploadedFiles[0]?.name} + {uploadedFiles[1]?.name}</p>
                <p>Total de registros: {unifiedData.length}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReconciliation}
                disabled={isSaving || !saveName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
