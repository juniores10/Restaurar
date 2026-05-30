import { useState, useEffect, useRef } from 'react';
import { FileSpreadsheet, ChevronDown, Calendar, Maximize2, X, TrendingUp, Target, Award, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadRecord {
  id: string;
  sector_id: string;
  reference_month: string;
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
}

interface EmployeeProductivityData {
  employeeId: string;
  employeeName: string;
  planned: number;
  realized: number;
  productivity: number;
  isCurrentUser: boolean;
}

interface DashboardStats {
  employeeTotal: number;
  sectorTotal: number;
  employeeAverage: number;
  sectorAverage: number;
  employeeRank: number;
  totalEmployees: number;
  employeePercentile: number;
  employeePlanned: number;
  employeeRealized: number;
  employeeProductivity: number;
  sectorPlanned: number;
  sectorRealized: number;
  sectorProductivity: number;
  ranking: EmployeeProductivityData[];
}

export function EmployeeSectorProductivity() {
  const { employeeProfile } = useAuth();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [records, setRecords] = useState<ProductivityRecord[]>([]);
  const [sections, setSections] = useState<ProductivitySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const scrollRefs = useRef<Record<string, { top: HTMLDivElement | null; bottom: HTMLDivElement | null }>>({});

  useEffect(() => {
    loadUploads();
  }, [employeeProfile]);

  const loadUploads = async () => {
    if (!employeeProfile?.id) return;

    try {
      setIsLoading(true);

      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('department_id')
        .eq('id', employeeProfile.id)
        .maybeSingle();

      if (empError) throw empError;

      const departmentId = employeeData?.department_id;

      if (!departmentId) {
        setUploads([]);
        setIsLoading(false);
        return;
      }

      const { data: uploadsData, error: uploadsError } = await supabase
        .from('sector_productivity_uploads')
        .select('id, sector_id, reference_month, description')
        .eq('sector_id', departmentId)
        .order('reference_month', { ascending: false });

      if (uploadsError) throw uploadsError;

      const { data: sectorData } = await supabase
        .from('data_types')
        .select('id, description')
        .eq('id', departmentId)
        .maybeSingle();

      const formattedUploads = (uploadsData || []).map(u => ({
        ...u,
        sector: sectorData ? { id: sectorData.id, description: sectorData.description } : { id: departmentId, description: 'Setor' }
      }));

      setUploads(formattedUploads);

      if (formattedUploads.length > 0) {
        setSelectedUpload(formattedUploads[0]);
        await loadRecords(formattedUploads[0].id, formattedUploads[0].sector_id);
      }
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecords = async (uploadId: string, sectorId: string) => {
    try {
      setIsLoadingRecords(true);

      const [recordsResponse, sectionsResponse] = await Promise.all([
        supabase
          .from('sector_productivity_records')
          .select('*')
          .eq('upload_id', uploadId)
          .eq('sector_id', sectorId),
        supabase
          .from('productivity_sections')
          .select('*')
          .eq('upload_id', uploadId)
          .order('display_order')
      ]);

      if (recordsResponse.error) throw recordsResponse.error;
      if (sectionsResponse.error) throw sectionsResponse.error;

      const loadedRecords = recordsResponse.data || [];
      setRecords(loadedRecords);
      setSections(sectionsResponse.data || []);

      calculateDashboardStats(loadedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const calculateDashboardStats = (recordsData: ProductivityRecord[]) => {
    if (!employeeProfile?.id || recordsData.length === 0) {
      setDashboardStats(null);
      return;
    }

    const employeeData: Record<string, {
      name: string;
      planned: number;
      realized: number;
      total: number;
    }> = {};

    recordsData.forEach(record => {
      if (record.employee_id) {
        if (!employeeData[record.employee_id]) {
          employeeData[record.employee_id] = {
            name: record.employee_name_original,
            planned: 0,
            realized: 0,
            total: 0
          };
        }

        const subjectLower = (record.subject || '').toLowerCase();
        if (typeof record.points === 'number') {
          if (subjectLower.includes('planejado')) {
            employeeData[record.employee_id].planned += record.points;
          } else if (subjectLower.includes('realizado')) {
            employeeData[record.employee_id].realized += record.points;
          }
          employeeData[record.employee_id].total += record.points;
        }
      }
    });

    const currentEmployee = employeeData[employeeProfile.id] || { name: '', planned: 0, realized: 0, total: 0 };
    const employeePlanned = currentEmployee.planned;
    const employeeRealized = currentEmployee.realized;
    const employeeProductivity = employeePlanned > 0 ? (employeeRealized / employeePlanned) * 100 : 0;
    const employeeTotal = currentEmployee.total;

    let sectorPlanned = 0;
    let sectorRealized = 0;
    let sectorTotal = 0;
    Object.values(employeeData).forEach(emp => {
      sectorPlanned += emp.planned;
      sectorRealized += emp.realized;
      sectorTotal += emp.total;
    });
    const sectorProductivity = sectorPlanned > 0 ? (sectorRealized / sectorPlanned) * 100 : 0;

    const totalEmployees = Object.keys(employeeData).length;
    const sectorAverage = totalEmployees > 0 ? sectorTotal / totalEmployees : 0;

    const daysInMonth = selectedUpload ? new Date(
      new Date(selectedUpload.reference_month).getFullYear(),
      new Date(selectedUpload.reference_month).getMonth() + 1,
      0
    ).getDate() : 1;

    const employeeAverage = employeeTotal / daysInMonth;

    const ranking: EmployeeProductivityData[] = Object.entries(employeeData)
      .map(([id, data]) => ({
        employeeId: id,
        employeeName: data.name,
        planned: data.planned,
        realized: data.realized,
        productivity: data.planned > 0 ? (data.realized / data.planned) * 100 : 0,
        isCurrentUser: id === employeeProfile.id
      }))
      .sort((a, b) => b.productivity - a.productivity);

    const employeeRank = ranking.findIndex(r => r.employeeId === employeeProfile.id) + 1;
    const employeePercentile = totalEmployees > 0 ? ((totalEmployees - employeeRank + 1) / totalEmployees) * 100 : 0;

    setDashboardStats({
      employeeTotal,
      sectorTotal,
      employeeAverage,
      sectorAverage,
      employeeRank,
      employeePlanned,
      employeeRealized,
      employeeProductivity,
      sectorPlanned,
      sectorRealized,
      sectorProductivity,
      ranking,
      totalEmployees,
      employeePercentile
    });
  };

  const handleUploadSelect = async (upload: UploadRecord) => {
    setSelectedUpload(upload);
    await loadRecords(upload.id, upload.sector_id);
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatNumber = (value: number): string => {
    if (value === 0) return '0';
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
  };

  const getDaysInMonth = () => {
    if (!selectedUpload) return [];
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getDayOfWeek = (day: number) => {
    if (!selectedUpload) return '';
    const date = new Date(selectedUpload.reference_month + 'T12:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();
    const dayDate = new Date(year, month, day);
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[dayDate.getDay()];
  };

  const getSectionTypes = () => {
    if (sections.length > 0) {
      return sections.map(s => s.section_key);
    }
    const types = [...new Set(records.map(r => r.section_type))];
    return types.sort();
  };

  const getSectionTitle = (sectionType: string) => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.title || sectionType;
  };

  const getSectionHasSubject = (sectionType: string) => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.has_subject ?? false;
  };

  const getSectionShowEmployeeTotal = (sectionType: string) => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.show_employee_total ?? false;
  };

  const getSectionShowDayTotal = (sectionType: string) => {
    const section = sections.find(s => s.section_key === sectionType);
    return section?.show_day_total ?? false;
  };

  const groupRecordsByEmployee = (sectionType: string) => {
    const sectionRecords = records.filter(r => r.section_type === sectionType);
    const employeeMap: Record<string, {
      name: string;
      matched: boolean;
      employeeId: string | null;
      isCurrentUser: boolean;
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
          isCurrentUser: record.employee_id === employeeProfile?.id,
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
      let value: number | string | null;
      if (record.category && (record.points === null || record.points === undefined || record.points === 0)) {
        value = record.category;
      } else if (record.points !== null && record.points !== undefined) {
        value = record.points;
      } else {
        value = record.category || '';
      }
      subjectEntry.dailyPoints[day] = value;
    });

    Object.values(employeeMap).forEach(emp => {
      emp.subjects.forEach(sub => {
        sub.total = Object.values(sub.dailyPoints).reduce((sum: number, val) => {
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
      });
      emp.totalAllSubjects = emp.subjects.reduce((sum, sub) => sum + sub.total, 0);
      emp.subjects.sort((a, b) => {
        if (!a.subject && !b.subject) return 0;
        if (!a.subject) return -1;
        if (!b.subject) return 1;
        return a.subject.localeCompare(b.subject);
      });
    });

    return Object.values(employeeMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getDayTotals = (sectionType: string) => {
    const sectionRecords = records.filter(r => r.section_type === sectionType);
    const totals: Record<number, number> = {};

    sectionRecords.forEach(record => {
      const day = new Date(record.work_date + 'T12:00:00').getDate();
      if (!totals[day]) totals[day] = 0;
      if (typeof record.points === 'number') {
        totals[day] += record.points;
      }
    });

    return totals;
  };

  const setScrollRef = (sectionType: string, position: 'top' | 'bottom', el: HTMLDivElement | null) => {
    if (!scrollRefs.current[sectionType]) {
      scrollRefs.current[sectionType] = { top: null, bottom: null };
    }
    scrollRefs.current[sectionType][position] = el;
  };

  const syncScroll = (sectionType: string, source: 'top' | 'bottom') => {
    const refs = scrollRefs.current[sectionType];
    if (!refs) return;

    const sourceEl = refs[source];
    const targetEl = refs[source === 'top' ? 'bottom' : 'top'];

    if (sourceEl && targetEl) {
      targetEl.scrollLeft = sourceEl.scrollLeft;
    }
  };

  const sectionColors = [
    { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-800' },
    { border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-800' },
    { border: 'border-l-teal-500', bg: 'bg-teal-50', text: 'text-teal-800' },
    { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-800' },
    { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-800' },
    { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-800' },
    { border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-800' },
    { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-800' },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-500">Carregando...</span>
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">Nenhuma planilha de produtividade encontrada</p>
        <p className="text-slate-400 text-sm mt-1">
          Nao ha dados de produtividade disponíveis para o seu setor
        </p>
      </div>
    );
  }

  const renderSectionTable = (sectionType: string, sectionIndex: number, isFullscreen: boolean = false) => {
    const groupedData = groupRecordsByEmployee(sectionType);
    const hasSubject = getSectionHasSubject(sectionType);
    const showEmployeeTotal = getSectionShowEmployeeTotal(sectionType);
    const showDayTotal = getSectionShowDayTotal(sectionType);
    const colorScheme = sectionColors[sectionIndex % sectionColors.length];

    return (
      <div key={sectionType} className={`bg-white ${isFullscreen ? 'h-full flex flex-col' : 'rounded-xl shadow-lg'} overflow-hidden border border-slate-100`}>
        <div className={`flex justify-between items-center p-4 border-b border-l-4 ${colorScheme.border} ${colorScheme.bg}`}>
          <h3 className={`text-lg font-semibold ${colorScheme.text}`}>
            {getSectionTitle(sectionType)}
          </h3>
          {isFullscreen ? (
            <button
              onClick={() => setFullscreenSection(null)}
              className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${colorScheme.text}`}
              title="Fechar tela cheia"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setFullscreenSection(sectionType)}
              className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${colorScheme.text}`}
              title="Ver em tela cheia"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className={`p-4 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
          {!isFullscreen && (
            <div
              className="overflow-x-auto mb-1 pb-2"
              style={{ overflowY: 'hidden', borderBottom: '1px solid #e5e7eb' }}
              ref={(el) => setScrollRef(sectionType, 'top', el)}
              onScroll={() => syncScroll(sectionType, 'top')}
            >
              <div style={{ width: `${getDaysInMonth().length * 60 + (hasSubject ? 296 : 40) + 120}px`, height: '1px' }}></div>
            </div>
          )}

          <div
            className="overflow-x-auto"
            ref={!isFullscreen ? (el) => setScrollRef(sectionType, 'bottom', el) : undefined}
            onScroll={!isFullscreen ? () => syncScroll(sectionType, 'bottom') : undefined}
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 min-w-40 z-10 sticky left-0">
                    Colaborador
                  </th>
                  {hasSubject && (
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 min-w-64 z-10 border-l border-gray-300 sticky left-40">
                      Assunto
                    </th>
                  )}
                  {getDaysInMonth().map(day => (
                    <th key={day} className="px-1 py-2 text-center text-xs font-medium text-gray-500 min-w-20">
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
                  const employeeSubtotals: Record<number, number> = {};
                  let employeeGrandTotal = 0;

                  getDaysInMonth().forEach(day => {
                    let dayTotal = 0;
                    employee.subjects.forEach(subjectData => {
                      const val = subjectData.dailyPoints[day];
                      if (typeof val === 'number') {
                        dayTotal += val;
                      }
                    });
                    employeeSubtotals[day] = dayTotal;
                    employeeGrandTotal += dayTotal;
                  });

                  return (
                    <>
                      {employee.subjects.map((subjectData, subIdx) => {
                        const isFirstRow = subIdx === 0;
                        const isCurrentUserRow = employee.isCurrentUser;

                        return (
                          <tr
                            key={`${empIdx}-${subIdx}`}
                            className={`hover:bg-gray-50 ${isCurrentUserRow ? 'bg-emerald-50' : ''}`}
                          >
                            {isFirstRow && (
                              <td
                                rowSpan={employee.subjects.length}
                                className={`px-2 py-2 whitespace-nowrap z-10 align-top border-r border-gray-300 sticky left-0 ${
                                  isCurrentUserRow ? 'bg-emerald-50' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isCurrentUserRow ? 'text-emerald-700' : ''}`}>
                                    {(() => {
                                      const nameParts = employee.name.split(' ').filter(p => p.trim());
                                      if (nameParts.length === 1) return employee.name;
                                      const firstName = nameParts[0];
                                      const lastName = nameParts[nameParts.length - 1];
                                      return `${firstName} ${lastName}`;
                                    })()}
                                  </span>
                                  {isCurrentUserRow && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                                      VOCE
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                            {hasSubject && (
                              <td className={`px-2 py-2 sticky left-40 z-10 text-sm border-l border-gray-300 ${
                                isCurrentUserRow ? 'bg-emerald-50' : 'bg-white'
                              }`}>
                                <span className="text-gray-700">{subjectData.subject || '(Sem assunto)'}</span>
                              </td>
                            )}
                            {getDaysInMonth().map(day => {
                              const displayValue = subjectData.dailyPoints[day];
                              const isText = typeof displayValue === 'string' && displayValue !== '';
                              const formattedValue = typeof displayValue === 'number' ? formatNumber(displayValue) : displayValue;
                              return (
                                <td
                                  key={day}
                                  className={`px-1 py-1 text-center text-xs ${
                                    isText ? 'bg-yellow-100 text-yellow-800 font-medium' : ''
                                  }`}
                                >
                                  {formattedValue === 0 || (formattedValue !== undefined && formattedValue !== null && formattedValue !== '') ? formattedValue : '-'}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center font-medium bg-gray-100">
                              {formatNumber(subjectData.total)}
                            </td>
                            {showEmployeeTotal && isFirstRow && (
                              <td
                                rowSpan={employee.subjects.length}
                                className="px-2 py-2 text-center font-bold text-blue-900 bg-blue-50 border-l-2 border-blue-300 align-middle"
                              >
                                {formatNumber(employeeGrandTotal)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {showDayTotal && (
                        <tr className="bg-gray-100 border-t border-b-2 border-gray-400 font-semibold">
                          <td className="px-2 py-2 text-right text-xs sticky left-0 bg-gray-100 z-10 border-r border-gray-300">
                            Total Dia
                          </td>
                          {hasSubject && (
                            <td className="px-2 py-2 sticky left-40 bg-gray-100 z-10 border-l border-gray-300"></td>
                          )}
                          {getDaysInMonth().map(day => (
                            <td key={day} className="px-1 py-2 text-center text-xs text-gray-700">
                              {formatNumber(employeeSubtotals[day] || 0)}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center text-xs bg-gray-200">
                            {formatNumber(employeeGrandTotal)}
                          </td>
                          {showEmployeeTotal && (
                            <td className="px-2 py-2 text-center text-xs font-bold text-blue-900 bg-blue-100 border-l-2 border-blue-300">
                              {formatNumber(employeeGrandTotal)}
                            </td>
                          )}
                        </tr>
                      )}
                    </>
                  );
                })}
                <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold">
                  <td className="px-2 py-3 text-left text-sm sticky left-0 bg-blue-50 z-10">
                    Total Geral
                  </td>
                  {hasSubject && (
                    <td className="px-2 py-3 text-left text-sm sticky left-40 bg-blue-50 z-10 border-l border-gray-300"></td>
                  )}
                  {(() => {
                    const dayTotals = getDayTotals(sectionType);
                    return getDaysInMonth().map(day => (
                      <td key={day} className="px-1 py-3 text-center text-sm text-blue-900">
                        {formatNumber(dayTotals[day] || 0)}
                      </td>
                    ));
                  })()}
                  <td className="px-2 py-3 text-center text-sm bg-blue-100">
                    {formatNumber(Object.values(getDayTotals(sectionType)).reduce((sum, val) => sum + val, 0))}
                  </td>
                  {showEmployeeTotal && (
                    <td className="px-2 py-3 text-center text-sm font-bold text-blue-900 bg-blue-200 border-l-2 border-blue-300">
                      {formatNumber(Object.values(getDayTotals(sectionType)).reduce((sum, val) => sum + val, 0))}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 100) return 'text-emerald-600';
    if (productivity >= 90) return 'text-green-600';
    if (productivity >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProductivityBgColor = (productivity: number) => {
    if (productivity >= 100) return 'bg-emerald-500';
    if (productivity >= 90) return 'bg-green-500';
    if (productivity >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRankBadge = (position: number) => {
    if (position === 1) return { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white', icon: '1' };
    if (position === 2) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', text: 'text-gray-800', icon: '2' };
    if (position === 3) return { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', text: 'text-white', icon: '3' };
    return { bg: 'bg-slate-200', text: 'text-slate-700', icon: String(position) };
  };

  const renderDashboard = () => {
    if (!dashboardStats) return null;

    const productivityDiff = dashboardStats.employeeProductivity - dashboardStats.sectorProductivity;
    const isAboveAverage = productivityDiff >= 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sua Produtividade
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Produtividade</p>
                  <p className={`text-4xl font-bold ${getProductivityColor(dashboardStats.employeeProductivity)}`}>
                    {dashboardStats.employeePlanned > 0 ? `${Math.round(dashboardStats.employeeProductivity)}%` : '-'}
                  </p>
                </div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  dashboardStats.employeeRank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                } shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{dashboardStats.employeeRank}º</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Planejado</p>
                  <p className="text-2xl font-bold text-slate-800">{formatNumber(dashboardStats.employeePlanned)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Realizado</p>
                  <p className="text-2xl font-bold text-slate-800">{formatNumber(dashboardStats.employeeRealized)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Comparado ao setor:</span>
                  <span className={`font-semibold ${isAboveAverage ? 'text-green-600' : 'text-red-600'}`}>
                    {isAboveAverage ? '+' : ''}{productivityDiff.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Produtividade do Setor
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Produtividade Media</p>
                  <p className={`text-4xl font-bold ${getProductivityColor(dashboardStats.sectorProductivity)}`}>
                    {dashboardStats.sectorPlanned > 0 ? `${Math.round(dashboardStats.sectorProductivity)}%` : '-'}
                  </p>
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Planejado</p>
                  <p className="text-2xl font-bold text-slate-800">{formatNumber(dashboardStats.sectorPlanned)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Realizado</p>
                  <p className="text-2xl font-bold text-slate-800">{formatNumber(dashboardStats.sectorRealized)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total de colaboradores:</span>
                  <span className="font-semibold text-slate-800">{dashboardStats.totalEmployees}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Ranking de Produtividade
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {dashboardStats.ranking.map((employee, index) => {
                const position = index + 1;
                const badge = getRankBadge(position);
                const shortName = (() => {
                  const parts = employee.employeeName.split(' ').filter(p => p.trim());
                  if (parts.length === 1) return employee.employeeName;
                  return `${parts[0]} ${parts[parts.length - 1]}`;
                })();

                return (
                  <div
                    key={employee.employeeId}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      employee.isCurrentUser
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${badge.bg} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <span className={`font-bold ${badge.text}`}>{badge.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${employee.isCurrentUser ? 'text-blue-800' : 'text-slate-800'}`}>
                          {shortName}
                        </p>
                        {employee.isCurrentUser && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                            VOCE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>Plan: {formatNumber(employee.planned)}</span>
                        <span>Real: {formatNumber(employee.realized)}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${getProductivityColor(employee.productivity)}`}>
                        {employee.planned > 0 ? `${Math.round(employee.productivity)}%` : '-'}
                      </p>
                      <div className="w-24 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getProductivityBgColor(employee.productivity)}`}
                          style={{ width: `${Math.min(employee.productivity, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {fullscreenSection && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            {renderSectionTable(
              fullscreenSection,
              getSectionTypes().indexOf(fullscreenSection),
              true
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Produtividade do Setor</h3>
              <p className="text-xs text-slate-400">Visualize os dados de produtividade do seu setor</p>
            </div>
          </div>

          <div className="flex-1 sm:max-w-xs ml-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedUpload?.id || ''}
                onChange={(e) => {
                  const upload = uploads.find(u => u.id === e.target.value);
                  if (upload) handleUploadSelect(upload);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {uploads.map(upload => (
                  <option key={upload.id} value={upload.id}>
                    {formatMonth(upload.reference_month)}
                    {upload.description ? ` - ${upload.description}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedUpload?.sector && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {selectedUpload.sector.description}
            </span>
          </div>
        )}
      </div>

      {!isLoadingRecords && dashboardStats && renderDashboard()}

      {isLoadingRecords ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-500">Carregando dados...</span>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <p className="text-slate-500">Nenhum registro encontrado para este periodo</p>
        </div>
      ) : (
        <div className="space-y-6">
          {getSectionTypes().map((sectionType, sectionIndex) => renderSectionTable(sectionType, sectionIndex, false))}
        </div>
      )}
    </div>
  );
}
