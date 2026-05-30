import { useState, useEffect, useRef } from 'react';
import { Calendar, TrendingUp, Clock, User, ChevronRight, Sparkles, Cake, Umbrella, Coffee, Camera, Loader2, FileText, Download, ClipboardList, X, Briefcase, UtensilsCrossed, CheckCircle, AlertTriangle, XCircle, Bell, Megaphone, Eye, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EmployeeTimeRecords from './EmployeeTimeRecords';

interface TimeBank {
  balance_minutes: number;
}

interface ProductionStats {
  current_month: number;
  last_month: number;
  average: number;
  productivity_percentage: number | null;
}

interface BirthdayPerson {
  id: string;
  name: string;
  birth_date: string;
  photo_url: string | null;
}

interface VacationInfo {
  next_vacation_start: string | null;
  next_vacation_end: string | null;
  days_until_vacation: number | null;
  vacation_days: number | null;
}

interface DayoffInfo {
  next_dayoff_date: string | null;
  days_until_dayoff: number | null;
}

interface TimeRecordStats {
  totalWorked: number;
  workDays: number;
}

interface ValeAlimentacaoStatus {
  receives: boolean;
  totalLateMinutes: number;
  faltaAtestadoCount: number;
  totalMissingMinutes: number;
  reasons: string[];
}

interface Notice {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  created_by_name: string | null;
  viewed: boolean;
}

export function EmployeeDashboard() {
  const { employeeProfile, refreshProfile, isTerceirizado } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetracking'>('dashboard');
  const [timeBank, setTimeBank] = useState<TimeBank>({
    balance_minutes: 0,
  });
  const [productionStats, setProductionStats] = useState<ProductionStats>({
    current_month: 0,
    last_month: 0,
    average: 0,
    productivity_percentage: null,
  });
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [vacationInfo, setVacationInfo] = useState<VacationInfo>({
    next_vacation_start: null,
    next_vacation_end: null,
    days_until_vacation: null,
    vacation_days: null,
  });
  const [dayoffInfo, setDayoffInfo] = useState<DayoffInfo>({
    next_dayoff_date: null,
    days_until_dayoff: null,
  });
  const [timeRecordStats, setTimeRecordStats] = useState<TimeRecordStats>({
    totalWorked: 0,
    workDays: 0,
  });
  const [valeStatus, setValeStatus] = useState<ValeAlimentacaoStatus>({
    receives: true,
    totalLateMinutes: 0,
    faltaAtestadoCount: 0,
    totalMissingMinutes: 0,
    reasons: [],
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showValeModal, setShowValeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employeeProfile) {
      loadDashboardData();
    }
  }, [employeeProfile]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadTimeBank(),
        loadProductionStats(),
        loadBirthdays(),
        loadVacationAndDayoffInfo(),
        loadTimeRecordStats(),
        loadValeAlimentacaoStatus(),
        loadNotices(),
      ]);
    } catch (error) {
      console.error('Error loading employee dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const loadTimeBank = async () => {
    try {
      if (!employeeProfile?.id) return;

      const { data, error } = await supabase
        .from('time_records')
        .select('balance_hours')
        .eq('employee_id', employeeProfile.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalBalanceHours = data.reduce((sum, record) => sum + (record.balance_hours || 0), 0);
        const balanceMinutes = Math.round(totalBalanceHours * 60);
        setTimeBank({ balance_minutes: balanceMinutes });
      } else {
        setTimeBank({ balance_minutes: 0 });
      }
    } catch (error) {
      console.error('Error loading time bank:', error);
    }
  };

  const loadProductionStats = async () => {
    try {
      if (!employeeProfile?.id) return;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const { data: currentMonthData } = await supabase
        .from('production')
        .select('quantity')
        .eq('employee_id', employeeProfile.id)
        .gte('production_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('production_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      const { data: lastMonthData } = await supabase
        .from('production')
        .select('quantity')
        .eq('employee_id', employeeProfile.id)
        .gte('production_date', `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`)
        .lt('production_date', `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`);

      const { data: allData } = await supabase
        .from('production')
        .select('quantity')
        .eq('employee_id', employeeProfile.id);

      const currentMonthTotal = currentMonthData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const lastMonthTotal = lastMonthData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const allTotal = allData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const average = allData && allData.length > 0 ? Math.round(allTotal / allData.length) : 0;

      let productivityPercentage: number | null = null;

      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const { data: sectorRecords } = await supabase
        .from('sector_productivity_records')
        .select('points, subject')
        .eq('employee_id', employeeProfile.id);

      if (sectorRecords && sectorRecords.length > 0) {
        let planned = 0;
        let realized = 0;

        sectorRecords.forEach(record => {
          const subjectLower = (record.subject || '').toLowerCase();
          if (typeof record.points === 'number') {
            if (subjectLower.includes('planejado')) {
              planned += record.points;
            } else if (subjectLower.includes('realizado')) {
              realized += record.points;
            }
          }
        });

        if (planned > 0) {
          productivityPercentage = Math.round((realized / planned) * 100);
        }
      }

      setProductionStats({
        current_month: currentMonthTotal,
        last_month: lastMonthTotal,
        average,
        productivity_percentage: productivityPercentage,
      });
    } catch (error) {
      console.error('Error loading production stats:', error);
    }
  };

  const loadBirthdays = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const monthStr = String(currentMonth).padStart(2, '0');

      let query = supabase
        .from('employees')
        .select('id, name, birth_date, photo_url, user_type_id')
        .in('status', [0, 1, 2, 3])
        .not('birth_date', 'is', null);

      if (isTerceirizado()) {
        query = query.eq('user_type_id', 4);
      }

      const { data, error } = await query;

      if (error) throw error;

      const birthdaysThisMonth = (data || [])
        .filter(emp => {
          if (!emp.birth_date) return false;
          const birthMonth = emp.birth_date.split('-')[1];
          return birthMonth === monthStr;
        })
        .sort((a, b) => {
          const dayA = parseInt(a.birth_date!.split('-')[2]);
          const dayB = parseInt(b.birth_date!.split('-')[2]);
          return dayA - dayB;
        });

      setBirthdays(birthdaysThisMonth);
    } catch (error) {
      console.error('Error loading birthdays:', error);
    }
  };

  const loadVacationAndDayoffInfo = async () => {
    try {
      if (!employeeProfile?.id) return;

      const { data, error } = await supabase
        .from('employees')
        .select('next_vacation_start, next_vacation_end, next_dayoff_date')
        .eq('id', employeeProfile.id)
        .maybeSingle();

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (data?.next_vacation_start) {
        const vacationStart = new Date(data.next_vacation_start + 'T12:00:00');
        const vacationEnd = data.next_vacation_end ? new Date(data.next_vacation_end + 'T12:00:00') : null;
        const diffTime = vacationStart.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let vacationDays = null;
        if (vacationEnd) {
          vacationDays = Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        setVacationInfo({
          next_vacation_start: data.next_vacation_start,
          next_vacation_end: data.next_vacation_end,
          days_until_vacation: diffDays >= 0 ? diffDays : null,
          vacation_days: vacationDays,
        });
      }

      if (data?.next_dayoff_date) {
        const dayoffDate = new Date(data.next_dayoff_date + 'T12:00:00');
        const diffTime = dayoffDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDayoffInfo({
          next_dayoff_date: data.next_dayoff_date,
          days_until_dayoff: diffDays >= 0 ? diffDays : null,
        });
      }
    } catch (error) {
      console.error('Error loading vacation info:', error);
    }
  };

  const loadTimeRecordStats = async () => {
    try {
      if (!employeeProfile?.id) return;

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('time_records')
        .select('total_hours, record_type')
        .eq('employee_id', employeeProfile.id)
        .gte('record_date', startDate)
        .lte('record_date', endDate);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalWorked = data.reduce((sum, record) => sum + (record.total_hours || 0), 0);
        const workDays = data.filter(record => record.record_type === 'work').length;

        setTimeRecordStats({
          totalWorked,
          workDays,
        });
      } else {
        setTimeRecordStats({
          totalWorked: 0,
          workDays: 0,
        });
      }
    } catch (error) {
      console.error('Error loading time record stats:', error);
    }
  };

  const loadValeAlimentacaoStatus = async () => {
    try {
      if (!employeeProfile?.id) return;

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

      const { data: empData } = await supabase
        .from('employees')
        .select('shift_id')
        .eq('id', employeeProfile.id)
        .maybeSingle();

      let shiftStartMinutes = 8 * 60;
      if (empData?.shift_id) {
        const { data: shiftData } = await supabase
          .from('shift_times')
          .select('start_time')
          .eq('shift_id', empData.shift_id)
          .maybeSingle();

        if (shiftData?.start_time) {
          const [h, m] = shiftData.start_time.split(':').map(Number);
          shiftStartMinutes = h * 60 + m;
        }
      }

      const { data: records, error } = await supabase
        .from('time_records')
        .select('clock_in_1, expected_hours, total_hours, missing_hours, original_record_type')
        .eq('employee_id', employeeProfile.id)
        .gte('record_date', startDate)
        .lte('record_date', endDate);

      if (error) throw error;

      let totalLateMinutes = 0;
      let faltaAtestadoCount = 0;
      let totalMissingMinutes = 0;

      (records || []).forEach(record => {
        const recordType = (record.original_record_type || '').toLowerCase();
        const isAtestado = recordType.includes('atestado');
        const hasFaltaSemJustificativa = recordType.includes('falta sem justificativa');

        if (record.clock_in_1 && record.expected_hours > 0) {
          const [hours, minutes] = record.clock_in_1.split(':').map(Number);
          const entryMinutes = hours * 60 + minutes;
          const delay = entryMinutes - shiftStartMinutes;
          if (delay > 0) {
            totalLateMinutes += delay;
          }
        }

        if (hasFaltaSemJustificativa || isAtestado) {
          faltaAtestadoCount += 1;
        }

        let missingHours = record.missing_hours || 0;
        if (!missingHours && record.expected_hours > 0 && record.total_hours > 0 && record.total_hours < record.expected_hours) {
          missingHours = record.expected_hours - record.total_hours;
        }
        if (missingHours > 0) {
          totalMissingMinutes += missingHours * 60;
        }
      });

      const reasons: string[] = [];
      if (totalLateMinutes > 31) {
        reasons.push(`Atrasos acumulados: ${Math.round(totalLateMinutes)} minutos (limite: 31 min)`);
      }
      if (faltaAtestadoCount > 1) {
        reasons.push(`Faltas/Atestados: ${faltaAtestadoCount} ocorrencias (limite: 1)`);
      }
      if (totalMissingMinutes > 31) {
        reasons.push(`Horas faltantes acumuladas: ${Math.round(totalMissingMinutes)} minutos (limite: 31 min)`);
      }

      setValeStatus({
        receives: reasons.length === 0,
        totalLateMinutes,
        faltaAtestadoCount,
        totalMissingMinutes,
        reasons,
      });
    } catch (error) {
      console.error('Error loading vale alimentacao status:', error);
    }
  };

  const loadNotices = async () => {
    try {
      if (!employeeProfile?.id) return;

      const { data: noticesData, error } = await supabase
        .from('notices')
        .select('id, title, description, file_url, file_name, created_at, created_by')
        .eq('status', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!noticesData || noticesData.length === 0) {
        setNotices([]);
        return;
      }

      const creatorIds = [...new Set(noticesData.map(n => n.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('employees')
          .select('auth_user_id, name')
          .in('auth_user_id', creatorIds);
        if (creators) {
          creatorsMap = Object.fromEntries(creators.map(c => [c.auth_user_id, c.name]));
        }
      }

      const noticeIds = noticesData.map(n => n.id);
      const { data: viewsData } = await supabase
        .from('notice_views')
        .select('notice_id')
        .eq('employee_id', employeeProfile.id)
        .in('notice_id', noticeIds);

      const viewedSet = new Set((viewsData || []).map(v => v.notice_id));

      setNotices(noticesData.map(n => ({
        id: n.id,
        title: n.title,
        description: n.description,
        file_url: n.file_url,
        file_name: n.file_name,
        created_at: n.created_at,
        created_by_name: n.created_by ? (creatorsMap[n.created_by] || null) : null,
        viewed: viewedSet.has(n.id),
      })));
    } catch (error) {
      console.error('Error loading notices:', error);
    }
  };

  const markNoticeAsViewed = async (notice: Notice) => {
    setSelectedNotice(notice);
    if (!notice.viewed && employeeProfile?.id) {
      try {
        await supabase
          .from('notice_views')
          .upsert(
            { notice_id: notice.id, employee_id: employeeProfile.id },
            { onConflict: 'notice_id,employee_id' }
          );
        setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, viewed: true } : n));
      } catch (error) {
        console.error('Error marking notice as viewed:', error);
      }
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !employeeProfile?.id) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione uma imagem JPG, PNG ou WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no maximo 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `employees/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: publicUrl })
        .eq('id', employeeProfile.id);

      if (updateError) throw updateError;

      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao enviar foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFirstAndSecondName = () => {
    if (!employeeProfile?.full_name) return 'Colaborador';
    const names = employeeProfile.full_name.split(' ');
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const [year, month, day] = birthDate.split('-').map(Number);
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() + 1 - month;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const formatBirthday = (birthDate: string) => {
    const [, month, day] = birthDate.split('-').map(Number);
    const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${String(day).padStart(2, '0')} de ${months[month - 1]}`;
  };

  const formatHoursBalance = (totalMinutes: number): string => {
    const isNegative = totalMinutes < 0;
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const sign = isNegative ? '-' : '+';
    return `${sign}${hours}:${String(minutes).padStart(2, '0')}`;
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
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 pt-6 pb-24 md:pb-16 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-full"
              >
                {employeeProfile?.photo_url ? (
                  <img
                    src={employeeProfile.photo_url}
                    alt={employeeProfile.full_name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-white/20 shadow-xl transition-all group-hover:ring-white/40"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-white/20 shadow-xl transition-all group-hover:ring-white/40">
                    <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                )}
                <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center pointer-events-none">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-sm md:text-base font-medium">{getGreeting()},</p>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">{getFirstAndSecondName()}!</h1>
              <p className="text-slate-300 text-xs md:text-sm mt-0.5 truncate">{employeeProfile?.position_name || 'Colaborador'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-16 md:-mt-10 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-4 overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 min-w-[100px] px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
                  activeTab === 'dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden xs:inline">Painel</span>
              </button>
              <button
                onClick={() => setActiveTab('timetracking')}
                className={`flex-1 min-w-[120px] px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
                  activeTab === 'timetracking'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Registro de Ponto</span>
                <span className="sm:hidden">Ponto</span>
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-500/10 p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${
                    timeBank.balance_minutes > 0 ? 'text-emerald-600' : timeBank.balance_minutes < 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}>
                    {formatHoursBalance(timeBank.balance_minutes)}
                    <span className="text-base text-slate-400 ml-1">hrs</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Banco de Horas</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-purple-500/10 p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {timeRecordStats.workDays}
                    <span className="text-base text-slate-400 ml-1">dias</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Dias Trabalhados</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-cyan-500/10 p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {timeRecordStats.totalWorked.toFixed(1)}
                    <span className="text-base text-slate-400">h</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Horas Trabalhadas</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg shadow-green-500/10 p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${
                    productionStats.productivity_percentage !== null
                      ? productionStats.productivity_percentage >= 100
                        ? 'text-emerald-600'
                        : productionStats.productivity_percentage >= 80
                        ? 'text-amber-600'
                        : 'text-rose-600'
                      : 'text-slate-800'
                  }`}>
                    {productionStats.productivity_percentage !== null
                      ? `${productionStats.productivity_percentage}%`
                      : productionStats.current_month || '-'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Produtividade do Mes</p>
                </div>
              </div>

              <button
                onClick={() => !valeStatus.receives && setShowValeModal(true)}
                className={`mt-4 w-full rounded-2xl shadow-lg p-4 border text-left transition-all ${
                  valeStatus.receives
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 cursor-default'
                    : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:shadow-xl cursor-pointer active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    valeStatus.receives
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30'
                      : 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30'
                  }`}>
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium">Vale-Alimentacao</p>
                    <p className={`text-lg font-bold ${valeStatus.receives ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {valeStatus.receives ? 'Liberado' : 'Bloqueado'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {valeStatus.receives ? (
                      <CheckCircle className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <>
                        <XCircle className="w-7 h-7 text-orange-500" />
                        <ChevronRight className="w-5 h-5 text-orange-400" />
                      </>
                    )}
                  </div>
                </div>
                {!valeStatus.receives && (
                  <p className="text-xs text-orange-500 mt-2 ml-16">Toque para ver os motivos</p>
                )}
              </button>

              {notices.length > 0 && (
                <div className="mt-4">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Megaphone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">Quadro de Avisos</h3>
                        <p className="text-xs text-slate-400">Comunicados da empresa</p>
                      </div>
                      {notices.filter(n => !n.viewed).length > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                          {notices.filter(n => !n.viewed).length} {notices.filter(n => !n.viewed).length === 1 ? 'novo' : 'novos'}
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                      {notices.map(notice => (
                        <button
                          key={notice.id}
                          onClick={() => markNoticeAsViewed(notice)}
                          className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-all hover:bg-slate-50 active:bg-slate-100 ${
                            !notice.viewed ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            !notice.viewed ? 'bg-blue-500' : 'bg-slate-200'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate ${!notice.viewed ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                {notice.title}
                              </p>
                              {notice.file_url && (
                                <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{notice.description}</p>
                            <p className="text-[10px] text-slate-300 mt-1">
                              {new Date(notice.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {notice.created_by_name && ` - ${notice.created_by_name}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(vacationInfo.next_vacation_start || dayoffInfo.next_dayoff_date) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dayoffInfo.next_dayoff_date && dayoffInfo.days_until_dayoff !== null && (
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <Coffee className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-teal-100 text-sm">Próxima Folga</p>
                          <p className="font-bold text-lg">
                            {new Date(dayoffInfo.next_dayoff_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{dayoffInfo.days_until_dayoff}</p>
                          <p className="text-teal-100 text-xs">dias</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vacationInfo.next_vacation_start && vacationInfo.days_until_vacation !== null && (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <Umbrella className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-amber-100 text-sm">Próximas Férias</p>
                          <p className="font-bold text-lg">
                            {new Date(vacationInfo.next_vacation_start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            {vacationInfo.next_vacation_end && (
                              <> - {new Date(vacationInfo.next_vacation_end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{vacationInfo.days_until_vacation}</p>
                          <p className="text-amber-100 text-xs">dias</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {birthdays.length > 0 && (
                <div className="mt-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-pink-100 p-2 rounded-lg">
                        <Cake className="w-6 h-6 text-pink-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Aniversariantes do Mes</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {birthdays.map((person) => (
                        <div key={person.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg hover:shadow-md transition-shadow">
                          <div className="w-14 h-14 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {person.photo_url ? (
                              <img
                                src={person.photo_url}
                                alt={person.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-pink-700">
                                {person.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{person.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatBirthday(person.birth_date)} - {calculateAge(person.birth_date)} anos
                            </p>
                          </div>
                          <Cake className="w-7 h-7 text-pink-500 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'timetracking' && (
            <EmployeeTimeRecords />
          )}


        </div>
      </div>

      {showValeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowValeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Vale-Alimentacao</h3>
                    <p className="text-orange-100 text-xs sm:text-sm">Motivos da perda</p>
                  </div>
                </div>
                <button onClick={() => setShowValeModal(false)} className="w-11 h-11 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {valeStatus.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700 font-medium">{reason}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  O vale-alimentacao e suspenso quando os atrasos acumulados ultrapassam 31 minutos,
                  quando ha mais de 1 falta/atestado, ou quando as horas faltantes acumuladas excedem 31 minutos no mes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNotice(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold truncate">{selectedNotice.title}</h3>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      {new Date(selectedNotice.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {selectedNotice.created_by_name && ` - ${selectedNotice.created_by_name}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedNotice(null)} className="w-11 h-11 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{selectedNotice.description}</p>
              </div>
              {selectedNotice.file_url && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <a
                    href={selectedNotice.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-sm font-medium"
                  >
                    <Paperclip className="w-4 h-4" />
                    {selectedNotice.file_name || 'Anexo'}
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
