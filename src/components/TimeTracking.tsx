import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Clock, Users, TrendingUp, AlertCircle, CheckCircle, FileText, X, ChevronRight, Paperclip, Download, Trash2, Plus, Eye, UtensilsCrossed, FileSpreadsheet, Calendar, Search, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFileWithRetry, downloadFile, deleteFile } from '../utils/storageHelper';
import { sessionService } from '../services/sessionService';
import * as XLSX from 'xlsx';

function getPayrollPeriod(monthStr: string): { startDate: string; endDate: string } {
  const [year, month] = monthStr.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-21`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-20`;
  return { startDate, endDate };
}

interface TimeRecord {
  id: string;
  employee_id: string;
  record_date: string;
  clock_in_1: string | null;
  clock_out_1: string | null;
  clock_in_2: string | null;
  clock_out_2: string | null;
  clock_in_1_location: string | null;
  clock_out_1_location: string | null;
  clock_in_2_location: string | null;
  clock_out_2_location: string | null;
  total_hours: number;
  expected_hours: number;
  balance_hours: number;
  accumulated_balance: number;
  observations: string | null;
  record_type: string;
  original_record_type: string | null;
  interval_hours: number;
  missing_hours: number;
  normal_hours: number;
  overtime_1: number;
  overtime_2: number;
  adicional_noturno: number;
  horas_noturnas_reduzidas: number;
  employees: {
    name: string;
  };
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  description: string | null;
  uploaded_at: string;
}

interface EmployeeBalance {
  employee_id: string;
  employee_name: string;
  total_balance: number;
  records_count: number;
  atestado_count: number;
  total_overtime_1: number;
  has_sem_vale: boolean;
  has_compensacao_empresa: boolean;
  has_declaracao_medica: boolean;
  has_falta_sem_justificativa: boolean;
}

interface Location {
  id: string;
  legal_name: string;
  trade_name: string | null;
}

function decimalHoursToMinutes(decimalHours: number): number {
  const sign = decimalHours < 0 ? -1 : 1;
  const absValue = Math.abs(decimalHours);
  const totalMinutes = Math.round(absValue * 60);
  return sign * totalMinutes;
}

function minutesToHHMM(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '';
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

function formatDecimalHoursToHHMM(decimalHours: number): string {
  const totalMinutes = decimalHoursToMinutes(decimalHours);
  return minutesToHHMM(totalMinutes);
}

function parseTimeToDecimal(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }
  return null;
}

function computeTimeBreakdown(record: TimeRecord) {
  const in1 = parseTimeToDecimal(record.clock_in_1);
  const out1 = parseTimeToDecimal(record.clock_out_1);
  const in2 = parseTimeToDecimal(record.clock_in_2);
  const out2 = parseTimeToDecimal(record.clock_out_2);
  const hasClocks = in1 !== null || out1 !== null;
  const total = record.total_hours;
  const expected = record.expected_hours;

  let interval = record.interval_hours || 0;
  if (!interval && out1 !== null && in2 !== null && in2 > out1) {
    interval = in2 - out1;
  }

  let normal = record.normal_hours || 0;
  let missing = record.missing_hours || 0;
  let ot1 = record.overtime_1 || 0;
  let ot2 = record.overtime_2 || 0;

  if (!normal && !missing && !ot1 && !ot2) {
    if (expected > 0 && total > 0) {
      normal = Math.min(total, expected);
      if (total < expected) {
        missing = expected - total;
      } else if (total > expected) {
        ot1 = total - expected;
      }
    } else if (expected === 0 && total > 0) {
      ot2 = total;
    } else if (expected > 0 && total === 0 && hasClocks) {
      missing = expected;
    }
  }

  return { interval, missing, normal, overtime_1: ot1, overtime_2: ot2 };
}

export default function TimeTracking() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [employeeBalances, setEmployeeBalances] = useState<EmployeeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedBalanceLocation, setSelectedBalanceLocation] = useState<string>('');

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedTimeRecord, setSelectedTimeRecord] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [recordAttachments, setRecordAttachments] = useState<Map<string, Attachment[]>>(new Map());
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [deletingRecords, setDeletingRecords] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractEmployee, setExtractEmployee] = useState<{ id: string; name: string } | null>(null);
  const [extractRecords, setExtractRecords] = useState<TimeRecord[]>([]);
  const [extractBankEntries, setExtractBankEntries] = useState<{ entry_date: string; hours: number; reason: string }[]>([]);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [extractBankMonthFilter, setExtractBankMonthFilter] = useState<string>('');
  const [extractBankStartDate, setExtractBankStartDate] = useState<string>('');
  const [extractBankEndDate, setExtractBankEndDate] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [bulkExportMonthFilter, setBulkExportMonthFilter] = useState<string>('');
  const [bulkExportStartDate, setBulkExportStartDate] = useState<string>('');
  const [bulkExportEndDate, setBulkExportEndDate] = useState<string>('');
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [lastUpload, setLastUpload] = useState<{
    id: string;
    file_name: string;
    upload_date: string;
    records_processed: number;
    status: string;
    total_employees_processed: number;
    reference_month: string | null;
    uploaded_by_name?: string;
    location_name?: string;
  } | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  const [deleteUploadId, setDeleteUploadId] = useState<string | null>(null);
  const [deletingUpload, setDeletingUpload] = useState(false);

  useEffect(() => {
    const initMonth = async () => {
      const { data } = await supabase
        .from('time_tracking_uploads')
        .select('reference_month')
        .not('reference_month', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.reference_month) {
        setSelectedMonth(data.reference_month);
      }
    };
    initMonth();
    loadLocations();
    loadCurrentEmployee();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedEmployee, selectedMonth, selectedBalanceLocation]);

  useEffect(() => {
    loadUploadHistory();
  }, [selectedMonth, selectedBalanceLocation]);

  const filteredEmployeeBalances = useMemo(() => {
    let result = employeeBalances;

    if (selectedTagFilter) {
      result = result.filter(balance => {
        switch (selectedTagFilter) {
          case 'sem_vale':
            return balance.has_sem_vale;
          case 'compensacao_empresa':
            return balance.has_compensacao_empresa;
          case 'declaracao_medica':
            return balance.has_declaracao_medica;
          case 'falta_sem_justificativa':
            return balance.has_falta_sem_justificativa;
          default:
            return true;
        }
      });
    }

    if (employeeSearchQuery.trim()) {
      const query = employeeSearchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.filter(balance =>
        balance.employee_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
      );
    }

    return result;
  }, [employeeBalances, selectedTagFilter, employeeSearchQuery]);

  const categorizeTimeBankEntry = (reason: string): string => {
    const normalized = reason.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasNoturno = normalized.includes('noturno');
    const has100 = normalized.includes('100');
    const hasSerao = normalized.includes('serao');

    if (hasNoturno && has100) return 'Serão Noturno 100%';
    if (hasNoturno) return 'Serão Noturno 50%';
    if (has100 && hasSerao) return 'Serão 100%';
    if (hasSerao) return 'Serão 50%';
    return 'Outros';
  };

  const extractBankAvailableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    extractBankEntries.forEach(entry => {
      const month = entry.entry_date.slice(0, 7);
      monthsSet.add(month);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [extractBankEntries]);

  const filteredExtractBankEntries = useMemo(() => {
    if (extractBankStartDate || extractBankEndDate) {
      return extractBankEntries.filter(entry => {
        const entryDate = entry.entry_date;
        if (extractBankStartDate && extractBankEndDate) {
          return entryDate >= extractBankStartDate && entryDate <= extractBankEndDate;
        } else if (extractBankStartDate) {
          return entryDate >= extractBankStartDate;
        } else if (extractBankEndDate) {
          return entryDate <= extractBankEndDate;
        }
        return true;
      });
    }
    if (!extractBankMonthFilter) return extractBankEntries;
    return extractBankEntries.filter(entry => entry.entry_date.startsWith(extractBankMonthFilter));
  }, [extractBankEntries, extractBankMonthFilter, extractBankStartDate, extractBankEndDate]);

  const filteredExtractRecords = useMemo(() => {
    if (extractBankStartDate || extractBankEndDate) {
      return extractRecords.filter(r => {
        if (extractBankStartDate && extractBankEndDate) {
          return r.record_date >= extractBankStartDate && r.record_date <= extractBankEndDate;
        } else if (extractBankStartDate) {
          return r.record_date >= extractBankStartDate;
        } else if (extractBankEndDate) {
          return r.record_date <= extractBankEndDate;
        }
        return true;
      });
    }
    if (!extractBankMonthFilter) return extractRecords;
    return extractRecords.filter(r => r.record_date.startsWith(extractBankMonthFilter));
  }, [extractRecords, extractBankMonthFilter, extractBankStartDate, extractBankEndDate]);

  const timeBankSummaryMinutes = useMemo(() => {
    const summary = {
      'Serão 50%': 0,
      'Serão 100%': 0,
      'Serão Noturno 50%': 0,
      'Serão Noturno 100%': 0,
      'Ad. Noturno': 0
    };
    filteredExtractBankEntries.forEach(entry => {
      const category = categorizeTimeBankEntry(entry.reason);
      if (category !== 'Outros') {
        summary[category as keyof typeof summary] += decimalHoursToMinutes(entry.hours);
      }
    });

    const overtime2Total = filteredExtractRecords.reduce((sum, r) => sum + (r.overtime_2 || 0), 0);
    if (overtime2Total !== 0) {
      summary['Serão 100%'] = decimalHoursToMinutes(overtime2Total);
    }

    const adicionalNoturnoTotal = filteredExtractRecords.reduce((sum, r) => sum + (r.adicional_noturno || 0), 0);
    summary['Ad. Noturno'] = decimalHoursToMinutes(adicionalNoturnoTotal);

    return summary;
  }, [filteredExtractBankEntries, filteredExtractRecords]);

  const timeBankSummary = useMemo(() => {
    return {
      'Serão 50%': timeBankSummaryMinutes['Serão 50%'] / 60,
      'Serão 100%': timeBankSummaryMinutes['Serão 100%'] / 60,
      'Serão Noturno 50%': timeBankSummaryMinutes['Serão Noturno 50%'] / 60,
      'Serão Noturno 100%': timeBankSummaryMinutes['Serão Noturno 100%'] / 60,
      'Ad. Noturno': timeBankSummaryMinutes['Ad. Noturno'] / 60
    };
  }, [timeBankSummaryMinutes]);

  const exportTimeBankEntries = () => {
    if (!extractEmployee || filteredExtractBankEntries.length === 0) return;

    const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    let monthLabel = 'Todos os meses';
    if (extractBankStartDate || extractBankEndDate) {
      const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };
      if (extractBankStartDate && extractBankEndDate) {
        monthLabel = `${formatDate(extractBankStartDate)} ate ${formatDate(extractBankEndDate)}`;
      } else if (extractBankStartDate) {
        monthLabel = `A partir de ${formatDate(extractBankStartDate)}`;
      } else if (extractBankEndDate) {
        monthLabel = `Ate ${formatDate(extractBankEndDate)}`;
      }
    } else if (extractBankMonthFilter) {
      const [year, month] = extractBankMonthFilter.split('-');
      monthLabel = `${monthNames[parseInt(month) - 1]}/${year}`;
    }

    const totalMinutes = Object.values(timeBankSummaryMinutes).reduce((a, b) => a + b, 0);

    const summaryData = [{
      'Colaborador': extractEmployee.name,
      'Periodo': monthLabel,
      'Serao 50%': minutesToHHMM(timeBankSummaryMinutes['Serão 50%']),
      'Serao Noturno 50%': minutesToHHMM(timeBankSummaryMinutes['Serão Noturno 50%']),
      'Serao 100%': minutesToHHMM(timeBankSummaryMinutes['Serão 100%']),
      'Serao Noturno 100%': minutesToHHMM(timeBankSummaryMinutes['Serão Noturno 100%']),
      'Ad. Noturno': minutesToHHMM(timeBankSummaryMinutes['Ad. Noturno']),
      'Total': minutesToHHMM(totalMinutes)
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(summaryData);

    ws['!cols'] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Banco de Horas');

    let fileSuffix = '';
    if (extractBankStartDate && extractBankEndDate) {
      fileSuffix = `_${extractBankStartDate}_ate_${extractBankEndDate}`;
    } else if (extractBankStartDate) {
      fileSuffix = `_a_partir_${extractBankStartDate}`;
    } else if (extractBankEndDate) {
      fileSuffix = `_ate_${extractBankEndDate}`;
    } else if (extractBankMonthFilter) {
      fileSuffix = `_${extractBankMonthFilter}`;
    }
    const fileName = `Banco_Horas_${extractEmployee.name.replace(/\s+/g, '_')}${fileSuffix}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const toggleEmployeeExportSelection = (employeeId: string) => {
    setSelectedForExport(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const toggleAllExportSelection = () => {
    if (selectedForExport.size === filteredEmployeeBalances.length) {
      setSelectedForExport(new Set());
    } else {
      setSelectedForExport(new Set(filteredEmployeeBalances.map(b => b.employee_id)));
    }
  };

  const exportEmployeeBalances = async (employeeIds?: string | string[]) => {
    try {
      let employeesToExport: EmployeeBalance[];
      if (typeof employeeIds === 'string') {
        employeesToExport = filteredEmployeeBalances.filter(b => b.employee_id === employeeIds);
      } else if (Array.isArray(employeeIds)) {
        const idSet = new Set(employeeIds);
        employeesToExport = filteredEmployeeBalances.filter(b => idSet.has(b.employee_id));
      } else {
        employeesToExport = filteredEmployeeBalances;
      }

      if (employeesToExport.length === 0) return;

      const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

      let periodLabel = 'Todos os periodos';
      if (bulkExportStartDate && bulkExportEndDate) {
        const formatDate = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
        };
        periodLabel = `${formatDate(bulkExportStartDate)} ate ${formatDate(bulkExportEndDate)}`;
      } else if (bulkExportStartDate) {
        const [year, month, day] = bulkExportStartDate.split('-');
        periodLabel = `A partir de ${day}/${month}/${year}`;
      } else if (bulkExportEndDate) {
        const [year, month, day] = bulkExportEndDate.split('-');
        periodLabel = `Ate ${day}/${month}/${year}`;
      } else if (bulkExportMonthFilter) {
        const [year, month] = bulkExportMonthFilter.split('-');
        periodLabel = `${monthNames[parseInt(month) - 1]}/${year}`;
      }

      const allData: any[] = [];

      for (const balance of employeesToExport) {
        let query = supabase
          .from('time_bank_entries')
          .select('entry_date, hours, reason')
          .eq('employee_id', balance.employee_id);

        if (bulkExportStartDate && bulkExportEndDate) {
          query = query
            .gte('entry_date', bulkExportStartDate)
            .lte('entry_date', bulkExportEndDate);
        } else if (bulkExportStartDate) {
          query = query.gte('entry_date', bulkExportStartDate);
        } else if (bulkExportEndDate) {
          query = query.lte('entry_date', bulkExportEndDate);
        } else if (bulkExportMonthFilter) {
          query = query
            .gte('entry_date', `${bulkExportMonthFilter}-01`)
            .lte('entry_date', `${bulkExportMonthFilter}-31`);
        }

        const { data: bankData } = await query.order('entry_date', { ascending: true });

        const categorySumsMinutes = {
          'Serão 50%': 0,
          'Serão 100%': 0,
          'Serão Noturno 50%': 0,
          'Serão Noturno 100%': 0,
          'Outros': 0
        };

        (bankData || []).forEach((entry: { reason: string; hours: number }) => {
          const category = categorizeTimeBankEntry(entry.reason);
          categorySumsMinutes[category as keyof typeof categorySumsMinutes] += decimalHoursToMinutes(entry.hours);
        });

        const totalMinutes = Object.values(categorySumsMinutes).reduce((a, b) => a + b, 0);

        allData.push({
          'Colaborador': balance.employee_name,
          'Periodo': periodLabel,
          'Serao 50%': minutesToHHMM(categorySumsMinutes['Serão 50%']),
          'Serao Noturno 50%': minutesToHHMM(categorySumsMinutes['Serão Noturno 50%']),
          'Serao 100%': minutesToHHMM(categorySumsMinutes['Serão 100%']),
          'Serao Noturno 100%': minutesToHHMM(categorySumsMinutes['Serão Noturno 100%']),
          'Total': minutesToHHMM(totalMinutes)
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(allData);
      ws['!cols'] = [
        { wch: 30 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Banco de Horas');

      let dateSuffix = '';
      if (bulkExportStartDate && bulkExportEndDate) {
        dateSuffix = `_${bulkExportStartDate}_a_${bulkExportEndDate}`;
      } else if (bulkExportStartDate) {
        dateSuffix = `_desde_${bulkExportStartDate}`;
      } else if (bulkExportEndDate) {
        dateSuffix = `_ate_${bulkExportEndDate}`;
      } else if (bulkExportMonthFilter) {
        dateSuffix = `_${bulkExportMonthFilter}`;
      }

      let fileName: string;
      if (typeof employeeIds === 'string') {
        fileName = `Banco_Horas_${employeesToExport[0].employee_name.replace(/\s+/g, '_')}${dateSuffix}.xlsx`;
      } else if (employeesToExport.length === 1) {
        fileName = `Banco_Horas_${employeesToExport[0].employee_name.replace(/\s+/g, '_')}${dateSuffix}.xlsx`;
      } else {
        fileName = `Banco_Horas_${employeesToExport.length}_colaboradores${dateSuffix}.xlsx`;
      }
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const loadCurrentEmployee = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (data) {
        setCurrentEmployeeId(data.id);
      }
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, legal_name, trade_name')
        .eq('status', 0)
        .eq('type', 2)
        .order('legal_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadUploadHistory = async () => {
    try {
      let query = supabase
        .from('time_tracking_uploads')
        .select('*, employees!uploaded_by(name), locations!location_id(trade_name, legal_name)')
        .order('created_at', { ascending: false });

      if (selectedMonth) {
        query = query.eq('reference_month', selectedMonth);
      }

      if (selectedBalanceLocation) {
        query = query.eq('location_id', selectedBalanceLocation);
      }

      const { data } = await query.limit(20);

      const enriched = (data || []).map((u: any) => ({
        ...u,
        uploaded_by_name: u.employees?.name || 'Desconhecido',
        location_name: u.locations?.trade_name || u.locations?.legal_name || '',
      }));

      setUploadHistory(enriched);
      setLastUpload(enriched.length > 0 ? enriched[0] : null);
    } catch (err) {
      console.error('Error loading upload history:', err);
    }
  };

const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTimeRecords(),
        loadEmployeeBalances()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeRecords = async () => {
    let query = supabase
      .from('time_records')
      .select(`
        *,
        employees(name)
      `)
      .order('record_date', { ascending: false });

    if (selectedEmployee) {
      query = query.eq('employee_id', selectedEmployee);
    }

    if (selectedMonth) {
      const { startDate, endDate } = getPayrollPeriod(selectedMonth);
      query = query.gte('record_date', startDate).lte('record_date', endDate);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;
    setTimeRecords(data || []);

    if (data && data.length > 0) {
      await loadAttachments(data.map(r => r.id));
    }
  };

  const loadAttachments = async (recordIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('time_record_attachments')
        .select('*')
        .in('time_record_id', recordIds)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const attachmentsMap = new Map<string, Attachment[]>();
      data?.forEach(attachment => {
        const recordAttachments = attachmentsMap.get(attachment.time_record_id) || [];
        recordAttachments.push(attachment);
        attachmentsMap.set(attachment.time_record_id, recordAttachments);
      });

      setRecordAttachments(attachmentsMap);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const loadEmployeeBalances = async () => {
    let employeeIds: string[] | null = null;

    if (selectedBalanceLocation) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('workplace_id', selectedBalanceLocation)
        .in('status', [0, 1, 2, 3]);

      employeeIds = employees?.map(e => e.id) || [];

      if (employeeIds.length === 0) {
        setEmployeeBalances([]);
        return;
      }
    }

    const { data: shiftData } = await supabase
      .from('shift_times')
      .select('id, start_time');

    const shiftStartMap = new Map<string, number>();
    shiftData?.forEach(shift => {
      if (shift.start_time) {
        const [sh, sm] = shift.start_time.split(':').map(Number);
        shiftStartMap.set(shift.id, sh * 60 + sm);
      }
    });

    const { data: empShifts } = await supabase
      .from('employees')
      .select('id, shift_id');

    const employeeShiftMap = new Map<string, string | null>();
    empShifts?.forEach(emp => {
      employeeShiftMap.set(emp.id, emp.shift_id);
    });

    let query = supabase
      .from('time_records')
      .select(`
        employee_id,
        record_date,
        accumulated_balance,
        original_record_type,
        overtime_1,
        clock_in_1,
        missing_hours,
        expected_hours,
        total_hours,
        employees(name)
      `)
      .order('record_date', { ascending: false });

    if (employeeIds && employeeIds.length > 0) {
      query = query.in('employee_id', employeeIds);
    }

    if (selectedMonth) {
      const { startDate, endDate } = getPayrollPeriod(selectedMonth);
      query = query.gte('record_date', startDate).lte('record_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const balanceMap = new Map<string, EmployeeBalance>();
    const lastValidBalanceMap = new Map<string, number>();

    const semValeTracker = new Map<string, {
      totalLateMinutes: number;
      faltaAtestadoCount: number;
      totalMissingMinutes: number;
      atrasoMissingMinutes: number;
      atestadoCount: number;
      hasFaltaInjustificada: boolean;
    }>();

    data?.forEach(record => {
      const employeeId = record.employee_id;
      const employeeData = record.employees as unknown as { name: string } | null;
      const accumulatedBalance = record.accumulated_balance || 0;
      const recordType = (record.original_record_type || '').toLowerCase();
      const isAtestado = recordType.includes('atestado');
      const overtime1 = record.overtime_1 || 0;
      const clockIn1 = record.clock_in_1;
      const expectedHours = record.expected_hours || 0;
      const totalHours = record.total_hours || 0;

      let missingHours = record.missing_hours || 0;
      if (!missingHours && expectedHours > 0 && totalHours > 0 && totalHours < expectedHours) {
        missingHours = expectedHours - totalHours;
      }

      const shouldExcludeFromOvertime =
        recordType.includes('compensação empresa') ||
        recordType.includes('compensacao empresa') ||
        recordType.includes('declaração medica') ||
        recordType.includes('declaracao medica') ||
        recordType.includes('falta sem justificativa');

      const hasCompensacaoEmpresa = recordType.includes('compensação empresa') || recordType.includes('compensacao empresa');
      const hasDeclaracaoMedica = recordType.includes('declaração medica') || recordType.includes('declaracao medica');
      const hasFaltaSemJustificativa = recordType.includes('falta sem justificativa');
      const isFaltaOrAtestado = hasFaltaSemJustificativa || isAtestado;

      if (!semValeTracker.has(employeeId)) {
        semValeTracker.set(employeeId, {
          totalLateMinutes: 0,
          faltaAtestadoCount: 0,
          totalMissingMinutes: 0,
          atrasoMissingMinutes: 0,
          atestadoCount: 0,
          hasFaltaInjustificada: false,
        });
      }

      const tracker = semValeTracker.get(employeeId)!;

      if (clockIn1 && expectedHours > 0) {
        const [hours, minutes] = clockIn1.split(':').map(Number);
        const entryMinutes = hours * 60 + minutes;

        const shiftId = employeeShiftMap.get(employeeId);
        const expectedEntryMinutes = (shiftId && shiftStartMap.has(shiftId))
          ? shiftStartMap.get(shiftId)!
          : 8 * 60;

        const delayMinutes = entryMinutes - expectedEntryMinutes;
        if (delayMinutes > 0) {
          tracker.totalLateMinutes += delayMinutes;
        }
      }

      if (isFaltaOrAtestado) {
        tracker.faltaAtestadoCount += 1;
      }

      if (isAtestado) {
        tracker.atestadoCount += 1;
      }

      if (recordType.includes('falta injustificada') || hasFaltaSemJustificativa) {
        tracker.hasFaltaInjustificada = true;
      }

      if (missingHours > 0) {
        tracker.totalMissingMinutes += missingHours * 60;
        if (recordType.includes('atras')) {
          tracker.atrasoMissingMinutes += missingHours * 60;
        }
      }

      if (!balanceMap.has(employeeId)) {
        balanceMap.set(employeeId, {
          employee_id: employeeId,
          employee_name: employeeData?.name || 'Desconhecido',
          total_balance: accumulatedBalance,
          records_count: 1,
          atestado_count: isAtestado ? 1 : 0,
          total_overtime_1: shouldExcludeFromOvertime ? 0 : overtime1,
          has_sem_vale: false,
          has_compensacao_empresa: hasCompensacaoEmpresa,
          has_declaracao_medica: hasDeclaracaoMedica,
          has_falta_sem_justificativa: hasFaltaSemJustificativa,
        });
        if (accumulatedBalance !== 0) {
          lastValidBalanceMap.set(employeeId, accumulatedBalance);
        }
      } else {
        const balance = balanceMap.get(employeeId)!;
        balance.records_count += 1;
        if (isAtestado) balance.atestado_count += 1;
        if (!shouldExcludeFromOvertime) {
          balance.total_overtime_1 += overtime1;
        }
        if (hasCompensacaoEmpresa) balance.has_compensacao_empresa = true;
        if (hasDeclaracaoMedica) balance.has_declaracao_medica = true;
        if (hasFaltaSemJustificativa) balance.has_falta_sem_justificativa = true;
        if (accumulatedBalance !== 0 && !lastValidBalanceMap.has(employeeId)) {
          lastValidBalanceMap.set(employeeId, accumulatedBalance);
        }
      }
    });

    balanceMap.forEach((balance, employeeId) => {
      if (balance.total_balance === 0 && lastValidBalanceMap.has(employeeId)) {
        balance.total_balance = lastValidBalanceMap.get(employeeId)!;
      }

      const tracker = semValeTracker.get(employeeId);
      if (tracker) {
        const hasAtrasoOver30 = tracker.atrasoMissingMinutes > 30;
        const hasFaltaInjustificada = tracker.hasFaltaInjustificada;
        const hasMultipleAtestados = tracker.atestadoCount >= 2;

        if (hasAtrasoOver30 || hasFaltaInjustificada || hasMultipleAtestados) {
          balance.has_sem_vale = true;
        }
      }
    });

    setEmployeeBalances(Array.from(balanceMap.values()).sort((a, b) =>
      b.total_balance - a.total_balance
    ));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleDebugUpload = async () => {
    if (!file) return;

    try {
      let session = null;
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData?.session;

      if (session) {
        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt - now < 60) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData?.session || session;
        }
      }

      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData?.session;
      }

      if (!session?.access_token) {
        alert('Sessao expirada. Por favor, faca login novamente.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-timesheet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: formData,
        }
      );

      const result = await response.json();
      setDebugResult(result);
      setShowDebugModal(true);
    } catch (error: any) {
      console.error('Debug error:', error);
      alert('Erro ao debugar: ' + error.message);
    }
  };

  const handleAttachmentFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
      if (pdfFiles.length !== files.length) {
        alert('Apenas arquivos PDF são permitidos');
      }
      setAttachmentFiles(pdfFiles);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isCsv = file.name.endsWith('.csv');
      const isPdf = file.name.endsWith('.pdf');

      if (!isExcel && !isCsv && !isPdf) {
        throw new Error('Arquivo deve ser Excel (.xlsx, .xls), CSV (.csv) ou PDF');
      }

      if (!selectedLocation) {
        throw new Error('Selecione a filial/local de trabalho antes de fazer o upload');
      }

      let session = null;

      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData?.session;

      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData?.session;
      } else {
        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt - now < 300) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) session = refreshData.session;
        }
      }

      if (!session?.access_token) {
        throw new Error('Não foi possível obter a sessão. Por favor, recarregue a página e tente novamente.');
      }

      const createFormData = () => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('fileName', file.name);
        fd.append('locationId', selectedLocation);
        return fd;
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-timesheet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: createFormData(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('Upload error response:', { status: response.status, errorMessage });
        const lowerError = errorMessage.toLowerCase();
        const isAuthError = lowerError.includes('jwt') ||
                           lowerError.includes('token') ||
                           lowerError.includes('autenticacao') ||
                           lowerError.includes('autenticação') ||
                           (lowerError.includes('login') && lowerError.includes('novamente')) ||
                           response.status === 401;
        if (isAuthError) {
          console.log('Auth error detected, attempting session refresh...');
          const { data: retryRefresh } = await supabase.auth.refreshSession();
          if (retryRefresh?.session) {
            console.log('Session refreshed, retrying upload...');
            const retryResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-timesheet`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${retryRefresh.session.access_token}`,
                },
                body: createFormData(),
              }
            );
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              setUploadResult(retryResult);
              if (retryResult.success) {
                setFile(null);
                if (retryResult.referenceMonth) {
                  setSelectedMonth(retryResult.referenceMonth);
                }
                await loadData();
                await loadUploadHistory();
                if (showExtractModal && extractEmployee) {
                  await reloadExtractData();
                }
              }
              return;
            }
            const retryErrorText = await retryResponse.text();
            console.error('Retry also failed:', retryErrorText);
            let retryErrMsg = `Erro HTTP ${retryResponse.status}`;
            try { const j = JSON.parse(retryErrorText); retryErrMsg = j.error || j.message || retryErrMsg; } catch {}
            throw new Error(retryErrMsg);
          }
          throw new Error('Erro de autenticação ao chamar o servidor. Por favor, recarregue a página.');
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        setFile(null);
        if (result.referenceMonth) {
          setSelectedMonth(result.referenceMonth);
        }
        await loadData();
        await loadUploadHistory();

        if (showExtractModal && extractEmployee) {
          await reloadExtractData();
        }
      } else {
        throw new Error(result.error || 'Erro ao processar arquivo');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: error.message || 'Erro desconhecido ao fazer upload',
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadAttachments = async () => {
    if (!selectedTimeRecord || attachmentFiles.length === 0) return;

    setUploadingAttachment(true);
    try {
      const uploadPromises = attachmentFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentEmployeeId}/${selectedTimeRecord}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await uploadFileWithRetry(
          'time-record-attachments',
          fileName,
          file,
          { upsert: false }
        );

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('time_record_attachments')
          .insert({
            time_record_id: selectedTimeRecord,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            uploaded_by: currentEmployeeId,
            description: attachmentDescription || null
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      alert('Anexos enviados com sucesso!');
      setShowAttachmentModal(false);
      setAttachmentFiles([]);
      setAttachmentDescription('');
      setSelectedTimeRecord(null);
      await loadTimeRecords();
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      alert(`Erro ao enviar anexos: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await downloadFile('time-record-attachments', attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      alert(`Erro ao baixar anexo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return;

    try {
      const { error: storageError } = await deleteFile('time-record-attachments', [filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('time_record_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      await loadTimeRecords();
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      alert(`Erro ao excluir anexo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const formatTimeWithLocation = (time: string | null, location: string | null) => {
    if (time) return time.slice(0, 5);
    if (location) return location;
    return '-';
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRecordTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      work: 'Trabalho',
      dayoff: 'Folga',
      vacation: 'Férias',
      absence: 'Falta',
      holiday: 'Feriado',
    };
    return types[type] || type;
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const isEmptyWorkDay = (record: TimeRecord) => {
    const hasNoClockTimes = !record.clock_in_1 && !record.clock_out_1 &&
                            !record.clock_in_2 && !record.clock_out_2;
    const hasNoLocations = !record.clock_in_1_location && !record.clock_out_1_location &&
                           !record.clock_in_2_location && !record.clock_out_2_location;
    return hasNoClockTimes && hasNoLocations && record.record_type === 'work';
  };

  const isBancoHoras = (record: TimeRecord) => {
    const locations = [
      record.clock_in_1_location,
      record.clock_out_1_location,
      record.clock_in_2_location,
      record.clock_out_2_location
    ];
    return locations.some(loc => loc && loc.toUpperCase().includes('FO BH'));
  };

  const getDisplayRecordType = (record: TimeRecord) => {
    if (isBancoHoras(record)) {
      return 'Banco de Horas';
    }
    if (isEmptyWorkDay(record)) {
      return 'Folga';
    }
    return getRecordTypeLabel(record.record_type);
  };

  const handleSelectEmployee = (employeeId: string, employeeName: string) => {
    setSelectedEmployee(employeeId);
    setSelectedEmployeeName(employeeName);
  };

  const handleExportToExcel = async () => {
    setExportingExcel(true);
    try {
      let startDate: string;
      let endDate: string;
      let periodLabel: string;

      if (exportStartDate || exportEndDate) {
        if (exportStartDate && exportEndDate) {
          startDate = exportStartDate;
          endDate = exportEndDate;
          const formatDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
          };
          periodLabel = `${formatDate(startDate)} ate ${formatDate(endDate)}`;
        } else if (exportStartDate) {
          startDate = exportStartDate;
          endDate = '9999-12-31';
          const [year, month, day] = exportStartDate.split('-');
          periodLabel = `A partir de ${day}/${month}/${year}`;
        } else {
          startDate = '1900-01-01';
          endDate = exportEndDate!;
          const [year, month, day] = exportEndDate.split('-');
          periodLabel = `Ate ${day}/${month}/${year}`;
        }
      } else {
        const [year, month] = exportMonth.split('-');
        const period = getPayrollPeriod(exportMonth);
        startDate = period.startDate;
        endDate = period.endDate;
        const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        periodLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
      }

      const employeeIds = filteredEmployeeBalances.map(b => b.employee_id);
      if (employeeIds.length === 0) return;

      const { data: records, error } = await supabase
        .from('time_records')
        .select('*, employees(name)')
        .in('employee_id', employeeIds)
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: true });

      if (error) throw error;

      if (!records || records.length === 0) {
        alert(`Nenhum registro encontrado para ${periodLabel}.`);
        return;
      }

      let filteredRecords = records;
      if (selectedTagFilter && selectedTagFilter !== 'sem_vale') {
        filteredRecords = records.filter(r => {
          const recordType = (r.original_record_type || '').toLowerCase();
          switch (selectedTagFilter) {
            case 'compensacao_empresa':
              return recordType.includes('compensação empresa') || recordType.includes('compensacao empresa');
            case 'declaracao_medica':
              return recordType.includes('declaração medica') || recordType.includes('declaracao medica') || recordType.includes('declaração médica');
            case 'falta_sem_justificativa':
              return recordType.includes('falta sem justificativa');
            default:
              return true;
          }
        });

        if (filteredRecords.length === 0) {
          alert(`Nenhum registro encontrado com a tag selecionada para ${periodLabel}.`);
          return;
        }
      }

      let dataToExport: Record<string, string | number>[];

      if (selectedTagFilter && selectedTagFilter !== 'sem_vale') {
        const summaryMap = new Map<string, { name: string; count: number; dates: string[] }>();

        filteredRecords.forEach(r => {
          const employeeId = r.employee_id;
          const employeeName = (r.employees as any)?.name || 'Desconhecido';
          const [ry, rm, rd] = r.record_date.split('-');
          const dateFormatted = `${rd}/${rm}/${ry}`;

          if (!summaryMap.has(employeeId)) {
            summaryMap.set(employeeId, { name: employeeName, count: 0, dates: [] });
          }
          const entry = summaryMap.get(employeeId)!;
          entry.count += 1;
          entry.dates.push(dateFormatted);
        });

        dataToExport = Array.from(summaryMap.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(entry => ({
            'Colaborador': entry.name,
            'Quantidade': entry.count,
            'Datas': entry.dates.join(', '),
          }));
      } else if (selectedTagFilter === 'sem_vale') {
        const semValeSummary = new Map<string, {
          name: string;
          atrasoMissingMinutes: number;
          atestadoCount: number;
          hasFaltaInjustificada: boolean;
          atrasoMissingDates: string[];
          atestadoDates: string[];
          faltaInjustificadaDates: string[];
        }>();

        records.forEach(r => {
          const eid = r.employee_id;
          const ename = (r.employees as any)?.name || 'Desconhecido';
          const [ry, rm, rd] = r.record_date.split('-');
          const dateStr = `${rd}/${rm}`;

          if (!semValeSummary.has(eid)) {
            semValeSummary.set(eid, {
              name: ename,
              atrasoMissingMinutes: 0,
              atestadoCount: 0,
              hasFaltaInjustificada: false,
              atrasoMissingDates: [],
              atestadoDates: [],
              faltaInjustificadaDates: [],
            });
          }
          const entry = semValeSummary.get(eid)!;

          const recordType = (r.original_record_type || '').toLowerCase();
          const isAtraso = recordType.includes('atras');
          const isAtestadoRecord = recordType.includes('atestado');
          const isFaltaInjust = recordType.includes('falta injustificada') || recordType.includes('falta sem justificativa');

          if (isAtraso && (r.missing_hours || 0) > 0) {
            entry.atrasoMissingMinutes += (r.missing_hours || 0) * 60;
            entry.atrasoMissingDates.push(`${dateStr} (${formatDecimalHoursToHHMM(r.missing_hours)})`);
          }

          if (isAtestadoRecord) {
            entry.atestadoCount += 1;
            entry.atestadoDates.push(dateStr);
          }

          if (isFaltaInjust) {
            entry.hasFaltaInjustificada = true;
            entry.faltaInjustificadaDates.push(dateStr);
          }
        });

        dataToExport = Array.from(semValeSummary.values())
          .filter(e => e.atrasoMissingMinutes > 30 || e.hasFaltaInjustificada || e.atestadoCount >= 2)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(entry => {
            const motivos: string[] = [];
            if (entry.atrasoMissingMinutes > 30) motivos.push(`Atraso H.Faltantes: ${Math.round(entry.atrasoMissingMinutes)}min`);
            if (entry.hasFaltaInjustificada) motivos.push('Falta Injustificada');
            if (entry.atestadoCount >= 2) motivos.push(`Atestados: ${entry.atestadoCount}x`);
            return {
              'Colaborador': entry.name,
              'Motivo': motivos.join(' | '),
              'Atraso H.Faltantes (min)': Math.round(entry.atrasoMissingMinutes),
              'Datas Atraso': entry.atrasoMissingDates.join(', '),
              'Atestados': entry.atestadoCount,
              'Datas Atestados': entry.atestadoDates.join(', '),
              'Falta Injustificada (dias)': entry.faltaInjustificadaDates.length,
              'Datas Falta Injust.': entry.faltaInjustificadaDates.join(', '),
            };
          });
      } else {
        dataToExport = filteredRecords.map(r => {
          const [ry, rm, rd] = r.record_date.split('-');
          return {
            'Colaborador': (r.employees as any)?.name || '',
            'Data': `${rd}/${rm}/${ry}`,
            '1a Entrada': r.clock_in_1 || '',
            '1a Saida': r.clock_out_1 || '',
            '2a Entrada': r.clock_in_2 || '',
            '2a Saida': r.clock_out_2 || '',
            'H. Intervalo': formatDecimalHoursToHHMM(r.interval_hours || 0),
            'H. Faltantes': formatDecimalHoursToHHMM(r.missing_hours || 0),
            'Horas Normais': formatDecimalHoursToHHMM(r.normal_hours || 0),
            'H.E. 1': formatDecimalHoursToHHMM(r.overtime_1 || 0),
            'H.E. 2': formatDecimalHoursToHHMM(r.overtime_2 || 0),
            'Horas Totais': formatDecimalHoursToHHMM(r.total_hours || 0),
            'Saldo Acum.': formatDecimalHoursToHHMM(r.accumulated_balance || 0),
            'Tipo': r.original_record_type || 'Trabalho',
          };
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle de Ponto');

      const filterLabel = selectedTagFilter ?
        ` - ${selectedTagFilter === 'sem_vale' ? 'Sem Vale Alimentacao' :
             selectedTagFilter === 'compensacao_empresa' ? 'Compensacao Empresa' :
             selectedTagFilter === 'declaracao_medica' ? 'Declaracao Medica' :
             'Falta sem Justificativa'}` : '';

      let fileNameSuffix = '';
      if (exportStartDate && exportEndDate) {
        fileNameSuffix = `_${exportStartDate}_a_${exportEndDate}`;
      } else if (exportStartDate) {
        fileNameSuffix = `_desde_${exportStartDate}`;
      } else if (exportEndDate) {
        fileNameSuffix = `_ate_${exportEndDate}`;
      } else {
        fileNameSuffix = `_${exportMonth}`;
      }

      XLSX.writeFile(workbook, `controle_ponto${fileNameSuffix}${filterLabel}.xlsx`);
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Erro ao exportar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDeleteMonthRecords = async () => {
    if (!selectedMonth) {
      alert('Selecione um mes para excluir os registros.');
      return;
    }
    setDeletingRecords(true);
    try {
      const { startDate, endDate } = getPayrollPeriod(selectedMonth);

      let idsToDelete: string[] = [];

      if (selectedBalanceLocation) {
        const { data: employees } = await supabase
          .from('employees')
          .select('id')
          .eq('workplace_id', selectedBalanceLocation);

        const employeeIds = employees?.map(e => e.id) || [];

        if (employeeIds.length === 0) {
          alert('Nenhum colaborador encontrado na filial selecionada.');
          setShowDeleteConfirmModal(false);
          setDeletingRecords(false);
          return;
        }

        const { data: records, error: fetchErr } = await supabase
          .from('time_records')
          .select('id')
          .in('employee_id', employeeIds)
          .gte('record_date', startDate)
          .lte('record_date', endDate);

        if (fetchErr) throw fetchErr;
        idsToDelete = records?.map(r => r.id) || [];
      } else {
        const { data: records, error: fetchErr } = await supabase
          .from('time_records')
          .select('id')
          .gte('record_date', startDate)
          .lte('record_date', endDate);

        if (fetchErr) throw fetchErr;
        idsToDelete = records?.map(r => r.id) || [];
      }

      if (idsToDelete.length === 0) {
        alert(`Nenhum registro encontrado para o mes ${selectedMonth}.`);
        setShowDeleteConfirmModal(false);
        setDeletingRecords(false);
        return;
      }

      let deletedCount = 0;
      const BATCH_SIZE = 50;

      for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + BATCH_SIZE);

        const { data: attachments } = await supabase
          .from('time_record_attachments')
          .select('id')
          .in('time_record_id', batch);

        if (attachments && attachments.length > 0) {
          const attachmentIds = attachments.map(a => a.id);
          await supabase
            .from('time_record_attachments')
            .delete()
            .in('id', attachmentIds);
        }

        const { error: delErr } = await supabase
          .from('time_records')
          .delete()
          .in('id', batch);

        if (delErr) {
          console.error('Batch delete error:', delErr);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-time-records`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ month: selectedMonth, locationId: selectedBalanceLocation || null }),
                }
              );
              const result = await response.json();
              if (result.success) {
                deletedCount = result.deleted;
                break;
              }
            }
          } catch (edgeFnErr) {
            console.error('Edge function fallback error:', edgeFnErr);
          }
        } else {
          deletedCount += batch.length;
        }
      }

      const { count: remaining } = await supabase
        .from('time_records')
        .select('id', { count: 'exact', head: true })
        .gte('record_date', startDate)
        .lte('record_date', endDate);

      if (remaining && remaining > 0) {
        alert(`${deletedCount} registros excluidos, mas ${remaining} nao puderam ser removidos (sem permissao).`);
      } else {
        alert(`${deletedCount} registros de ponto de ${selectedMonth} excluidos com sucesso!`);
      }

      setShowDeleteConfirmModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting records:', error);
      alert(`Erro ao excluir registros: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setDeletingRecords(false);
    }
  };

  const handleDeleteUploadRecords = async (uploadId: string) => {
    const upload = uploadHistory.find(u => u.id === uploadId);
    if (!upload) return;

    setDeletingUpload(true);
    try {
      const refMonth = upload.reference_month;
      const locationId = upload.location_id;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessao expirada');

      if (refMonth) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-time-records`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              month: refMonth,
              locationId: locationId || null,
              uploadId,
              usePayrollPeriod: true,
            }),
          }
        );
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Erro ao excluir registros');
        }
      } else {
        await supabase
          .from('time_tracking_uploads')
          .delete()
          .eq('id', uploadId);
      }

      setDeleteUploadId(null);
      await loadUploadHistory();
      await loadData();
    } catch (error: any) {
      console.error('Error deleting upload records:', error);
      alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setDeletingUpload(false);
    }
  };

  const handleClearEmployeeFilter = () => {
    setSelectedEmployee('');
    setSelectedEmployeeName('');
  };

  const handleOpenExtract = async (employeeId: string, employeeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExtractEmployee({ id: employeeId, name: employeeName });
    setShowExtractModal(true);
    setLoadingExtract(true);
    setExtractBankMonthFilter('');
    setExtractBankStartDate('');
    setExtractBankEndDate('');
    try {
      const { data, error } = await supabase
        .from('time_records')
        .select('*, employees(name)')
        .eq('employee_id', employeeId)
        .order('record_date', { ascending: true });

      if (error) throw error;
      setExtractRecords(data || []);

      const { data: bankData } = await supabase
        .from('time_bank_entries')
        .select('entry_date, hours, reason')
        .eq('employee_id', employeeId)
        .order('entry_date', { ascending: true });
      setExtractBankEntries(bankData || []);
    } catch (error) {
      console.error('Error loading extract:', error);
      setExtractRecords([]);
      setExtractBankEntries([]);
    } finally {
      setLoadingExtract(false);
    }
  };

  const reloadExtractData = async () => {
    if (!extractEmployee) return;

    try {
      const { data, error } = await supabase
        .from('time_records')
        .select('*, employees(name)')
        .eq('employee_id', extractEmployee.id)
        .order('record_date', { ascending: true });

      if (error) throw error;
      setExtractRecords(data || []);

      const { data: bankData } = await supabase
        .from('time_bank_entries')
        .select('entry_date, hours, reason')
        .eq('employee_id', extractEmployee.id)
        .order('entry_date', { ascending: true });
      setExtractBankEntries(bankData || []);
    } catch (error) {
      console.error('Error reloading extract:', error);
    }
  };

  const extractSummary = useMemo(() => {
    if (extractRecords.length === 0) return null;

    const totalWorked = extractRecords.reduce((s, r) => s + r.total_hours, 0);
    const totalExpected = extractRecords.reduce((s, r) => s + r.expected_hours, 0);
    const sorted = [...extractRecords].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
    const lastBalance = sorted[0]?.accumulated_balance ?? 0;

    const typeCounts: Record<string, number> = {};
    extractRecords.forEach(r => {
      const t = r.original_record_type || 'Trabalho';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    const monthlyMap: Record<string, { worked: number; expected: number; balance: number; count: number }> = {};
    extractRecords.forEach(r => {
      const month = r.record_date.slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { worked: 0, expected: 0, balance: 0, count: 0 };
      monthlyMap[month].worked += r.total_hours;
      monthlyMap[month].expected += r.expected_hours;
      monthlyMap[month].balance += r.balance_hours;
      monthlyMap[month].count += 1;
    });

    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return { totalWorked, totalExpected, lastBalance, typeCounts, monthly };
  }, [extractRecords]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Ponto</h1>
          <p className="text-gray-600">Faça upload de planilhas de ponto e acompanhe o saldo de horas dos colaboradores</p>
        </div>

<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Planilha de Ponto
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local de Trabalho *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              >
                <option value="">Selecione o local de trabalho...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.trade_name || location.legal_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Apenas colaboradores deste local serão processados
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o arquivo Excel (.xlsx), CSV ou PDF
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || !selectedLocation || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Fazer Upload
                  </>
                )}
              </button>
              <button
                onClick={handleDebugUpload}
                disabled={!file}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Debug Planilha
              </button>
            </div>

            {uploadResult && (
              <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {uploadResult.success ? 'Upload realizado com sucesso!' : 'Erro no upload'}
                    </p>
                    {uploadResult.success && (
                      <p className="text-sm text-green-700 mt-1">
                        {uploadResult.recordsProcessed} de {uploadResult.totalRecords} registros processados
                      </p>
                    )}
                    {uploadResult.error && (
                      <p className="text-sm text-red-700 mt-1">{uploadResult.error}</p>
                    )}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-medium">Erros encontrados:</p>
                        <ul className="list-disc list-inside mt-1">
                          {uploadResult.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {(lastUpload || uploadHistory.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Historico de Uploads {selectedMonth ? `- ${selectedMonth}` : ''}
              </h2>
              {uploadHistory.length > 1 && (
                <button
                  onClick={() => setShowUploadHistory(!showUploadHistory)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {showUploadHistory ? 'Mostrar Ultimo' : `Ver Todos (${uploadHistory.length})`}
                  <ChevronRight className={`h-4 w-4 transition-transform ${showUploadHistory ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(showUploadHistory ? uploadHistory : uploadHistory.slice(0, 1)).map((upload: any, idx: number) => (
                <div
                  key={upload.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    idx === 0 && !showUploadHistory
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    upload.status === 'completed' ? 'bg-green-100' : upload.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {upload.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : upload.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{upload.file_name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        upload.status === 'completed' ? 'bg-green-100 text-green-700' : upload.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {upload.status === 'completed' ? 'Concluido' : upload.status === 'failed' ? 'Erro' : 'Processando'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(upload.upload_date || upload.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {upload.uploaded_by_name && <span>por {upload.uploaded_by_name}</span>}
                      {upload.location_name && <span>{upload.location_name}</span>}
                      {upload.reference_month && <span>Ref: {upload.reference_month}</span>}
                      {upload.records_processed > 0 && <span>{upload.records_processed} registros</span>}
                      {upload.total_employees_processed > 0 && <span>{upload.total_employees_processed} colaboradores</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteUploadId(upload.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Excluir registros deste upload"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {uploadHistory.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum upload encontrado para este mes.</p>
              )}
            </div>
          </div>
        )}

        {deleteUploadId && (() => {
          const targetUpload = uploadHistory.find((u: any) => u.id === deleteUploadId);
          if (!targetUpload) return null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Excluir Upload</h3>
                      <p className="text-sm text-gray-500">Esta acao nao pode ser desfeita</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 space-y-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{targetUpload.file_name}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {targetUpload.reference_month && (
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">Mes: {targetUpload.reference_month}</span>
                      )}
                      {targetUpload.location_name && (
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{targetUpload.location_name}</span>
                      )}
                      {targetUpload.records_processed > 0 && (
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{targetUpload.records_processed} registros</span>
                      )}
                    </div>
                    <p className="text-sm text-red-800 mt-2">
                      {targetUpload.reference_month
                        ? `Todos os registros de ponto do mes ${targetUpload.reference_month}${targetUpload.location_name ? ` (${targetUpload.location_name})` : ''} serao excluidos permanentemente.`
                        : 'O registro deste upload sera removido.'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteUploadId(null)}
                      disabled={deletingUpload}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteUploadRecords(deleteUploadId)}
                      disabled={deletingUpload}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {deletingUpload ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              disabled={employeeBalances.length === 0 || !selectedMonth}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Marcacoes do Mes
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={filteredEmployeeBalances.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar para Excel
            </button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Local:</label>
              <select
                value={selectedBalanceLocation}
                onChange={(e) => setSelectedBalanceLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[280px]"
              >
                <option value="">Todos os Locais</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.trade_name || location.legal_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filtrar por Tag:</label>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[280px]"
              >
                <option value="">Todas as Tags</option>
                <option value="sem_vale">Sem Vale Alimentacao</option>
                <option value="compensacao_empresa">Compensacao Empresa</option>
                <option value="declaracao_medica">Declaracao Medica</option>
                <option value="falta_sem_justificativa">Falta sem Justificativa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {selectedTagFilter ? 'Colaboradores Filtrados' : 'Total de Colaboradores'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{filteredEmployeeBalances.length}</p>
                {selectedTagFilter && employeeBalances.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">de {employeeBalances.length} total</p>
                )}
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registros de Ponto</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {filteredEmployeeBalances.reduce((sum, emp) => sum + emp.records_count, 0)}
                </p>
              </div>
              <Clock className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Total de Horas</p>
                <p className={`text-3xl font-bold mt-1 ${getBalanceColor(filteredEmployeeBalances.reduce((sum, emp) => sum + emp.total_balance, 0))}`}>
                  {formatDecimalHoursToHHMM(filteredEmployeeBalances.reduce((sum, emp) => sum + emp.total_balance, 0))}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Saldo de Horas por Colaborador</h2>
                <p className="text-sm text-gray-500 mt-1">Clique em um colaborador para ver os detalhes dos registros de ponto</p>
              </div>
              <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">De:</label>
                <input
                  type="date"
                  value={bulkExportStartDate}
                  onChange={(e) => setBulkExportStartDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Data inicial"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">Ate:</label>
                <input
                  type="date"
                  value={bulkExportEndDate}
                  onChange={(e) => setBulkExportEndDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Data final"
                />
              </div>
              {(bulkExportStartDate || bulkExportEndDate) && (
                <button
                  onClick={() => {
                    setBulkExportStartDate('');
                    setBulkExportEndDate('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              )}
              {selectedForExport.size > 0 && (
                <button
                  onClick={() => setSelectedForExport(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar selecao
                </button>
              )}
              <button
                onClick={() => selectedForExport.size > 0
                  ? exportEmployeeBalances(Array.from(selectedForExport))
                  : exportEmployeeBalances()
                }
                disabled={filteredEmployeeBalances.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {selectedForExport.size > 0
                  ? `Exportar Selecionados (${selectedForExport.size})`
                  : `Exportar Todos (${filteredEmployeeBalances.length})`
                }
              </button>
            </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar colaborador por nome..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {employeeSearchQuery && (
                <button
                  onClick={() => setEmployeeSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredEmployeeBalances.length > 0 && selectedForExport.size === filteredEmployeeBalances.length}
                      onChange={toggleAllExportSelection}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acao
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployeeBalances.map((balance) => (
                  <tr
                    key={balance.employee_id}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedEmployee === balance.employee_id ? 'bg-blue-100' : ''} ${selectedForExport.has(balance.employee_id) ? 'bg-green-50' : ''}`}
                    onClick={() => handleSelectEmployee(balance.employee_id, balance.employee_name)}
                  >
                    <td className="px-3 py-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedForExport.has(balance.employee_id)}
                        onChange={() => toggleEmployeeExportSelection(balance.employee_id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{balance.employee_name}</span>
                        {balance.total_overtime_1 > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            H.E. 1: {formatDecimalHoursToHHMM(balance.total_overtime_1)}
                          </span>
                        )}
                        {balance.has_sem_vale && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            <UtensilsCrossed className="w-3 h-3" />
                            Sem Vale
                          </span>
                        )}
                        {balance.has_compensacao_empresa && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            Compensacao
                          </span>
                        )}
                        {balance.has_declaracao_medica && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Declaracao
                          </span>
                        )}
                        {balance.has_falta_sem_justificativa && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                            Falta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {balance.records_count}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getBalanceColor(balance.total_balance)}`}>
                      {balance.total_balance > 0 ? '+' : ''}{formatDecimalHoursToHHMM(balance.total_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportEmployeeBalances(balance.employee_id); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                          title="Exportar dados deste colaborador"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenExtract(balance.employee_id, balance.employee_name, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Ver extrato analitico"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Extrato
                        </button>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEmployee && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Registros de Ponto</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedEmployeeName}
                </span>
                <button
                  onClick={handleClearEmployeeFilter}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Limpar filtro"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saida 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saida 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : timeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    <>
                      {timeRecords.map((record) => {
                        const isEmpty = isEmptyWorkDay(record);
                        const isBH = isBancoHoras(record);
                        const attachments = recordAttachments.get(record.id) || [];
                        const getRowClass = () => {
                          if (isBH) return 'bg-green-50 hover:bg-green-100';
                          if (isEmpty) return 'bg-red-50 hover:bg-red-100';
                          return 'hover:bg-gray-50';
                        };
                        const getTextClass = (isDate = false) => {
                          if (isBH) return isDate ? 'text-green-900 font-medium' : 'text-green-600';
                          if (isEmpty) return isDate ? 'text-red-900 font-medium' : 'text-red-600';
                          return isDate ? 'text-gray-900' : 'text-gray-500';
                        };
                        const getBadgeClass = () => {
                          if (isBH) return 'bg-green-100 text-green-800 font-semibold';
                          if (isEmpty) return 'bg-red-100 text-red-800 font-semibold';
                          return 'bg-gray-100 text-gray-800';
                        };
                        return (
                          <tr key={record.id} className={getRowClass()}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTextClass(true)}`}>
                              {formatDate(record.record_date)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTextClass()}`}>
                              {formatTimeWithLocation(record.clock_in_1, record.clock_in_1_location)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTextClass()}`}>
                              {formatTimeWithLocation(record.clock_out_1, record.clock_out_1_location)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTextClass()}`}>
                              {formatTimeWithLocation(record.clock_in_2, record.clock_in_2_location)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTextClass()}`}>
                              {formatTimeWithLocation(record.clock_out_2, record.clock_out_2_location)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextClass(true)}`}>
                              {formatDecimalHoursToHHMM(record.total_hours)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : getBalanceColor(record.accumulated_balance || 0)}`}>
                              {(record.accumulated_balance || 0) > 0 ? '+' : ''}{formatDecimalHoursToHHMM(record.accumulated_balance || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${getBadgeClass()}`}>
                                {record.original_record_type || 'Trabalho'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(() => {
                        const sortedRecords = [...timeRecords].sort((a, b) =>
                          new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
                        );
                        const lastRecord = sortedRecords[0];
                        const lastAccumulatedBalance = lastRecord?.accumulated_balance ?? 0;
                        const monthlyTotal = timeRecords.reduce((sum, r) => sum + r.total_hours, 0);
                        return (
                          <tr className="bg-blue-50 border-t-2 border-blue-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900" colSpan={5}>
                              Saldo Banco - Acumulado
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">
                              {formatDecimalHoursToHHMM(monthlyTotal)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getBalanceColor(lastAccumulatedBalance)}`}>
                              {lastAccumulatedBalance > 0 ? '+' : ''}{formatDecimalHoursToHHMM(lastAccumulatedBalance)}
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        );
                      })()}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusao</h3>
                  <p className="text-sm text-gray-500">Esta acao não pode ser desfeita</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  Todos os registros de ponto do periodo <span className="font-bold">
                    {(() => { const p = getPayrollPeriod(selectedMonth); return `${p.startDate.split('-').reverse().join('/')} a ${p.endDate.split('-').reverse().join('/')}`; })()}
                  </span>
                  {selectedBalanceLocation
                    ? ` dos colaboradores do local "${locations.find(l => l.id === selectedBalanceLocation)?.trade_name || locations.find(l => l.id === selectedBalanceLocation)?.legal_name}"`
                    : ' de TODOS os locais'
                  } serao excluidos permanentemente.
                </p>
                <p className="text-sm font-semibold text-red-900 mt-2">
                  Total de registros no periodo: {employeeBalances.reduce((sum, emp) => sum + emp.records_count, 0)}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  disabled={deletingRecords}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteMonthRecords}
                  disabled={deletingRecords}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                >
                  {deletingRecords ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir Registros
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Exportar para Excel</h3>
                  <p className="text-sm text-gray-500">Escolha o periodo para exportar</p>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data inicial</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data final</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                {(exportStartDate || exportEndDate) && (
                  <button
                    onClick={() => {
                      setExportStartDate('');
                      setExportEndDate('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpar datas
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={exportingExcel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExportToExcel}
                  disabled={exportingExcel || (!exportStartDate && !exportEndDate && !exportMonth)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2 text-sm font-medium"
                >
                  {exportingExcel ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDebugModal && debugResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Debug - Conteudo da Planilha</h3>
              <button
                onClick={() => setShowDebugModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Anexos do Registro</h3>
                <button
                  onClick={() => {
                    setShowAttachmentModal(false);
                    setAttachmentFiles([]);
                    setAttachmentDescription('');
                    setSelectedTimeRecord(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedTimeRecord && recordAttachments.get(selectedTimeRecord)?.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">{attachment.file_name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      {attachment.description && (
                        <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadAttachment(attachment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Baixar"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteAttachment(attachment.id, attachment.file_path)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Adicionar Novos Anexos</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arquivos PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleAttachmentFilesChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingAttachment}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Você pode selecionar múltiplos arquivos PDF
                    </p>
                  </div>

                  {attachmentFiles.length > 0 && (
                    <div className="space-y-2">
                      {attachmentFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-blue-50 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>{file.name}</span>
                          <span className="text-gray-400">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={attachmentDescription}
                      onChange={(e) => setAttachmentDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adicione uma descrição para os anexos..."
                      disabled={uploadingAttachment}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAttachmentModal(false);
                        setAttachmentFiles([]);
                        setAttachmentDescription('');
                        setSelectedTimeRecord(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={uploadingAttachment}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={uploadAttachments}
                      disabled={attachmentFiles.length === 0 || uploadingAttachment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploadingAttachment ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Enviar Anexos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExtractModal && extractEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Extrato Analitico</h3>
                <p className="text-blue-100 text-sm">{extractEmployee.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowExtractModal(false);
                  setExtractEmployee(null);
                  setExtractRecords([]);
                  setExtractBankEntries([]);
                  setExtractBankStartDate('');
                  setExtractBankEndDate('');
                  setExtractBankMonthFilter('');
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingExtract ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : extractSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Horas Trabalhadas</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{formatDecimalHoursToHHMM(extractSummary.totalWorked)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Horas Esperadas</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatDecimalHoursToHHMM(extractSummary.totalExpected)}</p>
                    </div>
                    <div className={`rounded-xl p-4 border ${extractSummary.lastBalance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className={`text-xs font-medium uppercase tracking-wider ${extractSummary.lastBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Saldo Acumulado</p>
                      <p className={`text-2xl font-bold mt-1 ${extractSummary.lastBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {extractSummary.lastBalance > 0 ? '+' : ''}{formatDecimalHoursToHHMM(extractSummary.lastBalance)}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Registros</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{extractRecords.length}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Distribuicao por Motivo</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(extractSummary.typeCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => {
                          const isAtestado = type.toLowerCase().includes('atestado');
                          return (
                            <span
                              key={type}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                                isAtestado
                                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {type}
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                isAtestado ? 'bg-orange-200 text-orange-900' : 'bg-gray-200 text-gray-600'
                              }`}>{count}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumo Mensal</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Mes</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Registros</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Trabalhadas</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Esperadas</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Saldo Mes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {extractSummary.monthly.map(m => {
                            const [y, mo] = m.month.split('-');
                            const label = `${mo}/${y}`;
                            return (
                              <tr key={m.month} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{label}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600">{m.count}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600">{formatDecimalHoursToHHMM(m.worked)}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600">{formatDecimalHoursToHHMM(m.expected)}</td>
                                <td className={`px-4 py-2.5 text-sm font-semibold ${getBalanceColor(m.balance)}`}>
                                  {m.balance > 0 ? '+' : ''}{formatDecimalHoursToHHMM(m.balance)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Registros Detalhados ({extractRecords.length})</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-80">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Ent. 1</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sai. 1</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Ent. 2</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sai. 2</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H. Intervalo</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H. Faltantes</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H. Normais</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H.E. 1 (0%)</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H.E. 2 (100%)</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">A.N.</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">H.N. Rod.</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {extractRecords.map(record => {
                            const isEmpty = isEmptyWorkDay(record);
                            const isBH = isBancoHoras(record);
                            const rowClass = isBH ? 'bg-green-50' : isEmpty ? 'bg-red-50' : '';
                            const breakdown = computeTimeBreakdown(record);
                            return (
                              <tr key={record.id} className={`${rowClass} hover:bg-gray-50`}>
                                <td className="px-3 py-2 text-xs font-medium text-gray-900 whitespace-nowrap">{formatDate(record.record_date)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatTimeWithLocation(record.clock_in_1, record.clock_in_1_location)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatTimeWithLocation(record.clock_out_1, record.clock_out_1_location)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatTimeWithLocation(record.clock_in_2, record.clock_in_2_location)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatTimeWithLocation(record.clock_out_2, record.clock_out_2_location)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{breakdown.interval > 0 ? formatDecimalHoursToHHMM(breakdown.interval) : '0:00'}</td>
                                <td className={`px-3 py-2 text-xs whitespace-nowrap ${breakdown.missing > 0 && (record.original_record_type || '').toLowerCase().includes('atras') ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{formatDecimalHoursToHHMM(breakdown.missing)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatDecimalHoursToHHMM(breakdown.normal)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatDecimalHoursToHHMM(breakdown.overtime_1)}</td>
                                <td className={`px-3 py-2 text-xs whitespace-nowrap ${breakdown.overtime_2 > 0 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>{formatDecimalHoursToHHMM(breakdown.overtime_2)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatDecimalHoursToHHMM(record.adicional_noturno || 0)}</td>
                                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{formatDecimalHoursToHHMM(record.horas_noturnas_reduzidas || 0)}</td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(record.total_hours)}</td>
                                <td className={`px-3 py-2 text-xs font-semibold whitespace-nowrap ${getBalanceColor(record.accumulated_balance || 0)}`}>
                                  {(record.accumulated_balance || 0) > 0 ? '+' : ''}{formatDecimalHoursToHHMM(record.accumulated_balance || 0)}
                                </td>
                                <td className="px-3 py-2 text-xs whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    isBH ? 'bg-green-100 text-green-800' : isEmpty ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {record.original_record_type || 'Trabalho'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {extractRecords.length > 0 && (() => {
                          const totals = extractRecords.reduce((acc, record) => {
                            const bd = computeTimeBreakdown(record);
                            acc.interval += bd.interval;
                            const motivo = (record.original_record_type || '').toLowerCase();
                            if (motivo.includes('atras')) {
                              acc.missing += bd.missing;
                            }
                            acc.normal += bd.normal;
                            acc.overtime1 += bd.overtime_1;
                            acc.overtime2 += bd.overtime_2;
                            acc.an += record.adicional_noturno || 0;
                            acc.hnRod += record.horas_noturnas_reduzidas || 0;
                            acc.total += record.total_hours || 0;
                            return acc;
                          }, { interval: 0, missing: 0, normal: 0, overtime1: 0, overtime2: 0, an: 0, hnRod: 0, total: 0 });
                          const lastRecord = extractRecords[extractRecords.length - 1];
                          const finalBalance = lastRecord?.accumulated_balance || 0;
                          return (
                            <tfoot>
                              <tr className="bg-gray-100 border-t-2 border-gray-300">
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">TOTAL</td>
                                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">-</td>
                                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">-</td>
                                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">-</td>
                                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">-</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.interval)}</td>
                                <td className={`px-3 py-2 text-xs font-bold whitespace-nowrap ${totals.missing > 0 ? 'text-red-700' : 'text-gray-900'}`}>{formatDecimalHoursToHHMM(totals.missing)}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.normal)}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.overtime1)}</td>
                                <td className={`px-3 py-2 text-xs font-bold whitespace-nowrap ${totals.overtime2 > 0 ? 'text-blue-700' : 'text-gray-900'}`}>{formatDecimalHoursToHHMM(totals.overtime2)}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.an)}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.hnRod)}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 whitespace-nowrap">{formatDecimalHoursToHHMM(totals.total)}</td>
                                <td className={`px-3 py-2 text-xs font-bold whitespace-nowrap ${getBalanceColor(finalBalance)}`}>
                                  {finalBalance > 0 ? '+' : ''}{formatDecimalHoursToHHMM(finalBalance)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">-</td>
                              </tr>
                            </tfoot>
                          );
                        })()}
                      </table>
                    </div>
                  </div>

                  {extractBankEntries.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900">Lancamentos de banco de horas ({filteredExtractBankEntries.length})</h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={extractBankStartDate}
                              onChange={(e) => {
                                setExtractBankStartDate(e.target.value);
                                setExtractBankMonthFilter('');
                              }}
                              placeholder="Data inicial"
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-xs text-gray-500">ate</span>
                            <input
                              type="date"
                              value={extractBankEndDate}
                              onChange={(e) => {
                                setExtractBankEndDate(e.target.value);
                                setExtractBankMonthFilter('');
                              }}
                              placeholder="Data final"
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {(extractBankStartDate || extractBankEndDate) && (
                              <button
                                onClick={() => {
                                  setExtractBankStartDate('');
                                  setExtractBankEndDate('');
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                                title="Limpar filtro"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={exportTimeBankEntries}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Exportar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] font-medium text-blue-600 uppercase">Serao 50%</p>
                          <p className="text-sm font-bold text-blue-900">
                            {minutesToHHMM(timeBankSummaryMinutes['Serão 50%'])}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] font-medium text-green-600 uppercase">Serao 100%</p>
                          <p className="text-sm font-bold text-green-900">
                            {minutesToHHMM(timeBankSummaryMinutes['Serão 100%'])}
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] font-medium text-amber-600 uppercase">Noturno 50%</p>
                          <p className="text-sm font-bold text-amber-900">
                            {minutesToHHMM(timeBankSummaryMinutes['Serão Noturno 50%'])}
                          </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] font-medium text-orange-600 uppercase">Noturno 100%</p>
                          <p className="text-sm font-bold text-orange-900">
                            {minutesToHHMM(timeBankSummaryMinutes['Serão Noturno 100%'])}
                          </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] font-medium text-gray-600 uppercase">Ad. Noturno</p>
                          <p className="text-sm font-bold text-gray-900">
                            {minutesToHHMM(timeBankSummaryMinutes['Ad. Noturno'])}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-64">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Horas</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredExtractBankEntries.map((entry, idx) => {
                              const [y, m, d] = entry.entry_date.split('-');
                              const dateLabel = `${d}/${m}/${y}`;
                              const category = categorizeTimeBankEntry(entry.reason);
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-xs text-gray-900 whitespace-nowrap">{dateLabel}</td>
                                  <td className={`px-4 py-2 text-xs font-medium whitespace-nowrap ${entry.hours < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.hours > 0 ? '+' : ''}{formatDecimalHoursToHHMM(entry.hours)}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">{entry.reason}</td>
                                  <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{category}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Nenhum registro encontrado para este colaborador.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
