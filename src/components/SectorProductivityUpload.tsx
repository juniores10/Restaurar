import { useState, useEffect, useRef, useCallback } from 'react';
import { FileSpreadsheet, AlertCircle, X, Trash2, Save, CreditCard as Edit3, Plus, UserPlus, Grid3x3, Copy, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { formatDateTimeBRT } from '../utils/dateUtils';

interface Sector {
  id: string;
  description: string;
}

interface Employee {
  id: string;
  name: string;
  department_id: string;
}

interface ImportError {
  employeeName: string;
  reason: string;
}

interface UploadRecord {
  id: string;
  sector_id: string;
  file_name: string;
  reference_month: string;
  total_records: number;
  matched_records: number;
  unmatched_records: number;
  upload_date: string;
  error_log: ImportError[];
  description?: string;
  sector?: {
    id: string;
    description: string;
  };
}

interface ProductivityRecord {
  id: string;
  employee_name_original: string;
  employee_id: string | null;
  work_date: string;
  points: number;
  category: string | null;
  is_matched: boolean;
  section_type: string;
  subject: string | null;
}

interface SectionData {
  title: string;
  type: string;
  startRow: number;
  endRow: number;
  headerRow: number;
  dateColumns: { index: number; date: Date; excelValue: number }[];
  hasSubject: boolean;
  subjectIndex?: number;
}

interface ProductivitySection {
  id: string;
  upload_id: string;
  title: string;
  section_key: string;
  display_order: number;
  has_subject: boolean;
  show_employee_total: boolean;
  show_day_total: boolean;
  status: number;
  created_at: string;
}

export function SectorProductivityUpload() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [records, setRecords] = useState<ProductivityRecord[]>([]);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState('');
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editedRecords, setEditedRecords] = useState<Record<string, Record<string, Record<number, number | string | null>>>>({});
  const [editedSectionOptions, setEditedSectionOptions] = useState<Record<string, { show_day_total?: boolean; show_employee_total?: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showManualPeriodModal, setShowManualPeriodModal] = useState(false);
  const [manualPeriodData, setManualPeriodData] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    description: ''
  });
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [addEmployeeSection, setAddEmployeeSection] = useState<string | null>(null);
  const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState<string>('');
  const [copyPreviousData, setCopyPreviousData] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneData, setCloneData] = useState({
    targetMonth: new Date().getMonth(),
    targetYear: new Date().getFullYear()
  });
  const [isCloning, setIsCloning] = useState(false);
  const [previousMonthUpload, setPreviousMonthUpload] = useState<UploadRecord | null>(null);
  const [_selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [currentBulkSection, setCurrentBulkSection] = useState<string>('');
  const [productivityCategories, setProductivityCategories] = useState<Array<{id: string, code: string, name: string, color: string}>>([]);
  const tableScrollRefs = useRef<Map<string, { top: HTMLDivElement | null, bottom: HTMLDivElement | null }>>(new Map());
  const isSyncing = useRef<Set<string>>(new Set());
  const [newEmployeeData, setNewEmployeeData] = useState({
    employeeIds: [] as string[],
    tables: [{
      name: '',
      hasSubject: false,
      showEmployeeTotal: false,
      showDayTotal: false,
      subjects: ['']
    }]
  });
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [addSubjectData, setAddSubjectData] = useState({
    employeeName: '',
    employeeId: '',
    sectionType: '',
    subjects: ['']
  });
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editSubjectData, setEditSubjectData] = useState({
    employeeName: '',
    sectionType: '',
    oldSubject: '',
    newSubject: ''
  });
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [deleteSubjectData, setDeleteSubjectData] = useState({
    employeeName: '',
    sectionType: '',
    subject: ''
  });
  const [sections, setSections] = useState<ProductivitySection[]>([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ProductivitySection | null>(null);
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    section_key: '',
    has_subject: false,
    show_employee_total: false,
    show_day_total: false,
    display_order: 0
  });

  useEffect(() => {
    loadSectors();
    loadProductivityCategories();
    loadHolidays();
  }, []);

  const loadProductivityCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('productivity_categories')
        .select('id, code, name, color')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setProductivityCategories(data || []);
    } catch (error) {
      console.error('Error loading productivity categories:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('date')
        .eq('status', 0);

      if (error) throw error;
      const holidayDates = new Set(data?.map(h => h.date) || []);
      setHolidays(holidayDates);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  useEffect(() => {
    if (selectedSector) {
      loadEmployees();
      loadUploads();
    } else {
      setEmployees([]);
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedUpload) {
      loadRecords(selectedUpload.id);
      loadSections(selectedUpload.id);
      setIsEditingMode(false);
      setEditedRecords({});
      setHasChanges(false);
    }
  }, [selectedUpload]);

  const loadSectors = async () => {
    try {
      const { data, error } = await supabase
        .from('data_types')
        .select('id, description')
        .eq('type', 2)
        .eq('status', 0)
        .order('description');

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error('Error loading sectors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!selectedSector) return;

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, department_id')
        .eq('department_id', selectedSector)
        .in('status', [0, 1, 2, 3])
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('sector_productivity_uploads')
        .select(`
          *,
          sector:data_types!sector_id(id, description)
        `)
        .eq('sector_id', selectedSector)
        .order('reference_month', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
      if (data && data.length > 0 && !selectedUpload) {
        setSelectedUpload(data[0]);
      }
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  };

  const loadRecords = async (uploadId: string) => {
    try {
      const { data, error } = await supabase
        .from('sector_productivity_records')
        .select('*')
        .eq('upload_id', uploadId)
        .order('work_date', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const loadSections = async (uploadId: string) => {
    try {
      const { data, error } = await supabase
        .from('productivity_sections')
        .select('*')
        .eq('upload_id', uploadId)
        .eq('status', 0)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleCreateSection = async () => {
    if (!selectedUpload || !sectionFormData.title.trim() || !sectionFormData.section_key.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const sectionData = {
        upload_id: selectedUpload.id,
        title: sectionFormData.title.trim(),
        section_key: sectionFormData.section_key.trim().toUpperCase().replace(/\s+/g, '_'),
        has_subject: sectionFormData.has_subject,
        show_employee_total: sectionFormData.show_employee_total,
        show_day_total: sectionFormData.show_day_total,
        display_order: sectionFormData.display_order || sections.length + 1,
        status: 0
      };

      if (editingSection) {
        const { error } = await supabase
          .from('productivity_sections')
          .update(sectionData)
          .eq('id', editingSection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('productivity_sections')
          .insert([sectionData]);

        if (error) throw error;
      }

      await loadSections(selectedUpload.id);
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionFormData({ title: '', section_key: '', has_subject: false, show_employee_total: false, show_day_total: false, display_order: 0 });
    } catch (error: any) {
      console.error('Error creating/updating section:', error);
      if (error.code === '23505') {
        alert('Já existe uma tabela com essa chave neste período');
      } else {
        alert('Erro ao salvar tabela: ' + error.message);
      }
    }
  };

  const handleEditSection = (section: ProductivitySection) => {
    setEditingSection(section);
    setSectionFormData({
      title: section.title,
      section_key: section.section_key,
      has_subject: section.has_subject,
      show_employee_total: section.show_employee_total,
      show_day_total: section.show_day_total,
      display_order: section.display_order
    });
    setShowSectionModal(true);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tabela? Os registros associados NÃO serão excluídos.')) return;

    try {
      const { error } = await supabase
        .from('productivity_sections')
        .update({ status: 1 })
        .eq('id', sectionId);

      if (error) throw error;

      if (selectedUpload) {
        await loadSections(selectedUpload.id);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Erro ao excluir tabela');
    }
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    let matches = 0;
    const shorterWords = shorter.split(' ').filter(w => w.length > 2);
    const longerWords = longer.split(' ').filter(w => w.length > 2);

    for (const sw of shorterWords) {
      for (const lw of longerWords) {
        if (sw === lw || lw.includes(sw) || sw.includes(lw)) {
          matches++;
          break;
        }
        if (sw.length > 3 && lw.length > 3) {
          const maxLen = Math.max(sw.length, lw.length);
          let commonChars = 0;
          for (let i = 0; i < Math.min(sw.length, lw.length); i++) {
            if (sw[i] === lw[i]) commonChars++;
          }
          if (commonChars / maxLen > 0.7) {
            matches++;
            break;
          }
        }
      }
    }

    return matches / Math.max(shorterWords.length, 1);
  };

  const findEmployeeByName = (name: string): Employee | undefined => {
    const normalizedName = normalizeString(name);

    let exactMatch = employees.find(emp => normalizeString(emp.name) === normalizedName);
    if (exactMatch) return exactMatch;

    let containsMatch = employees.find(emp => {
      const empNormalized = normalizeString(emp.name);
      return empNormalized.includes(normalizedName) || normalizedName.includes(empNormalized);
    });
    if (containsMatch) return containsMatch;

    const nameParts = normalizedName.split(' ').filter(p => p.length > 2);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];

      let firstLastMatch = employees.find(emp => {
        const empParts = normalizeString(emp.name).split(' ').filter(p => p.length > 2);
        if (empParts.length < 2) return false;
        const empFirst = empParts[0];
        const empLast = empParts[empParts.length - 1];
        return empFirst === firstName && (empLast === lastName || empLast.includes(lastName.slice(0, 4)) || lastName.includes(empLast.slice(0, 4)));
      });
      if (firstLastMatch) return firstLastMatch;
    }

    let bestMatch: Employee | undefined;
    let bestScore = 0;

    for (const emp of employees) {
      const score = calculateSimilarity(name, emp.name);
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = emp;
      }
    }

    return bestMatch;
  };

  const excelDateToJSDate = (excelDate: number): Date => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
  };

  const excelDateToString = (excelDate: number): string => {
    const days = Math.floor(excelDate - 25569);
    const date = new Date(days * 86400 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const findSections = (jsonData: any[][]): SectionData[] => {
    const sections: SectionData[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue;

      const cellValue = String(row[0]).trim();

      if (cellValue.includes('ATENDIMENTOS') || cellValue.includes('IXC')) {
        const sectionType = cellValue.includes('IXC') ? 'IXC' : 'ATENDIMENTOS_OPA';
        const title = cellValue;

        let headerRow = i + 1;
        while (headerRow < jsonData.length) {
          const hRow = jsonData[headerRow];
          if (hRow && hRow[0] === 'Colaborador') break;
          headerRow++;
        }

        if (headerRow >= jsonData.length) continue;

        const hasSubject = sectionType === 'IXC' &&
          jsonData[headerRow] &&
          jsonData[headerRow][1] === 'Assunto';

        let endRow = headerRow + 1;
        while (endRow < jsonData.length) {
          const eRow = jsonData[endRow];
          if (!eRow || !eRow[0]) {
            endRow++;
            continue;
          }
          const val = String(eRow[0]).toLowerCase().trim();
          if (val === 'total' || val.includes('total geral')) {
            break;
          }
          if (val.includes('atendimentos') || val.includes('ixc')) {
            break;
          }
          endRow++;
        }

        const dateColumns: { index: number; date: Date; excelValue: number }[] = [];
        const hRow = jsonData[headerRow];
        const startColIndex = hasSubject ? 3 : 2;

        for (let col = startColIndex; col < hRow.length; col++) {
          const cellVal = hRow[col];
          if (typeof cellVal === 'number' && cellVal > 40000 && cellVal < 50000) {
            dateColumns.push({ index: col, date: excelDateToJSDate(cellVal), excelValue: cellVal });
          }
        }

        sections.push({
          title,
          type: sectionType,
          startRow: headerRow + 1,
          endRow,
          headerRow,
          dateColumns,
          hasSubject,
          subjectIndex: hasSubject ? 1 : undefined
        });
      }
    }

    return sections;
  };

  const handleDeleteUpload = async (uploadId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta planilha e todos os registros associados?')) return;

    try {
      await supabase.from('sector_productivity_records').delete().eq('upload_id', uploadId);
      await supabase.from('sector_productivity_uploads').delete().eq('id', uploadId);

      if (selectedUpload?.id === uploadId) {
        setSelectedUpload(null);
        setRecords([]);
        setSections([]);
      }

      await loadUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Erro ao excluir planilha');
    }
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getSectionTypes = (): string[] => {
    return sections.map(s => s.section_key);
  };

  const getSectionTitle = (sectionType: string): string => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.title || sectionType;
  };

  const getSectionHasSubject = (sectionType: string): boolean => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.has_subject || false;
  };

  const getSectionShowEmployeeTotal = (sectionType: string): boolean => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.show_employee_total || false;
  };

  const getSectionShowDayTotal = (sectionType: string): boolean => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.show_day_total || false;
  };

  const syncScroll = useCallback((sectionKey: string, source: 'top' | 'bottom') => {
    if (isSyncing.current.has(sectionKey)) return;

    const refs = tableScrollRefs.current.get(sectionKey);
    if (!refs) return;

    const sourceEl = source === 'top' ? refs.top : refs.bottom;
    const targetEl = source === 'top' ? refs.bottom : refs.top;

    if (sourceEl && targetEl) {
      isSyncing.current.add(sectionKey);
      targetEl.scrollLeft = sourceEl.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current.delete(sectionKey);
      });
    }
  }, []);

  const setScrollRef = useCallback((sectionKey: string, position: 'top' | 'bottom', el: HTMLDivElement | null) => {
    if (!el) return;
    const refs = tableScrollRefs.current.get(sectionKey) || { top: null, bottom: null };
    tableScrollRefs.current.set(sectionKey, { ...refs, [position]: el });
  }, []);

  const handleToggleSectionOption = (sectionType: string, field: 'show_day_total' | 'show_employee_total', value: boolean) => {
    setEditedSectionOptions(prev => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>, sectionType: string, employeeKey: string, day: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const allInputsInColumn = Array.from(
        document.querySelectorAll(`input[data-section="${sectionType}"][data-day="${day}"]`)
      ) as HTMLInputElement[];

      const currentIndex = allInputsInColumn.findIndex(input =>
        input.getAttribute('data-employee') === employeeKey
      );

      if (currentIndex !== -1 && currentIndex < allInputsInColumn.length - 1) {
        const nextInput = allInputsInColumn[currentIndex + 1];
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const allInputsInColumn = Array.from(
        document.querySelectorAll(`input[data-section="${sectionType}"][data-day="${day}"]`)
      ) as HTMLInputElement[];

      const currentIndex = allInputsInColumn.findIndex(input =>
        input.getAttribute('data-employee') === employeeKey
      );

      if (currentIndex > 0) {
        const prevInput = allInputsInColumn[currentIndex - 1];
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-section="${sectionType}"][data-employee="${employeeKey}"][data-day="${day + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-section="${sectionType}"][data-employee="${employeeKey}"][data-day="${day - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const groupRecordsByEmployee = (sectionType: string) => {
    const sectionRecords = records.filter(r => r.section_type === sectionType);
    const employeeMap: Record<string, {
      name: string;
      matched: boolean;
      employeeId: string | null;
      subjects: {
        subject: string | null;
        dailyPoints: Record<string, number | string | null>;
        total: number;
      }[];
      totalAllSubjects: number;
    }> = {};

    sectionRecords.forEach(record => {
      const employeeName = record.employee_name_original;

      if (!employeeMap[employeeName]) {
        employeeMap[employeeName] = {
          name: employeeName,
          matched: record.is_matched,
          employeeId: record.employee_id,
          subjects: [],
          totalAllSubjects: 0
        };
      }

      const subjectKey = record.subject || '_NO_SUBJECT_';
      let subjectEntry = employeeMap[employeeName].subjects.find(s =>
        (s.subject || '_NO_SUBJECT_') === subjectKey
      );

      if (!subjectEntry) {
        subjectEntry = {
          subject: record.subject,
          dailyPoints: {},
          total: 0
        };
        employeeMap[employeeName].subjects.push(subjectEntry);
      }

      const day = new Date(record.work_date + 'T12:00:00').getDate();
      const key = record.subject
        ? `${record.employee_name_original}__${record.subject}`
        : record.employee_name_original;
      const editedValue = editedRecords[sectionType]?.[key]?.[day];

      let originalValue: number | string | null;
      if (record.category && (record.points === null || record.points === undefined || record.points === 0)) {
        originalValue = record.category;
      } else if (record.points !== null && record.points !== undefined) {
        originalValue = record.points;
      } else {
        originalValue = record.category || '';
      }

      subjectEntry.dailyPoints[day] = editedValue !== undefined ? editedValue : originalValue;
    });

    Object.values(employeeMap).forEach(emp => {
      emp.subjects.forEach(sub => {
        const total = Object.values(sub.dailyPoints).reduce((sum: number, val) => {
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
        sub.total = Math.round(total * 10) / 10;
      });

      emp.totalAllSubjects = Math.round(emp.subjects.reduce((sum, sub) => sum + sub.total, 0) * 10) / 10;

      emp.subjects.sort((a, b) => {
        if (!a.subject && !b.subject) return 0;
        if (!a.subject) return -1;
        if (!b.subject) return 1;
        return a.subject.localeCompare(b.subject);
      });
    });

    return Object.values(employeeMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  const handlePointChange = (sectionType: string, employeeKey: string, day: number, value: string) => {
    setEditedRecords(prev => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [employeeKey]: {
          ...prev[sectionType]?.[employeeKey],
          [day]: value === '' ? null : value
        }
      }
    }));
    setHasChanges(true);
  };

  const handlePointBlur = (sectionType: string, employeeKey: string, day: number, value: string) => {
    let finalValue: number | string | null;

    if (value === '') {
      finalValue = null;
    } else {
      const normalizedValue = value.replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      finalValue = isNaN(numValue) ? value.toUpperCase() : numValue;
    }

    setEditedRecords(prev => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [employeeKey]: {
          ...prev[sectionType]?.[employeeKey],
          [day]: finalValue
        }
      }
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedUpload || (Object.keys(editedRecords).length === 0 && Object.keys(editedSectionOptions).length === 0)) {
      alert('Nao ha alteracoes para salvar');
      return;
    }

    setIsSaving(true);

    const recordsToInsert: any[] = [];
    const recordsToUpdate: { id: string; data: any }[] = [];
    const recordIdsToDelete: string[] = [];

    try {
      for (const [sectionType, sectionEdits] of Object.entries(editedRecords)) {
        if (!sectionEdits || Object.keys(sectionEdits).length === 0) continue;

        for (const [employeeKey, dayChanges] of Object.entries(sectionEdits)) {
          const [employeeName, subject] = employeeKey.includes('__')
            ? employeeKey.split('__')
            : [employeeKey, null];

          for (const [day, value] of Object.entries(dayChanges)) {
            const dayNum = parseInt(day);
            const date = new Date(selectedUpload.reference_month + 'T12:00:00');
            const workDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            const existingRecord = records.find(r =>
              r.employee_name_original === employeeName &&
              r.section_type === sectionType &&
              (subject ? r.subject === subject : true) &&
              new Date(r.work_date + 'T12:00:00').getDate() === dayNum
            );

            if (existingRecord) {
              if (value === null) {
                recordIdsToDelete.push(existingRecord.id);
              } else {
                const updateData: any = {};
                if (typeof value === 'number') {
                  updateData.points = value;
                  updateData.category = null;
                } else {
                  updateData.points = 0;
                  updateData.category = value || null;
                }
                recordsToUpdate.push({ id: existingRecord.id, data: updateData });
              }
            } else if (value !== '' && value !== null && value !== undefined) {
              const employee = records.find(r =>
                r.employee_name_original === employeeName &&
                r.section_type === sectionType
              );

              recordsToInsert.push({
                upload_id: selectedUpload.id,
                sector_id: selectedSector,
                employee_id: employee?.employee_id || null,
                employee_name_original: employeeName,
                work_date: workDateStr,
                points: typeof value === 'number' ? value : 0,
                category: typeof value === 'string' ? value : null,
                is_matched: employee?.is_matched || false,
                section_type: sectionType,
                subject: subject
              });
            }
          }
        }
      }

      let successCount = 0;
      let errorCount = 0;

      if (recordIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('sector_productivity_records')
          .delete()
          .in('id', recordIdsToDelete);

        if (deleteError) {
          console.error('Batch delete error:', deleteError);
          errorCount += recordIdsToDelete.length;
        } else {
          successCount += recordIdsToDelete.length;
        }
      }

      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('sector_productivity_records')
          .insert(recordsToInsert);

        if (insertError) {
          console.error('Batch insert error:', insertError);
          errorCount += recordsToInsert.length;
        } else {
          successCount += recordsToInsert.length;
        }
      }

      if (recordsToUpdate.length > 0) {
        const updatePromises = recordsToUpdate.map(({ id, data }) =>
          supabase
            .from('sector_productivity_records')
            .update(data)
            .eq('id', id)
        );

        const updateResults = await Promise.all(updatePromises);
        updateResults.forEach((result, index) => {
          if (result.error) {
            console.error('Update error:', result.error);
            errorCount++;
          } else {
            successCount++;
          }
        });
      }

      const sectionUpdatePromises = Object.entries(editedSectionOptions).map(async ([sectionType, options]) => {
        const section = sections.find(s => s.section_key === sectionType);
        if (!section) return;

        const updateData: any = {};
        if (options.show_day_total !== undefined) {
          updateData.show_day_total = options.show_day_total;
        }
        if (options.show_employee_total !== undefined) {
          updateData.show_employee_total = options.show_employee_total;
        }

        if (Object.keys(updateData).length > 0) {
          return supabase
            .from('productivity_sections')
            .update(updateData)
            .eq('id', section.id);
        }
      });

      await Promise.all(sectionUpdatePromises.filter(Boolean));

      await Promise.all([
        loadRecords(selectedUpload.id),
        loadSections(selectedUpload.id)
      ]);

      setEditedRecords({});
      setEditedSectionOptions({});
      setHasChanges(false);
      setIsEditingMode(false);
      setSelectedRows(new Set());

      if (errorCount > 0) {
        alert(`Salvamento concluido: ${successCount} operacoes bem-sucedidas, ${errorCount} falharam.`);
      } else {
        alert(`${successCount} alteracao(oes) salva(s) com sucesso!`);
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      alert(`Erro ao salvar alteracoes: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedRecords({});
    setEditedSectionOptions({});
    setHasChanges(false);
    setIsEditingMode(false);
    setSelectedRows(new Set());
  };

  const handleAddEmployeeToSection = async () => {
    if (!selectedUpload || !addEmployeeSection || !selectedEmployeeToAdd) {
      alert('Selecione um colaborador');
      return;
    }

    try {
      const { data: uploadExists, error: checkError } = await supabase
        .from('sector_productivity_uploads')
        .select('id')
        .eq('id', selectedUpload.id)
        .maybeSingle();

      if (checkError || !uploadExists) {
        console.error('Upload verification error:', checkError);
        alert('Erro: O periodo selecionado nãoexiste. Por favor, recarregue a pagina e tente novamente.');
        await loadUploads();
        return;
      }

      const employee = employees.find(e => e.id === selectedEmployeeToAdd);
      if (!employee) return;

      const existingEmployeeRecords = records.filter(
        r => r.section_type === addEmployeeSection && r.employee_id === employee.id
      );

      if (existingEmployeeRecords.length > 0) {
        alert('Este colaborador ja esta na secao');
        return;
      }

      const date = new Date(selectedUpload.reference_month + 'T12:00:00');
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const section = sections.find(s => s.section_key === addEmployeeSection);
      const subjectsForSection = section?.has_subject
        ? [...new Set(records.filter(r => r.section_type === addEmployeeSection && r.subject).map(r => r.subject as string))]
        : [];

      const recordsToInsert = [];

      let previousRecords: any[] = [];
      if (copyPreviousData) {
        const previousMonth = month === 0 ? 11 : month - 1;
        const previousYear = month === 0 ? year - 1 : year;
        const previousMonthStr = `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}-01`;

        const { data: previousUploadData } = await supabase
          .from('sector_productivity_uploads')
          .select('id')
          .eq('sector_id', selectedSector)
          .eq('reference_month', previousMonthStr)
          .maybeSingle();

        if (previousUploadData) {
          const { data: prevRecords } = await supabase
            .from('sector_productivity_records')
            .select('*')
            .eq('upload_id', previousUploadData.id)
            .eq('employee_id', employee.id)
            .eq('section_type', addEmployeeSection);

          if (prevRecords) {
            previousRecords = prevRecords;
          }
        }
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const workDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (subjectsForSection.length > 0) {
          for (const subject of subjectsForSection) {
            let pointsValue = 0;
            let categoryValue = null;

            if (copyPreviousData && previousRecords.length > 0) {
              const prevRecord = previousRecords.find(r => {
                const prevDate = new Date(r.work_date + 'T12:00:00');
                return prevDate.getDate() === day && r.subject === subject;
              });
              if (prevRecord) {
                pointsValue = prevRecord.points || 0;
                categoryValue = prevRecord.category;
              }
            }

            recordsToInsert.push({
              upload_id: selectedUpload.id,
              sector_id: selectedSector,
              employee_id: employee.id,
              employee_name_original: employee.name,
              work_date: workDateStr,
              points: pointsValue,
              category: categoryValue,
              is_matched: true,
              section_type: addEmployeeSection,
              subject: subject
            });
          }
        } else {
          let pointsValue = 0;
          let categoryValue = null;

          if (copyPreviousData && previousRecords.length > 0) {
            const prevRecord = previousRecords.find(r => {
              const prevDate = new Date(r.work_date + 'T12:00:00');
              return prevDate.getDate() === day;
            });
            if (prevRecord) {
              pointsValue = prevRecord.points || 0;
              categoryValue = prevRecord.category;
            }
          }

          recordsToInsert.push({
            upload_id: selectedUpload.id,
            sector_id: selectedSector,
            employee_id: employee.id,
            employee_name_original: employee.name,
            work_date: workDateStr,
            points: pointsValue,
            category: categoryValue,
            is_matched: true,
            section_type: addEmployeeSection,
            subject: null
          });
        }
      }

      const { error } = await supabase
        .from('sector_productivity_records')
        .insert(recordsToInsert);

      if (error) throw error;

      await loadRecords(selectedUpload.id);
      setShowAddEmployeeModal(false);
      setAddEmployeeSection(null);
      setSelectedEmployeeToAdd('');
      setCopyPreviousData(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Erro ao adicionar colaborador');
    }
  };

  const handleRemoveEmployeeFromSection = async (sectionType: string, _employeeId: string | null, employeeName: string) => {
    if (!selectedUpload) return;

    const confirmed = confirm(`Deseja remover ${employeeName} desta secao?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('sector_productivity_records')
        .delete()
        .eq('upload_id', selectedUpload.id)
        .eq('section_type', sectionType)
        .eq('employee_name_original', employeeName);

      if (error) throw error;

      await loadRecords(selectedUpload.id);
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Erro ao remover colaborador');
    }
  };

  const toggleRowSelection = (employeeName: string, sectionType: string, subject?: string) => {
    const rowKey = subject
      ? `${sectionType}::${employeeName}__${subject}`
      : `${sectionType}::${employeeName}`;
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  };

  const toggleAllRowsInSection = (sectionType: string, groupedData: any[], hasSubject: boolean) => {
    const allRowKeys: string[] = [];

    groupedData.forEach(employee => {
      if (hasSubject) {
        employee.subjects.forEach((subjectData: any) => {
          const rowKey = subjectData.subject
            ? `${sectionType}::${employee.name}__${subjectData.subject}`
            : `${sectionType}::${employee.name}`;
          allRowKeys.push(rowKey);
        });
      } else {
        allRowKeys.push(`${sectionType}::${employee.name}`);
      }
    });

    const allSelected = allRowKeys.every(key => selectedRows.has(key));

    setSelectedRows(prev => {
      const newSet = new Set(prev);
      allRowKeys.forEach(key => {
        if (allSelected) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
      });
      return newSet;
    });
  };

  const handleApplyBulkCategory = async () => {
    if (!selectedUpload || !bulkCategory) {
      alert('Selecione uma categoria');
      return;
    }

    if (selectedRows.size === 0) {
      alert('Selecione ao menos uma linha');
      return;
    }

    if (!currentBulkSection) {
      alert('Erro: seção não identificada');
      return;
    }

    try {
      const selectedRowKeys = Array.from(selectedRows).filter(row => row.startsWith(`${currentBulkSection}::`));

      const selectedEmployeeSubjects = new Map<string, { employeeName: string; subject: string | null }>();

      selectedRowKeys.forEach(rowKey => {
        const parts = rowKey.replace(`${currentBulkSection}::`, '');
        const [employeeName, subject] = parts.includes('__') ? parts.split('__') : [parts, null];
        selectedEmployeeSubjects.set(rowKey, { employeeName, subject });
      });

      const refDate = new Date(selectedUpload.reference_month + 'T12:00:00');
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      const recordsToUpsert: any[] = [];

      for (const [_rowKey, { employeeName, subject }] of selectedEmployeeSubjects.entries()) {
        for (const day of allDays) {
          const workDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const existingRecord = records.find(r =>
            r.section_type === currentBulkSection &&
            r.employee_name_original === employeeName &&
            (r.subject || null) === (subject || null) &&
            r.work_date === workDate
          );

          if (existingRecord) {
            recordsToUpsert.push({
              id: existingRecord.id,
              category: bulkCategory,
              points: 0
            });
          } else {
            recordsToUpsert.push({
              upload_id: selectedUpload.id,
              section_type: currentBulkSection,
              employee_name_original: employeeName,
              subject: subject,
              work_date: workDate,
              category: bulkCategory,
              points: 0,
              is_matched: false,
              employee_id: null
            });
          }
        }
      }

      if (recordsToUpsert.length === 0) {
        alert('Nenhum registro para processar');
        return;
      }

      for (const record of recordsToUpsert) {
        if (record.id) {
          const { error } = await supabase
            .from('sector_productivity_records')
            .update({
              category: record.category,
              points: record.points
            })
            .eq('id', record.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('sector_productivity_records')
            .insert(record);

          if (error) throw error;
        }
      }

      await loadRecords(selectedUpload.id);
      setShowBulkCategoryModal(false);
      setBulkCategory('');
      setSelectedRows(new Set());
      setCurrentBulkSection('');

      alert(`${recordsToUpsert.length} registro(s) atualizado(s) com sucesso!`);
    } catch (error) {
      console.error('Error applying bulk category:', error);
      alert('Erro ao aplicar categoria em massa');
    }
  };

  const handleCreateManualPeriod = async () => {
    if (!selectedSector) {
      alert('Selecione um setor primeiro');
      return;
    }

    try {
      const year = manualPeriodData.year;
      const month = manualPeriodData.month;
      const referenceMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const { data: uploadData, error: uploadError } = await supabase
        .from('sector_productivity_uploads')
        .insert({
          sector_id: selectedSector,
          file_name: 'Entrada Manual',
          reference_month: referenceMonthStr,
          description: null,
          total_records: 0,
          matched_records: 0,
          unmatched_records: 0,
          status: 'completed',
          created_by: user?.id
        })
        .select()
        .single();

      if (uploadError) {
        console.error('Supabase error:', uploadError);
        alert(`Erro ao criar periodo manual: ${uploadError.message || 'Erro desconhecido'}`);
        return;
      }

      if (!uploadData || !uploadData.id) {
        console.error('Upload created but no data returned');
        alert('Erro ao criar periodo: dados nãoretornados');
        return;
      }

      console.log('Manual period created successfully with ID:', uploadData.id);

      await loadUploads();
      setSelectedUpload(uploadData);
      setShowManualPeriodModal(false);
      setIsEditingMode(false);
      setManualPeriodData({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        description: ''
      });

      const sectorName = sectors.find(s => s.id === selectedSector)?.description || 'setor selecionado';
      alert(`Periodo criado com sucesso para o setor "${sectorName}"! As secoes OPA e IXC estao disponiveis para adicionar colaboradores.`);
    } catch (error: any) {
      console.error('Error creating manual period:', error);
      alert(`Erro ao criar periodo manual: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const findPreviousMonthUpload = async () => {
    if (!selectedSector) return null;

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    const { data } = await supabase
      .from('sector_productivity_uploads')
      .select('*')
      .eq('sector_id', selectedSector)
      .like('reference_month', `${prevMonthStr}%`)
      .order('upload_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  };

  const openCloneModal = async () => {
    const prevUpload = await findPreviousMonthUpload();
    setPreviousMonthUpload(prevUpload);
    setCloneData({
      targetMonth: new Date().getMonth(),
      targetYear: new Date().getFullYear()
    });
    setShowCloneModal(true);
  };

  const handleCloneFromPreviousMonth = async () => {
    if (!selectedSector || !previousMonthUpload) {
      alert('Nenhum periodo anterior encontrado para clonar');
      return;
    }

    setIsCloning(true);

    try {
      const targetMonthStr = `${cloneData.targetYear}-${String(cloneData.targetMonth + 1).padStart(2, '0')}-01`;

      const { data: existingUpload } = await supabase
        .from('sector_productivity_uploads')
        .select('id')
        .eq('sector_id', selectedSector)
        .like('reference_month', `${cloneData.targetYear}-${String(cloneData.targetMonth + 1).padStart(2, '0')}%`)
        .maybeSingle();

      if (existingUpload) {
        alert('Ja existe um periodo para este mes. Exclua-o primeiro se quiser clonar novamente.');
        setIsCloning(false);
        return;
      }

      const { data: prevSections } = await supabase
        .from('productivity_sections')
        .select('*')
        .eq('upload_id', previousMonthUpload.id)
        .order('display_order');

      const { data: prevRecords } = await supabase
        .from('sector_productivity_records')
        .select('*')
        .eq('upload_id', previousMonthUpload.id);

      const { data: newUpload, error: uploadError } = await supabase
        .from('sector_productivity_uploads')
        .insert({
          sector_id: selectedSector,
          file_name: `Clonado de ${formatMonth(previousMonthUpload.reference_month)}`,
          reference_month: targetMonthStr,
          description: `Clonado do periodo ${formatMonth(previousMonthUpload.reference_month)}`,
          total_records: 0,
          matched_records: 0,
          unmatched_records: 0,
          status: 'completed',
          created_by: user?.id
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      const sectionKeyMap: Record<string, string> = {};

      if (prevSections && prevSections.length > 0) {
        for (const section of prevSections) {
          const newSectionKey = `${section.section_key}`;
          sectionKeyMap[section.section_key] = newSectionKey;

          await supabase
            .from('productivity_sections')
            .insert({
              upload_id: newUpload.id,
              title: section.title,
              section_key: newSectionKey,
              display_order: section.display_order,
              has_subject: section.has_subject,
              show_employee_total: section.show_employee_total,
              show_day_total: section.show_day_total,
              status: section.status
            });
        }
      }

      if (prevRecords && prevRecords.length > 0) {
        const uniqueEmployees = new Map<string, any>();

        for (const record of prevRecords) {
          const key = `${record.section_type}_${record.employee_name_original}_${record.subject || ''}`;
          if (!uniqueEmployees.has(key)) {
            uniqueEmployees.set(key, record);
          }
        }

        const recordsToInsert = Array.from(uniqueEmployees.values()).map(record => ({
          upload_id: newUpload.id,
          sector_id: selectedSector,
          employee_id: record.employee_id,
          employee_name_original: record.employee_name_original,
          work_date: targetMonthStr,
          points: 0,
          category: null,
          is_matched: record.is_matched,
          section_type: sectionKeyMap[record.section_type] || record.section_type,
          subject: record.subject
        }));

        if (recordsToInsert.length > 0) {
          const { error: recordsError } = await supabase
            .from('sector_productivity_records')
            .insert(recordsToInsert);

          if (recordsError) throw recordsError;
        }

        await supabase
          .from('sector_productivity_uploads')
          .update({
            total_records: recordsToInsert.length,
            matched_records: recordsToInsert.filter(r => r.is_matched).length,
            unmatched_records: recordsToInsert.filter(r => !r.is_matched).length
          })
          .eq('id', newUpload.id);
      }

      await loadUploads();
      setSelectedUpload(newUpload);
      await loadSections(newUpload.id);
      await loadRecords(newUpload.id);
      setShowCloneModal(false);
      setIsCloning(false);

      const sectorName = sectors.find(s => s.id === selectedSector)?.description || 'setor selecionado';
      alert(`Periodo clonado com sucesso para o setor "${sectorName}"! Todos os colaboradores e tabelas foram copiados com valores zerados.`);
    } catch (error: any) {
      console.error('Error cloning period:', error);
      alert(`Erro ao clonar periodo: ${error?.message || 'Erro desconhecido'}`);
      setIsCloning(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!selectedUpload) {
      alert('Nenhum período selecionado');
      return;
    }

    if (newEmployeeData.employeeIds.length === 0) {
      alert('Selecione pelo menos um colaborador');
      return;
    }

    const validTables = newEmployeeData.tables.filter(t => t.name.trim());
    if (validTables.length === 0) {
      alert('Adicione pelo menos uma tabela com nome');
      return;
    }

    if (!selectedSector) {
      alert('Nenhum setor selecionado');
      return;
    }

    if (!selectedUpload || !selectedUpload.id) {
      alert('Nenhum periodo selecionado. Crie ou selecione um periodo primeiro.');
      return;
    }

    try {
      const { data: uploadExists, error: checkError } = await supabase
        .from('sector_productivity_uploads')
        .select('id')
        .eq('id', selectedUpload.id)
        .maybeSingle();

      if (checkError || !uploadExists) {
        console.error('Upload verification error:', checkError);
        alert('Erro: O periodo selecionado nãoexiste. Por favor, recarregue a pagina e tente novamente.');
        await loadUploads();
        return;
      }

      const date = new Date(selectedUpload.reference_month + 'T12:00:00');
      const firstDayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

      const tablesToCreate = [];
      const recordsToInsert = [];

      for (let i = 0; i < validTables.length; i++) {
        const table = validTables[i];
        const sectionKey = `SECTION_${Date.now()}_${i}`;

        tablesToCreate.push({
          upload_id: selectedUpload.id,
          title: table.name.trim(),
          section_key: sectionKey,
          display_order: sections.length + i,
          has_subject: table.hasSubject,
          show_employee_total: table.showEmployeeTotal || false,
          show_day_total: table.showDayTotal || false,
          status: 0
        });

        for (const empId of newEmployeeData.employeeIds) {
          const selectedEmployee = employees.find(e => e.id === empId);
          if (!selectedEmployee) continue;

          if (table.hasSubject && table.subjects.filter(s => s.trim()).length > 0) {
            for (const subject of table.subjects.filter(s => s.trim())) {
              recordsToInsert.push({
                upload_id: selectedUpload.id,
                sector_id: selectedSector,
                employee_id: selectedEmployee.id,
                employee_name_original: selectedEmployee.name,
                work_date: firstDayStr,
                points: 0,
                category: null,
                is_matched: true,
                section_type: sectionKey,
                subject: subject.trim()
              });
            }
          } else {
            recordsToInsert.push({
              upload_id: selectedUpload.id,
              sector_id: selectedSector,
              employee_id: selectedEmployee.id,
              employee_name_original: selectedEmployee.name,
              work_date: firstDayStr,
              points: 0,
              category: null,
              is_matched: true,
              section_type: sectionKey,
              subject: null
            });
          }
        }
      }

      if (tablesToCreate.length > 0) {
        console.log('Creating sections for upload_id:', selectedUpload.id);
        console.log('Sections to create:', tablesToCreate);
        const { error: sectionError } = await supabase
          .from('productivity_sections')
          .insert(tablesToCreate);

        if (sectionError) {
          console.error('Section creation error:', sectionError);
          console.error('Failed upload_id:', selectedUpload.id);
          throw new Error(`Erro ao criar tabelas: ${sectionError.message}`);
        }
      }

      if (recordsToInsert.length > 0) {
        console.log('Creating records:', recordsToInsert.length, 'records');
        const { error } = await supabase
          .from('sector_productivity_records')
          .insert(recordsToInsert);

        if (error) {
          console.error('Record creation error:', error);
          throw new Error(`Erro ao criar registros: ${error.message}`);
        }
      }

      await loadSections(selectedUpload.id);
      await loadRecords(selectedUpload.id);
      setShowAddEmployeeModal(false);
      setNewEmployeeData({
        employeeIds: [],
        tables: [{
          name: '',
          hasSubject: false,
          showEmployeeTotal: false,
          showDayTotal: false,
          subjects: ['']
        }]
      });
      setSelectedSections([]);
      setIsEditingMode(false);

      alert(`${validTables.length} tabela(s) e ${recordsToInsert.length} registro(s) adicionado(s) com sucesso!`);
    } catch (error: any) {
      console.error('Error adding employees:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
      alert(`Erro ao adicionar colaboradores: ${errorMessage}`);
    }
  };

  const openAddEmployeeModal = (_sectionType?: string) => {
    setSelectedSections([]);
    setNewEmployeeData({
      employeeIds: [],
      tables: [{
        name: '',
        hasSubject: false,
        showEmployeeTotal: false,
        showDayTotal: false,
        subjects: ['']
      }]
    });
    setShowAddEmployeeModal(true);
  };

  const handleAddSubjects = async () => {
    if (!selectedUpload || !addSubjectData.employeeName || addSubjectData.subjects.filter(s => s.trim()).length === 0) {
      console.log('Add subject blocked:', {
        hasUpload: !!selectedUpload,
        employeeName: addSubjectData.employeeName,
        subjects: addSubjectData.subjects
      });
      return;
    }

    console.log('Starting add subjects...', addSubjectData);
    try {
      const date = new Date(selectedUpload.reference_month + 'T12:00:00');
      const firstDayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

      const recordsToInsert = [];
      const skippedSubjects = [];

      for (const subject of addSubjectData.subjects.filter(s => s.trim())) {
        const existingSubject = records.find(r =>
          r.employee_name_original === addSubjectData.employeeName &&
          r.section_type === addSubjectData.sectionType &&
          r.subject === subject.trim()
        );

        if (!existingSubject) {
          recordsToInsert.push({
            upload_id: selectedUpload.id,
            sector_id: selectedSector,
            employee_id: addSubjectData.employeeId || null,
            employee_name_original: addSubjectData.employeeName,
            work_date: firstDayStr,
            points: 0,
            category: null,
            is_matched: !!addSubjectData.employeeId,
            section_type: addSubjectData.sectionType,
            subject: subject.trim()
          });
        } else {
          skippedSubjects.push(subject.trim());
        }
      }

      if (recordsToInsert.length > 0) {
        console.log('Inserting subjects:', recordsToInsert);
        const { error, data } = await supabase
          .from('sector_productivity_records')
          .insert(recordsToInsert)
          .select();

        if (error) {
          console.error('Error inserting subjects:', error);
          throw error;
        }
        console.log('Subjects inserted successfully:', data);
      }

      await loadRecords(selectedUpload.id);
      setShowAddSubjectModal(false);
      setAddSubjectData({ employeeName: '', employeeId: '', sectionType: '', subjects: [''] });

      if (skippedSubjects.length > 0) {
        alert(`${recordsToInsert.length} assunto(s) adicionado(s). Alguns assuntos ja existiam.`);
      } else {
        alert(`${recordsToInsert.length} assunto(s) adicionado(s) com sucesso!`);
      }
    } catch (error: any) {
      console.error('Error adding subjects:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao adicionar assuntos: ${errorMessage}`);
    }
  };

  const handleEditSubject = async () => {
    if (!selectedUpload || !editSubjectData.employeeName || !editSubjectData.oldSubject || !editSubjectData.newSubject.trim()) return;

    try {
      const { error } = await supabase
        .from('sector_productivity_records')
        .update({ subject: editSubjectData.newSubject.trim() })
        .eq('upload_id', selectedUpload.id)
        .eq('employee_name_original', editSubjectData.employeeName)
        .eq('section_type', editSubjectData.sectionType)
        .eq('subject', editSubjectData.oldSubject);

      if (error) throw error;

      await loadRecords(selectedUpload.id);
      setShowEditSubjectModal(false);
      setEditSubjectData({ employeeName: '', sectionType: '', oldSubject: '', newSubject: '' });
    } catch (error) {
      console.error('Error editing subject:', error);
      alert('Erro ao editar assunto');
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedUpload || !deleteSubjectData.employeeName || !deleteSubjectData.subject) return;

    try {
      const { error } = await supabase
        .from('sector_productivity_records')
        .delete()
        .eq('upload_id', selectedUpload.id)
        .eq('employee_name_original', deleteSubjectData.employeeName)
        .eq('section_type', deleteSubjectData.sectionType)
        .eq('subject', deleteSubjectData.subject);

      if (error) throw error;

      await loadRecords(selectedUpload.id);
      setShowDeleteSubjectModal(false);
      setDeleteSubjectData({ employeeName: '', sectionType: '', subject: '' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Erro ao excluir assunto');
    }
  };

  const getFilteredEmployees = () => {
    return employees;
  };


  const getDaysInMonth = () => {
    if (!selectedUpload) return [];
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getDayOfWeek = (day: number): string => {
    if (!selectedUpload) return '';
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const targetDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dayNames[targetDate.getDay()];
  };

  const isWeekend = (day: number): boolean => {
    if (!selectedUpload) return false;
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const targetDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  };

  const isHoliday = (day: number): boolean => {
    if (!selectedUpload) return false;
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const targetDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dateString = targetDate.toISOString().split('T')[0];
    return holidays.has(dateString);
  };

  const getDayClassName = (day: number): string => {
    if (isHoliday(day)) return 'bg-red-50';
    if (isWeekend(day)) return 'bg-blue-50';
    return '';
  };

  const getDayHeaderClassName = (day: number): string => {
    if (isHoliday(day)) return 'bg-red-100 text-red-700';
    if (isWeekend(day)) return 'bg-blue-100 text-blue-700';
    return '';
  };

  const roundToOneDecimal = (num: number): number => {
    return Math.round(num * 10) / 10;
  };

  const getDayTotals = (sectionType: string): Record<number, number> => {
    const groupedData = groupRecordsByEmployee(sectionType);
    const totals: Record<number, number> = {};

    getDaysInMonth().forEach(day => {
      let dayTotal = 0;
      groupedData.forEach(employee => {
        employee.subjects.forEach(subjectData => {
          const employeeKey = subjectData.subject
            ? `${employee.name}__${subjectData.subject}`
            : employee.name;
          const editedValue = editedRecords[sectionType]?.[employeeKey]?.[day];
          const originalValue = subjectData.dailyPoints[day];
          const displayValue = editedValue !== undefined ? editedValue : originalValue;

          if (typeof displayValue === 'number') {
            dayTotal += displayValue;
          }
        });
      });
      totals[day] = roundToOneDecimal(dayTotal);
    });

    return totals;
  };

  const getSubjectDayTotals = (sectionType: string, subjectFilter: string): Record<number, number> => {
    if (!selectedUpload) return {};

    const groupedData = groupRecordsByEmployee(sectionType);
    const totals: Record<number, number> = {};

    getDaysInMonth().forEach(day => {
      let dayTotal = 0;
      groupedData.forEach(employee => {
        employee.subjects.forEach(subjectData => {
          const subjectLower = (subjectData.subject || '').toLowerCase();
          if (subjectLower.includes(subjectFilter.toLowerCase())) {
            const employeeKey = subjectData.subject
              ? `${employee.name}__${subjectData.subject}`
              : employee.name;
            const editedValue = editedRecords[sectionType]?.[employeeKey]?.[day];
            const originalValue = subjectData.dailyPoints[day];
            const displayValue = editedValue !== undefined ? editedValue : originalValue;

            if (typeof displayValue === 'number') {
              dayTotal += displayValue;
            }
          }
        });
      });
      totals[day] = roundToOneDecimal(dayTotal);
    });

    return totals;
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 90 && percentage <= 100) return 'bg-green-500 text-white';
    if (percentage >= 75 && percentage < 90) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getSectionRecordCount = (sectionType: string) => {
    return records.filter(r => r.section_type === sectionType).length;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Produtividade por Departamento/Setor</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Departamento/Setor
              </label>
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setSelectedUpload(null);
                  setRecords([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {sectors.map(sector => (
                  <option key={sector.id} value={sector.id}>
                    {sector.description}
                  </option>
                ))}
              </select>
            </div>

            {selectedSector && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setManualPeriodData({
                      month: new Date().getMonth(),
                      year: new Date().getFullYear(),
                      description: ''
                    });
                    setShowManualPeriodModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Novo Periodo Manual</span>
                </button>
                <button
                  onClick={openCloneModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  <span>Clonar Mes Anterior</span>
                </button>
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700">
              {uploadProgress}
            </div>
          )}
        </div>

        {selectedSector && uploads.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Importacoes Realizadas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes/Ano</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Import</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploads.map(upload => (
                    <tr
                      key={upload.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedUpload?.id === upload.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedUpload(upload)}
                    >
                      <td className="px-4 py-3 text-sm capitalize">{formatMonth(upload.reference_month)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                            {upload.sector?.description || 'N/A'}
                          </span>
                          {upload.description && (
                            <span className="text-xs text-gray-500 italic">
                              {upload.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTimeBRT(upload.upload_date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUpload(upload.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedUpload && records.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Produtividade - {formatMonth(selectedUpload.reference_month)}</h2>
                  {isEditingMode && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                      Modo de Edicao
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isEditingMode ? (
                    <>
                      <button
                        onClick={() => {
                          setSectionFormData({ title: '', section_key: '', has_subject: false, show_employee_total: false, show_day_total: false, display_order: sections.length + 1 });
                          setEditingSection(null);
                          setShowSectionModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Gerenciar tabelas"
                      >
                        <Grid3x3 className="w-4 h-4" />
                        Gerenciar Tabelas
                      </button>
                      <button
                        onClick={() => openAddEmployeeModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Adicionar
                      </button>
                      <button
                        onClick={() => setIsEditingMode(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => selectedUpload && handleDeleteUpload(selectedUpload.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          hasChanges && !isSaving
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isEditingMode && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Modo de edicao ativo para ambas as tabelas. Digite valores nas celulas para editar. Use numeros para pontos ou texto para categorias (FO, FE, AT).
                </div>
              )}
            </div>

            {getSectionTypes().map((sectionType, sectionIndex) => {
              const groupedData = groupRecordsByEmployee(sectionType);
              const hasSubject = getSectionHasSubject(sectionType);
              const originalShowEmployeeTotal = getSectionShowEmployeeTotal(sectionType);
              const originalShowDayTotal = getSectionShowDayTotal(sectionType);
              const showEmployeeTotal = editedSectionOptions[sectionType]?.show_employee_total !== undefined
                ? editedSectionOptions[sectionType].show_employee_total
                : originalShowEmployeeTotal;
              const showDayTotal = editedSectionOptions[sectionType]?.show_day_total !== undefined
                ? editedSectionOptions[sectionType].show_day_total
                : originalShowDayTotal;

              const sectionColors = [
                { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-800' },
                { border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-800' },
                { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-800' },
                { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-800' },
                { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-800' },
                { border: 'border-l-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
                { border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-800' },
                { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
                { border: 'border-l-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800' },
                { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-800' },
              ];

              const colorScheme = sectionColors[sectionIndex % sectionColors.length];

              return (
                <div key={sectionType} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className={`flex justify-between items-center p-4 border-b border-l-4 ${colorScheme.border} ${colorScheme.bg}`}>
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-semibold ${colorScheme.text}`}>
                        {getSectionTitle(sectionType)}
                      </h3>
                      <span className="text-sm text-gray-600">
                        ({getSectionRecordCount(sectionType)} registros)
                      </span>
                    </div>
                    {isEditingMode && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            setAddEmployeeSection(sectionType);
                            setShowAddEmployeeModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Adicionar Colaborador</span>
                        </button>
                        {selectedRows.size > 0 && Array.from(selectedRows).some(row => row.startsWith(`${sectionType}::`)) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setCurrentBulkSection(sectionType);
                                setShowBulkCategoryModal(true);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Tag className="w-4 h-4" />
                              <span>Aplicar Categoria ({Array.from(selectedRows).filter(row => row.startsWith(`${sectionType}::`)).length} linhas)</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRows(new Set());
                              }}
                              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                              title="Limpar seleções"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={showDayTotal}
                            onChange={(e) => handleToggleSectionOption(sectionType, 'show_day_total', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span>Mostrar Produtividade</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={showEmployeeTotal}
                            onChange={(e) => handleToggleSectionOption(sectionType, 'show_employee_total', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span>Mostrar Total Colaborador</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                      <div
                        className="overflow-x-auto mb-1 pb-2"
                        style={{
                          overflowY: 'hidden',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                        ref={(el) => setScrollRef(sectionType, 'top', el)}
                        onScroll={() => syncScroll(sectionType, 'top')}
                      >
                        <div style={{ width: `${getDaysInMonth().length * 60 + (isEditingMode ? 50 : 40) + (hasSubject ? 296 : 40) + 120}px`, height: '1px' }}></div>
                      </div>

                      <div
                        className="overflow-x-auto"
                        ref={(el) => setScrollRef(sectionType, 'bottom', el)}
                        onScroll={() => syncScroll(sectionType, 'bottom')}
                      >
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {isEditingMode && (
                                <th className="px-2 py-2 text-center sticky left-0 bg-gray-50 min-w-10 z-10">
                                  <input
                                    type="checkbox"
                                    onChange={() => toggleAllRowsInSection(sectionType, groupedData, hasSubject)}
                                    checked={(() => {
                                      if (hasSubject) {
                                        const allKeys: string[] = [];
                                        groupedData.forEach(e => {
                                          e.subjects.forEach((s: any) => {
                                            const key = s.subject
                                              ? `${sectionType}::${e.name}__${s.subject}`
                                              : `${sectionType}::${e.name}`;
                                            allKeys.push(key);
                                          });
                                        });
                                        return allKeys.every(key => selectedRows.has(key));
                                      }
                                      return groupedData.every(e => selectedRows.has(`${sectionType}::${e.name}`));
                                    })()}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    title="Selecionar todas as linhas"
                                  />
                                </th>
                              )}
                              <th className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 min-w-40 z-10 ${isEditingMode ? 'sticky left-10' : 'sticky left-0'}`}>
                                Colaborador
                              </th>
                              {hasSubject && (
                                <th className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 min-w-64 z-10 border-l border-gray-300 ${isEditingMode ? 'sticky left-50' : 'sticky left-40'}`}>
                                  Assunto
                                </th>
                              )}
                              {getDaysInMonth().map(day => (
                                <th key={day} className={`px-1 py-2 text-center text-xs font-medium min-w-20 ${getDayHeaderClassName(day) || 'text-gray-500'}`}>
                                  <div className="flex flex-col items-center">
                                    <span className="font-bold">{day}</span>
                                    <span className="text-[10px] font-normal capitalize">{getDayOfWeek(day).substring(0, 3)}</span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-16">
                                {hasSubject ? 'Total por Assunto' : 'Total'}
                              </th>
                              {showEmployeeTotal && (
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-100 min-w-20 border-l-2 border-blue-300">
                                  Total Colaborador
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {groupedData.map((employee, empIdx) => {
                              const employeePlanned: Record<number, number> = {};
                              const employeeRealized: Record<number, number> = {};
                              const employeeProductivity: Record<number, { percentage: number; hasData: boolean }> = {};
                              let totalPlanned = 0;
                              let totalRealized = 0;

                              getDaysInMonth().forEach(day => {
                                let dayPlanned = 0;
                                let dayRealized = 0;
                                employee.subjects.forEach(subjectData => {
                                  const employeeKey = subjectData.subject
                                    ? `${employee.name}__${subjectData.subject}`
                                    : employee.name;
                                  const editedValue = editedRecords[sectionType]?.[employeeKey]?.[day];
                                  const displayValue = editedValue !== undefined ? editedValue : subjectData.dailyPoints[day];
                                  if (typeof displayValue === 'number') {
                                    const subjectLower = (subjectData.subject || '').toLowerCase();
                                    if (subjectLower.includes('planejado')) {
                                      dayPlanned += displayValue;
                                    } else if (subjectLower.includes('realizado')) {
                                      dayRealized += displayValue;
                                    }
                                  }
                                });
                                employeePlanned[day] = roundToOneDecimal(dayPlanned);
                                employeeRealized[day] = roundToOneDecimal(dayRealized);
                                totalPlanned += dayPlanned;
                                totalRealized += dayRealized;

                                const percentage = dayPlanned > 0 ? (dayRealized / dayPlanned) * 100 : 0;
                                employeeProductivity[day] = {
                                  percentage: Math.round(percentage),
                                  hasData: dayPlanned > 0 || dayRealized > 0
                                };
                              });

                              const employeeGrandTotal = totalPlanned > 0
                                ? Math.round((totalRealized / totalPlanned) * 100)
                                : 0;
                              const hasAnyPlanned = totalPlanned > 0;

                              return (
                                <>
                                  {employee.subjects.map((subjectData, subIdx) => {
                                    const employeeKey = subjectData.subject
                                      ? `${employee.name}__${subjectData.subject}`
                                      : employee.name;
                                    const isFirstRow = subIdx === 0;
                                    const isLastRow = subIdx === employee.subjects.length - 1;

                                    return (
                                      <tr key={`${empIdx}-${subIdx}`} className={`hover:bg-gray-50 ${!employee.matched ? 'bg-red-50' : ''}`}>
                                        {isEditingMode && (
                                          hasSubject ? (
                                            <td
                                              className={`px-2 py-2 text-center sticky left-0 z-10 ${
                                                !employee.matched ? 'bg-red-50' : 'bg-white'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                onChange={() => toggleRowSelection(employee.name, sectionType, subjectData.subject || undefined)}
                                                checked={selectedRows.has(`${sectionType}::${employeeKey}`)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                title={`Selecionar ${subjectData.subject || employee.name}`}
                                              />
                                            </td>
                                          ) : isFirstRow && (
                                            <td
                                              rowSpan={employee.subjects.length}
                                              className={`px-2 py-2 text-center sticky left-0 z-10 align-top ${
                                                !employee.matched ? 'bg-red-50' : 'bg-white'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                onChange={() => toggleRowSelection(employee.name, sectionType)}
                                                checked={selectedRows.has(`${sectionType}::${employee.name}`)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                title={`Selecionar linha ${employee.name}`}
                                              />
                                            </td>
                                          )
                                        )}
                                        {isFirstRow && (
                                          <td
                                            rowSpan={employee.subjects.length}
                                            className={`px-2 py-2 whitespace-nowrap z-10 align-top border-r border-gray-300 ${
                                              isEditingMode ? 'sticky left-10' : 'sticky left-0'
                                            } ${!employee.matched ? 'bg-red-50' : 'bg-white'}`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                {!employee.matched && (
                                                  <span title="Colaborador nãovinculado">
                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                  </span>
                                                )}
                                                <span className={`font-medium ${employee.matched ? '' : 'text-red-600'}`}>
                                                  {(() => {
                                                    const nameParts = employee.name.split(' ').filter(p => p.trim());
                                                    if (nameParts.length === 1) return employee.name;
                                                    const firstName = nameParts[0];
                                                    const lastName = nameParts[nameParts.length - 1];
                                                    return `${firstName} ${lastName}`;
                                                  })()}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                {isEditingMode && (
                                                  <button
                                                    onClick={() => handleRemoveEmployeeFromSection(sectionType, employee.employeeId, employee.name)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Remover colaborador"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                )}
                                                {hasSubject && (
                                                  <button
                                                    onClick={() => {
                                                      setAddSubjectData({
                                                        employeeName: employee.name,
                                                        employeeId: employee.employeeId || '',
                                                        sectionType: sectionType,
                                                        subjects: ['']
                                                      });
                                                      setShowAddSubjectModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Adicionar assunto"
                                                  >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                              )}
                                              </div>
                                            </div>
                                          </td>
                                        )}
                                        {hasSubject && (
                                          <td className={`px-2 py-2 sticky left-40 z-10 bg-white text-sm ${isLastRow ? '' : ''} border-l border-gray-300`}>
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-gray-700">{subjectData.subject || '(Sem assunto)'}</span>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => {
                                                    setEditSubjectData({
                                                      employeeName: employee.name,
                                                      sectionType: sectionType,
                                                      oldSubject: subjectData.subject || '',
                                                      newSubject: subjectData.subject || ''
                                                    });
                                                    setShowEditSubjectModal(true);
                                                  }}
                                                  className="text-blue-600 hover:text-blue-800 p-1"
                                                  title="Editar assunto"
                                                >
                                                  <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setDeleteSubjectData({
                                                      employeeName: employee.name,
                                                      sectionType: sectionType,
                                                      subject: subjectData.subject || ''
                                                    });
                                                    setShowDeleteSubjectModal(true);
                                                  }}
                                                  className="text-red-600 hover:text-red-800 p-1"
                                                  title="Excluir assunto"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        )}
                                        {getDaysInMonth().map(day => {
                                          const originalValue = subjectData.dailyPoints[day];
                                          const editedValue = editedRecords[sectionType]?.[employeeKey]?.[day];
                                          const displayValue = editedValue !== undefined ? editedValue : originalValue;
                                          const isText = typeof displayValue === 'string' && displayValue !== '';
                                          const isEdited = editedValue !== undefined;
                                          return (
                                            <td
                                              key={day}
                                              className={`px-1 py-1 text-center text-xs ${
                                                isText ? 'bg-yellow-100 text-yellow-800 font-medium' : ''
                                              } ${isEdited ? 'bg-green-100' : ''} ${!isText && !isEdited ? getDayClassName(day) : ''}`}
                                            >
                                              {isEditingMode ? (
                                                <input
                                                  type="text"
                                                  value={displayValue ?? ''}
                                                  onChange={(e) => handlePointChange(sectionType, employeeKey, day, e.target.value)}
                                                  onBlur={(e) => handlePointBlur(sectionType, employeeKey, day, e.target.value)}
                                                  onKeyDown={(e) => handleKeyNavigation(e, sectionType, employeeKey, day)}
                                                  data-section={sectionType}
                                                  data-employee={employeeKey}
                                                  data-day={day}
                                                  className={`w-10 h-6 text-center text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                    isEdited ? 'bg-green-50 border-green-400' : 'border-gray-300'
                                                  }`}
                                                />
                                              ) : (
                                                displayValue === 0 || (displayValue !== undefined && displayValue !== null && displayValue !== '') ? displayValue : '-'
                                              )}
                                            </td>
                                          );
                                        })}
                                        <td className={`px-2 py-2 text-center font-medium bg-gray-100`}>
                                          {subjectData.total}
                                        </td>
                                        {showEmployeeTotal && isFirstRow && (
                                          <td
                                            rowSpan={employee.subjects.length}
                                            className="px-2 py-2 text-center font-bold text-blue-900 bg-blue-50 border-l-2 border-blue-300 align-middle"
                                          >
                                            {employeeGrandTotal}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                  {showDayTotal && (
                                    <tr className="bg-gray-100 border-t border-b-2 border-gray-400 font-semibold">
                                      <td className="px-2 py-2 text-right text-xs sticky left-0 bg-gray-100 z-10 border-r border-gray-300" colSpan={hasSubject ? 1 : 1}>
                                        Produtividade
                                      </td>
                                      {hasSubject && (
                                        <td className="px-2 py-2 sticky left-40 bg-gray-100 z-10 border-l border-gray-300"></td>
                                      )}
                                      {getDaysInMonth().map(day => {
                                        const prod = employeeProductivity[day];
                                        const colorClass = prod?.hasData && employeePlanned[day] > 0
                                          ? getPercentageColor(prod.percentage)
                                          : '';
                                        return (
                                          <td key={day} className={`px-1 py-2 text-center text-xs font-bold ${colorClass || getDayClassName(day)}`}>
                                            {prod?.hasData && employeePlanned[day] > 0
                                              ? `${prod.percentage}%`
                                              : (prod?.hasData ? employeeRealized[day] : '-')}
                                          </td>
                                        );
                                      })}
                                      <td className={`px-2 py-2 text-center text-xs font-bold ${hasAnyPlanned ? getPercentageColor(employeeGrandTotal) : 'bg-gray-200'}`}>
                                        {hasAnyPlanned ? `${employeeGrandTotal}%` : '-'}
                                      </td>
                                      {showEmployeeTotal && (
                                        <td className={`px-2 py-2 text-center text-xs font-bold border-l-2 border-blue-300 ${hasAnyPlanned ? getPercentageColor(employeeGrandTotal) : 'bg-blue-100 text-blue-900'}`}>
                                          {hasAnyPlanned ? `${employeeGrandTotal}%` : '-'}
                                        </td>
                                      )}
                                    </tr>
                                  )}
                                </>
                              );
                            })}
                            <tr className="h-3">
                              <td colSpan={100} className="bg-white border-0"></td>
                            </tr>
                            <tr className="bg-blue-700 text-white font-bold">
                              <td className="px-2 py-3 text-left text-sm sticky left-0 bg-blue-700 z-10 rounded-l">
                                Total da Produção
                              </td>
                              {hasSubject && (
                                <td className="px-2 py-3 text-left text-sm sticky left-40 bg-blue-700 z-10">
                                </td>
                              )}
                              {(() => {
                                const realizedTotals = getSubjectDayTotals(sectionType, 'realizado');
                                const plannedTotals = getSubjectDayTotals(sectionType, 'planejado');
                                return getDaysInMonth().map(day => {
                                  const realized = realizedTotals[day] || 0;
                                  const planned = plannedTotals[day] || 0;
                                  const percentage = planned > 0 ? (realized / planned) * 100 : 0;
                                  const hasData = planned > 0 || realized > 0;
                                  const colorClass = planned > 0 ? getPercentageColor(percentage) : '';

                                  return (
                                    <td key={day} className={`px-1 py-3 text-center text-sm font-bold ${colorClass || getDayClassName(day)}`}>
                                      {planned > 0 ? `${Math.round(percentage)}%` : (hasData ? realized : '-')}
                                    </td>
                                  );
                                });
                              })()}
                              <td className="px-2 py-3 text-center text-sm bg-blue-700">
                                {(() => {
                                  const realizedTotals = getSubjectDayTotals(sectionType, 'realizado');
                                  const plannedTotals = getSubjectDayTotals(sectionType, 'planejado');
                                  const totalRealized = roundToOneDecimal(Object.values(realizedTotals).reduce((sum, val) => sum + val, 0));
                                  const totalPlanned = roundToOneDecimal(Object.values(plannedTotals).reduce((sum, val) => sum + val, 0));
                                  const totalPercentage = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0;
                                  const colorClass = totalPlanned > 0 ? getPercentageColor(totalPercentage) : '';
                                  return (
                                    <span className={`px-2 py-1 rounded ${colorClass}`}>
                                      {totalPlanned > 0 ? `${Math.round(totalPercentage)}%` : totalRealized}
                                    </span>
                                  );
                                })()}
                              </td>
                              {showEmployeeTotal && (
                                <td className="px-2 py-3 text-center text-sm font-bold bg-blue-800 rounded-r">
                                  {(() => {
                                    const realizedTotals = getSubjectDayTotals(sectionType, 'realizado');
                                    const plannedTotals = getSubjectDayTotals(sectionType, 'planejado');
                                    const totalRealized = roundToOneDecimal(Object.values(realizedTotals).reduce((sum, val) => sum + val, 0));
                                    const totalPlanned = roundToOneDecimal(Object.values(plannedTotals).reduce((sum, val) => sum + val, 0));
                                    const totalPercentage = totalPlanned > 0 ? (totalRealized / totalPlanned) * 100 : 0;
                                    const colorClass = totalPlanned > 0 ? getPercentageColor(totalPercentage) : '';
                                    return (
                                      <span className={`px-2 py-1 rounded ${colorClass}`}>
                                        {totalPlanned > 0 ? `${Math.round(totalPercentage)}%` : totalRealized}
                                      </span>
                                    );
                                  })()}
                                </td>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedUpload && records.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum registro encontrado para este periodo</p>
            <p className="text-gray-400 mt-2 mb-4">Adicione colaboradores manualmente para comecar</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => openAddEmployeeModal('BOTH')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-5 h-5" />
                Adicionar Colaboradores
              </button>
            </div>
          </div>
        )}

        {selectedSector && uploads.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma importacao encontrada para este departamento/setor</p>
            <p className="text-gray-400 mt-2">Clique em "Novo Periodo Manual" ou "Clonar Mes Anterior" para comecar</p>
          </div>
        )}
      </div>

      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Colaboradores Nao Encontrados
              </h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Os seguintes colaboradores do arquivo nãoforam encontrados no sistema.
                Os registros foram importados mas nãoestao vinculados.
              </p>
              <ul className="space-y-2">
                {importErrors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{error.employeeName}</strong>: {error.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Novo Periodo Manual
              </h3>
              <button
                onClick={() => {
                  setShowManualPeriodModal(false);
                  setManualPeriodData({
                    month: new Date().getMonth(),
                    year: new Date().getFullYear(),
                    description: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes
                  </label>
                  <select
                    value={manualPeriodData.month}
                    onChange={(e) => setManualPeriodData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Janeiro</option>
                    <option value={1}>Fevereiro</option>
                    <option value={2}>Marco</option>
                    <option value={3}>Abril</option>
                    <option value={4}>Maio</option>
                    <option value={5}>Junho</option>
                    <option value={6}>Julho</option>
                    <option value={7}>Agosto</option>
                    <option value={8}>Setembro</option>
                    <option value={9}>Outubro</option>
                    <option value={10}>Novembro</option>
                    <option value={11}>Dezembro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <select
                    value={manualPeriodData.year}
                    onChange={(e) => setManualPeriodData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[2024, 2025, 2026, 2027].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowManualPeriodModal(false);
                  setManualPeriodData({
                    month: new Date().getMonth(),
                    year: new Date().getFullYear(),
                    description: ''
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateManualPeriod}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar Periodo
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-600" />
                Clonar Mes Anterior
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {previousMonthUpload ? (
                <>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Periodo encontrado para clonar:</p>
                    <p className="text-green-700 mt-1">{formatMonth(previousMonthUpload.reference_month)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {previousMonthUpload.total_records} registros serao clonados com valores zerados
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mes de Destino
                      </label>
                      <select
                        value={cloneData.targetMonth}
                        onChange={(e) => setCloneData(prev => ({ ...prev, targetMonth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value={0}>Janeiro</option>
                        <option value={1}>Fevereiro</option>
                        <option value={2}>Marco</option>
                        <option value={3}>Abril</option>
                        <option value={4}>Maio</option>
                        <option value={5}>Junho</option>
                        <option value={6}>Julho</option>
                        <option value={7}>Agosto</option>
                        <option value={8}>Setembro</option>
                        <option value={9}>Outubro</option>
                        <option value={10}>Novembro</option>
                        <option value={11}>Dezembro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ano de Destino
                      </label>
                      <select
                        value={cloneData.targetYear}
                        onChange={(e) => setCloneData(prev => ({ ...prev, targetYear: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        {[2024, 2025, 2026, 2027].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Os colaboradores, tabelas e assuntos serao copiados. Todos os valores serao zerados.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum periodo anterior encontrado para este setor.</p>
                  <p className="text-sm text-gray-500 mt-1">Crie um periodo manual primeiro.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowCloneModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              {previousMonthUpload && (
                <button
                  onClick={handleCloneFromPreviousMonth}
                  disabled={isCloning}
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    isCloning
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isCloning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Clonando...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Clonar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Adicionar Colaboradores
              </h3>
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setSelectedSections([]);
                  setNewEmployeeData({
                    employeeIds: [],
                    tables: [{
                      name: '',
                      hasSubject: false,
                      showEmployeeTotal: false,
                      showDayTotal: false,
                      subjects: ['']
                    }]
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Colaboradores * ({newEmployeeData.employeeIds.length} selecionados)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const filtered = getFilteredEmployees();
                        setNewEmployeeData(prev => ({
                          ...prev,
                          employeeIds: filtered.map(e => e.id)
                        }));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => setNewEmployeeData(prev => ({ ...prev, employeeIds: [] }))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                  {getFilteredEmployees().length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum colaborador encontrado neste setor
                    </p>
                  ) : (
                    getFilteredEmployees().map(emp => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newEmployeeData.employeeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEmployeeData(prev => ({
                                ...prev,
                                employeeIds: [...prev.employeeIds, emp.id]
                              }));
                            } else {
                              setNewEmployeeData(prev => ({
                                ...prev,
                                employeeIds: prev.employeeIds.filter(id => id !== emp.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{emp.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tabelas * ({newEmployeeData.tables.filter(t => t.name.trim()).length} configuradas)
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {newEmployeeData.tables.map((table, tableIndex) => (
                    <div key={tableIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={table.name}
                            onChange={(e) => {
                              const newTables = [...newEmployeeData.tables];
                              newTables[tableIndex].name = e.target.value;
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            placeholder="Nome da tabela (ex: Financeiro, RH...)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {newEmployeeData.tables.length > 1 && (
                          <button
                            onClick={() => {
                              const newTables = newEmployeeData.tables.filter((_, i) => i !== tableIndex);
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="mb-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={table.hasSubject}
                            onChange={(e) => {
                              const newTables = [...newEmployeeData.tables];
                              newTables[tableIndex].hasSubject = e.target.checked;
                              if (!e.target.checked) {
                                newTables[tableIndex].subjects = [''];
                              }
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Tabela com assuntos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={table.showEmployeeTotal || false}
                            onChange={(e) => {
                              const newTables = [...newEmployeeData.tables];
                              newTables[tableIndex].showEmployeeTotal = e.target.checked;
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Mostrar total do colaborador</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={table.showDayTotal || false}
                            onChange={(e) => {
                              const newTables = [...newEmployeeData.tables];
                              newTables[tableIndex].showDayTotal = e.target.checked;
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Mostrar total dia</span>
                        </label>
                      </div>
                      {table.hasSubject && (
                        <div className="space-y-2 mt-2 pl-6 border-l-2 border-blue-300">
                          <label className="text-xs font-medium text-gray-600">
                            Assuntos (serão aplicados a todos os colaboradores)
                          </label>
                          {table.subjects.map((subject, subjectIndex) => (
                            <div key={subjectIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={subject}
                                onChange={(e) => {
                                  const newTables = [...newEmployeeData.tables];
                                  newTables[tableIndex].subjects[subjectIndex] = e.target.value;
                                  setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                                }}
                                placeholder="Ex: Folha de Pagamento, Recrutamento..."
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                              {table.subjects.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newTables = [...newEmployeeData.tables];
                                    newTables[tableIndex].subjects = newTables[tableIndex].subjects.filter((_, i) => i !== subjectIndex);
                                    setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                                  }}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newTables = [...newEmployeeData.tables];
                              newTables[tableIndex].subjects.push('');
                              setNewEmployeeData(prev => ({ ...prev, tables: newTables }));
                            }}
                            className="w-full px-2 py-1 text-xs border border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-400 hover:text-blue-600"
                          >
                            + Adicionar outro assunto
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setNewEmployeeData(prev => ({
                        ...prev,
                        tables: [...prev.tables, { name: '', hasSubject: false, showEmployeeTotal: false, showDayTotal: false, subjects: [''] }]
                      }));
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar outra tabela
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setSelectedSections([]);
                  setNewEmployeeData({
                    employeeIds: [],
                    tables: [{
                      name: '',
                      hasSubject: false,
                      showEmployeeTotal: false,
                      showDayTotal: false,
                      subjects: ['']
                    }]
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={newEmployeeData.employeeIds.length === 0 || newEmployeeData.tables.filter(t => t.name.trim()).length === 0}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  newEmployeeData.employeeIds.length > 0 && newEmployeeData.tables.filter(t => t.name.trim()).length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Adicionar {newEmployeeData.employeeIds.length > 0 && newEmployeeData.tables.filter(t => t.name.trim()).length > 0 ? `(${newEmployeeData.employeeIds.length} em ${newEmployeeData.tables.filter(t => t.name.trim()).length} tabelas)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEmployeeModal && addEmployeeSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Adicionar Colaborador - {getSectionTitle(addEmployeeSection)}
              </h3>
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setAddEmployeeSection(null);
                  setSelectedEmployeeToAdd('');
                  setCopyPreviousData(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o colaborador
                </label>
                <select
                  value={selectedEmployeeToAdd}
                  onChange={(e) => setSelectedEmployeeToAdd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {employees
                    .filter(emp => {
                      const existingRecords = records.filter(
                        r => r.section_type === addEmployeeSection && r.employee_id === emp.id
                      );
                      return existingRecords.length === 0;
                    })
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Apenas colaboradores que ainda nãoestao nesta secao aparecem na lista
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="copyPreviousData"
                  checked={copyPreviousData}
                  onChange={(e) => setCopyPreviousData(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="copyPreviousData" className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium text-blue-900">
                    Copiar atendimentos do periodo anterior
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Trara todos os valores cadastrados do colaborador no mes anterior para este periodo
                  </div>
                </label>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setAddEmployeeSection(null);
                  setSelectedEmployeeToAdd('');
                  setCopyPreviousData(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmployeeToSection}
                disabled={!selectedEmployeeToAdd}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  selectedEmployeeToAdd
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Adicionar Assuntos - {addSubjectData.employeeName}
              </h3>
              <button
                onClick={() => {
                  setShowAddSubjectModal(false);
                  setAddSubjectData({ employeeName: '', employeeId: '', sectionType: '', subjects: [''] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assuntos (um por linha)
                </label>
                <div className="space-y-2">
                  {addSubjectData.subjects.map((subject, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => {
                          const newSubjects = [...addSubjectData.subjects];
                          newSubjects[index] = e.target.value;
                          setAddSubjectData(prev => ({ ...prev, subjects: newSubjects }));
                        }}
                        placeholder="Ex: Folha de Pagamento, Processos seletivos..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {addSubjectData.subjects.length > 1 && (
                        <button
                          onClick={() => {
                            const newSubjects = addSubjectData.subjects.filter((_, i) => i !== index);
                            setAddSubjectData(prev => ({ ...prev, subjects: newSubjects }));
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setAddSubjectData(prev => ({ ...prev, subjects: [...prev.subjects, ''] }));
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar outro assunto
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowAddSubjectModal(false);
                  setAddSubjectData({ employeeName: '', employeeId: '', sectionType: '', subjects: [''] });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSubjects}
                disabled={addSubjectData.subjects.filter(s => s.trim()).length === 0}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  addSubjectData.subjects.filter(s => s.trim()).length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Adicionar ({addSubjectData.subjects.filter(s => s.trim()).length} assuntos)
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Editar Assunto - {editSubjectData.employeeName}
              </h3>
              <button
                onClick={() => {
                  setShowEditSubjectModal(false);
                  setEditSubjectData({ employeeName: '', sectionType: '', oldSubject: '', newSubject: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto Atual
                </label>
                <input
                  type="text"
                  value={editSubjectData.oldSubject}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Assunto
                </label>
                <input
                  type="text"
                  value={editSubjectData.newSubject}
                  onChange={(e) => setEditSubjectData({ ...editSubjectData, newSubject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o novo nome do assunto"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowEditSubjectModal(false);
                  setEditSubjectData({ employeeName: '', sectionType: '', oldSubject: '', newSubject: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSubject}
                disabled={!editSubjectData.newSubject.trim() || editSubjectData.newSubject === editSubjectData.oldSubject}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  editSubjectData.newSubject.trim() && editSubjectData.newSubject !== editSubjectData.oldSubject
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Salvar Alteracoes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Excluir Assunto
              </h3>
              <button
                onClick={() => {
                  setShowDeleteSubjectModal(false);
                  setDeleteSubjectData({ employeeName: '', sectionType: '', subject: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Tem certeza que deseja excluir o assunto <strong>"{deleteSubjectData.subject}"</strong> do colaborador <strong>{deleteSubjectData.employeeName}</strong>?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Esta acao ira excluir todos os registros relacionados a este assunto e nãopode ser desfeita.
                </p>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteSubjectModal(false);
                  setDeleteSubjectData({ employeeName: '', sectionType: '', subject: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSubject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-purple-600" />
                Gerenciar Tabelas de Produtividade
              </h3>
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setEditingSection(null);
                  setSectionFormData({ title: '', section_key: '', has_subject: false, show_employee_total: false, show_day_total: false, display_order: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Lista de seções existentes */}
              {sections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Tabelas Existentes</h4>
                  <div className="space-y-2">
                    {sections.map(section => (
                      <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-800">{section.title}</p>
                          <p className="text-xs text-gray-500">Chave: {section.section_key} | Ordem: {section.display_order}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {section.has_subject && (
                              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Com campo de assunto
                              </span>
                            )}
                            {section.show_employee_total && (
                              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                Com total do colaborador
                              </span>
                            )}
                            {section.show_day_total && (
                              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Com total dia
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSection(section)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário para criar/editar seção */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {editingSection ? 'Editar Tabela' : 'Adicionar Nova Tabela'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título da Tabela *
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.title}
                      onChange={(e) => setSectionFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: VENDAS, SUPORTE, ADMINISTRATIVO"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave da Tabela *
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.section_key}
                      onChange={(e) => setSectionFormData(prev => ({ ...prev, section_key: e.target.value }))}
                      placeholder="Ex: VENDAS, SUPORTE (sem espaços, será convertido automaticamente)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Identificador único da tabela. Será convertido automaticamente para maiúsculas e espaços substituídos por underscore.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={sectionFormData.display_order}
                      onChange={(e) => setSectionFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionFormData.has_subject}
                        onChange={(e) => setSectionFormData(prev => ({ ...prev, has_subject: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Esta tabela possui campo de assunto</span>
                    </label>
                    <p className="mt-1 ml-6 text-xs text-gray-500">
                      Marque se esta tabela terá uma coluna adicional para assunto/categoria
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionFormData.show_employee_total}
                        onChange={(e) => setSectionFormData(prev => ({ ...prev, show_employee_total: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Mostrar total do colaborador</span>
                    </label>
                    <p className="mt-1 ml-6 text-xs text-gray-500">
                      Marque para exibir a coluna "Total Colaborador" na tabela de produtividade
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionFormData.show_day_total}
                        onChange={(e) => setSectionFormData(prev => ({ ...prev, show_day_total: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Mostrar produtividade</span>
                    </label>
                    <p className="mt-1 ml-6 text-xs text-gray-500">
                      Marque para exibir a linha "Produtividade" na tabela
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setEditingSection(null);
                  setSectionFormData({ title: '', section_key: '', has_subject: false, show_employee_total: false, show_day_total: false, display_order: 0 });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
              <button
                onClick={handleCreateSection}
                disabled={!sectionFormData.title.trim() || !sectionFormData.section_key.trim()}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  sectionFormData.title.trim() && sectionFormData.section_key.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingSection ? 'Atualizar Tabela' : 'Adicionar Tabela'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                Aplicar Categoria em Massa
              </h3>
              <button
                onClick={() => {
                  setShowBulkCategoryModal(false);
                  setBulkCategory('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Selecionado:</strong>
                  <br />
                  • {Array.from(selectedRows).filter(row => row.startsWith(`${currentBulkSection}::`)).length} linha(s) da tabela {getSectionTitle(currentBulkSection)}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  A categoria será aplicada em todos os dias das linhas selecionadas nesta tabela.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione a Categoria
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {productivityCategories.map(cat => (
                    <option key={cat.id} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {bulkCategory && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Categoria selecionada:</strong>
                    <span
                      className="ml-2 px-2 py-1 rounded text-white font-medium"
                      style={{ backgroundColor: productivityCategories.find(c => c.code === bulkCategory)?.color || '#3b82f6' }}
                    >
                      {bulkCategory}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowBulkCategoryModal(false);
                  setBulkCategory('');
                  setCurrentBulkSection('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleApplyBulkCategory();
                  setShowBulkCategoryModal(false);
                  setBulkCategory('');
                }}
                disabled={!bulkCategory}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  bulkCategory
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
