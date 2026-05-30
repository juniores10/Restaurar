import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Cake, Bell, Users, TrendingUp, UserCheck, Plane, UserX, Ban, UserMinus, X, FileText, MessageSquare, Eye, Check, CheckCheck, ChevronLeft, ChevronRight, Palmtree, AlertTriangle, Clock, Activity, RotateCcw, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SystemOverviewCards } from './SystemOverviewCards';
import { DraggableDashboardSection } from './DraggableDashboardSection';
import { useDashboardOrder } from '../hooks/useDashboardOrder';
import { productionService } from '../services/productionService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import type { ParsedEmployee, AbsenteeismRecord } from '../types/absenteeism';
import {
  calculateOverallMetrics,
  calculateTrendData,
  calculateParetoData,
  detectAlerts,
  formatHours,
  convertFromAbsenteeismRecords,
} from '../utils/absenteeismMetrics';

interface Employee {
  id: string;
  name: string;
  birth_date: string;
  photo_url: string;
}

interface VacationEmployee {
  id: string;
  name: string;
  photo_url: string;
  next_vacation_start: string;
  next_vacation_end: string;
  department?: { description: string };
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  employee_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
  employee?: {
    name: string;
    photo_url: string;
  };
}

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  birthdaysThisMonth: number;
  unreadNotifications: number;
}

interface StatusCounts {
  active: number;
  vacation: number;
  suspended: number;
  away: number;
  terminated: number;
}

interface MainDashboardProps {
  showNoticesPanel?: boolean;
  onCloseNoticesPanel?: () => void;
  onOpenNoticesPanel?: () => void;
  onNavigate?: (view: string) => void;
}

export function MainDashboard({ showNoticesPanel = false, onCloseNoticesPanel, onOpenNoticesPanel, onNavigate }: MainDashboardProps) {
  const { isTerceirizado, selectedBranch } = useAuth();
  const [birthdays, setBirthdays] = useState<Employee[]>([]);
  const [allEmployeesWithBirthday, setAllEmployeesWithBirthday] = useState<Employee[]>([]);
  const [vacationEmployees, setVacationEmployees] = useState<VacationEmployee[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [birthdayMonthOffset, setBirthdayMonthOffset] = useState(0);
  const [vacationMonthOffset, setVacationMonthOffset] = useState(0);
  const [allVacationEmployees, setAllVacationEmployees] = useState<VacationEmployee[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEmployees: 0,
    birthdaysThisMonth: 0,
    unreadNotifications: 0,
  });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    active: 0,
    vacation: 0,
    suspended: 0,
    away: 0,
    terminated: 0,
  });
  const [maintenanceStats, setMaintenanceStats] = useState({ open: 0, total: 0, completed: 0 });
  const [absenteeismEmployees, setAbsenteeismEmployees] = useState<ParsedEmployee[]>([]);
  const [productionAlerts, setProductionAlerts] = useState<string[]>([]);
  const [absenteeismAlerts, setAbsenteeismAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  const { order, moveCard, resetOrder, isCustomOrder } = useDashboardOrder();

  useEffect(() => {
    loadDashboardData();
  }, [selectedBranch?.id]);

  useEffect(() => {
    if (showNoticesPanel) {
      loadNotifications();
    }
  }, [showNoticesPanel]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadBirthdays(),
        loadNotifications(),
        loadStats(),
        loadStatusCounts(),
        loadVacationEmployees(),
        loadAbsenteeismData(),
        loadProductionAlerts(),
        loadMaintenanceStats(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBirthdays = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;

      let query = supabase
        .from('employees')
        .select('id, name, birth_date, photo_url')
        .in('status', [0, 1, 2, 3])
        .not('birth_date', 'is', null)
        .neq('user_type_id', 1);

      if (selectedBranch) query = query.eq('location_id', selectedBranch.id);

      const { data, error } = await query;

      if (error) throw error;

      setAllEmployeesWithBirthday(data || []);

      const monthStr = String(currentMonth).padStart(2, '0');
      const birthdaysThisMonth = (data || []).filter(emp => {
        if (!emp.birth_date) return false;
        const birthMonth = emp.birth_date.split('-')[1];
        return birthMonth === monthStr;
      }).sort((a, b) => {
        const dayA = parseInt(a.birth_date.split('-')[2]);
        const dayB = parseInt(b.birth_date.split('-')[2]);
        return dayA - dayB;
      });

      setBirthdays(birthdaysThisMonth);
    } catch (error) {
      console.error('Error loading birthdays:', error);
    }
  };

  const loadVacationEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('id, name, photo_url, next_vacation_start, next_vacation_end, department:data_types!employees_department_id_fkey(description)')
        .in('status', [0, 1, 2, 3])
        .not('next_vacation_start', 'is', null)
        .neq('user_type_id', 1)
        .order('next_vacation_start', { ascending: true });

      if (selectedBranch) query = query.eq('location_id', selectedBranch.id);

      const { data, error } = await query;

      if (error) throw error;
      setAllVacationEmployees(data || []);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const filtered = (data || []).filter(emp => {
        return emp.next_vacation_start <= monthEnd && emp.next_vacation_end >= monthStart;
      });

      setVacationEmployees(filtered);
    } catch (error) {
      console.error('Error loading vacation employees:', error);
    }
  };

  const loadAbsenteeismData = async () => {
    try {
      const { data: uploads } = await supabase
        .from('absenteeism_uploads')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!uploads || uploads.length === 0) {
        setAbsenteeismEmployees([]);
        return;
      }

      const uploadIds = uploads.map(u => u.id);

      const { data: records, error } = await supabase
        .from('absenteeism_records')
        .select('*')
        .in('upload_id', uploadIds);

      if (!error && records) {
        const parsedEmployees = convertFromAbsenteeismRecords(records as AbsenteeismRecord[]);
        setAbsenteeismEmployees(parsedEmployees);
        const alerts = detectAlerts(parsedEmployees, { targetRate: 3, alertThreshold: 20 });
        setAbsenteeismAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading absenteeism data:', error);
    }
  };

  const loadProductionAlerts = async () => {
    try {
      const data = await productionService.getProductionData();
      const alerts = productionService.getAlerts(data);
      setProductionAlerts(alerts);
    } catch (error) {
      console.error('Error loading production alerts:', error);
    }
  };

  const loadMaintenanceStats = async () => {
    try {
      const { count: total } = await supabase
        .from('maintenance_orders')
        .select('*', { count: 'exact', head: true });

      const { count: open } = await supabase
        .from('maintenance_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Aberto', 'Em Andamento', 'Aguardando Peça']);

      const { count: completed } = await supabase
        .from('maintenance_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Concluído');

      setMaintenanceStats({
        total: total || 0,
        open: open || 0,
        completed: completed || 0,
      });
    } catch (error) {
      console.error('Error loading maintenance stats:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select(`
          id, type, title, message, employee_id, reference_id, reference_type, is_read, created_at,
          employee:employees(name, photo_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadStats = async () => {
    try {
      let q1 = supabase.from('employees').select('*', { count: 'exact', head: true }).neq('user_type_id', 1);
      let q2 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 0).neq('user_type_id', 1);
      let q3 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 2).neq('user_type_id', 1);
      let q4 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 3).neq('user_type_id', 1);
      let q5 = supabase.from('employees').select('birth_date, status').in('status', [0, 1, 2, 3]).not('birth_date', 'is', null).neq('user_type_id', 1);

      if (selectedBranch) {
        q1 = q1.eq('location_id', selectedBranch.id);
        q2 = q2.eq('location_id', selectedBranch.id);
        q3 = q3.eq('location_id', selectedBranch.id);
        q4 = q4.eq('location_id', selectedBranch.id);
        q5 = q5.eq('location_id', selectedBranch.id);
      }

      const { count: totalEmployees } = await q1;
      const { count: activeOnly } = await q2;
      const { count: suspended } = await q3;
      const { count: away } = await q4;

      const activeEmployees = (activeOnly || 0) + (suspended || 0) + (away || 0);

      const { count: unreadNotifications } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      const currentMonth = new Date().getMonth() + 1;
      const { data: allEmployees } = await q5;

      const monthStr = String(currentMonth).padStart(2, '0');
      const birthdaysThisMonth = (allEmployees || []).filter(emp => {
        if (!emp.birth_date) return false;
        const birthMonth = emp.birth_date.split('-')[1];
        return birthMonth === monthStr;
      }).length;

      setStats({
        totalEmployees: totalEmployees || 0,
        activeEmployees,
        birthdaysThisMonth,
        unreadNotifications: unreadNotifications || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadStatusCounts = async () => {
    try {
      let q1 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 0).neq('user_type_id', 1);
      let q2 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 1).neq('user_type_id', 1);
      let q3 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 2).neq('user_type_id', 1);
      let q4 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 3).neq('user_type_id', 1);
      let q5 = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 4).neq('user_type_id', 1);

      if (selectedBranch) {
        q1 = q1.eq('location_id', selectedBranch.id);
        q2 = q2.eq('location_id', selectedBranch.id);
        q3 = q3.eq('location_id', selectedBranch.id);
        q4 = q4.eq('location_id', selectedBranch.id);
        q5 = q5.eq('location_id', selectedBranch.id);
      }

      const { count: activeOnly } = await q1;
      const { count: vacation } = await q2;
      const { count: suspended } = await q3;
      const { count: away } = await q4;
      const { count: terminated } = await q5;

      const activeCount = (activeOnly || 0) + (suspended || 0) + (away || 0);

      setStatusCounts({
        active: activeCount,
        vacation: vacation || 0,
        suspended: suspended || 0,
        away: away || 0,
        terminated: terminated || 0,
      });
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setStats(prev => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setStats(prev => ({ ...prev, unreadNotifications: 0 }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    onCloseNoticesPanel?.();

    let targetView = '';
    switch (notification.type) {
      case 'submission':
        targetView = 'documents';
        break;
      case 'suggestion':
        targetView = 'suggestions';
        break;
      case 'notice_view':
        targetView = 'notices';
        break;
      case 'document_read':
        targetView = 'documents';
        break;
      case 'maintenance_order':
        targetView = 'factory-maintenance';
        if (notification.reference_id) {
          sessionStorage.setItem('maintenance_open_order_id', notification.reference_id);
        }
        break;
      default:
        targetView = 'dashboard';
    }

    if (onNavigate && targetView) {
      onNavigate(targetView);
    }
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

  const getMonthName = (offset: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return months[date.getMonth()];
  };

  const canGoToPreviousMonth = (offset: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const targetDate = new Date();
    targetDate.setDate(1);
    targetDate.setMonth(today.getMonth() + offset - 1);
    return targetDate.getFullYear() >= currentYear;
  };

  const getFilteredBirthdays = () => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + birthdayMonthOffset);
    const targetMonth = String(date.getMonth() + 1).padStart(2, '0');

    return allEmployeesWithBirthday
      .filter(emp => {
        if (!emp.birth_date) return false;
        const birthMonth = emp.birth_date.split('-')[1];
        return birthMonth === targetMonth;
      })
      .sort((a, b) => {
        const dayA = parseInt(a.birth_date.split('-')[2]);
        const dayB = parseInt(b.birth_date.split('-')[2]);
        return dayA - dayB;
      });
  };

  const formatVacationPeriod = (start: string, end: string) => {
    const startDate = new Date(start + 'T12:00:00');
    const endDate = new Date(end + 'T12:00:00');
    const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${formatDate(startDate)} a ${formatDate(endDate)}`;
  };

  const calculateVacationDays = (start: string, end: string) => {
    const startDate = new Date(start + 'T12:00:00');
    const endDate = new Date(end + 'T12:00:00');
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getFilteredVacations = () => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + vacationMonthOffset);
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const monthStart = new Date(targetYear, targetMonth, 1).toISOString().split('T')[0];
    const monthEnd = new Date(targetYear, targetMonth + 1, 0).toISOString().split('T')[0];

    return allVacationEmployees.filter(emp => {
      return emp.next_vacation_start <= monthEnd && emp.next_vacation_end >= monthStart;
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
    return date.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-5 h-5" />;
      case 'suggestion':
        return <MessageSquare className="w-5 h-5" />;
      case 'notice_view':
      case 'document_read':
        return <Eye className="w-5 h-5" />;
      case 'maintenance_order':
        return <Wrench className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submission':
        return 'from-blue-500 to-blue-600';
      case 'suggestion':
        return 'from-emerald-500 to-emerald-600';
      case 'notice_view':
        return 'from-orange-500 to-orange-600';
      case 'document_read':
        return 'from-teal-500 to-teal-600';
      case 'maintenance_order':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-slate-50';
    switch (type) {
      case 'submission':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'suggestion':
        return 'bg-emerald-50 border-l-4 border-emerald-500';
      case 'notice_view':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'document_read':
        return 'bg-teal-50 border-l-4 border-teal-500';
      case 'maintenance_order':
        return 'bg-amber-50 border-l-4 border-amber-500';
      default:
        return 'bg-slate-50';
    }
  };

  const absenteeismMetrics = useMemo(
    () => absenteeismEmployees.length > 0 ? calculateOverallMetrics(absenteeismEmployees) : null,
    [absenteeismEmployees]
  );

  const absenteeismTrendData = useMemo(
    () => absenteeismEmployees.length > 0 ? calculateTrendData(absenteeismEmployees, 'week') : [],
    [absenteeismEmployees]
  );

  const absenteeismParetoData = useMemo(
    () => absenteeismEmployees.length > 0 ? calculateParetoData(absenteeismEmployees) : [],
    [absenteeismEmployees]
  );

  const absenteeismTypeDistribution = useMemo(() => {
    if (!absenteeismMetrics) return [];
    const COLORS = {
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      purple: '#8B5CF6',
      secondary: '#00A3E0',
    };
    return [
      { name: 'Saude', value: absenteeismMetrics.byType.saude.hours, color: COLORS.success },
      { name: 'Injustificada', value: absenteeismMetrics.byType.injustificada.hours, color: COLORS.danger },
      { name: 'Atraso', value: absenteeismMetrics.byType.atraso.hours, color: COLORS.warning },
      { name: 'Licenca', value: absenteeismMetrics.byType.licenca.hours, color: COLORS.purple },
      { name: 'Outros', value: absenteeismMetrics.byType.outros.hours, color: COLORS.secondary },
    ].filter(item => item.value > 0);
  }, [absenteeismMetrics]);

  const sectionVisibility: Record<string, boolean> = {
    'system-overview': !isTerceirizado(),
    'production-alerts': !isTerceirizado() && productionAlerts.length > 0,
    'absenteeism-alerts': !isTerceirizado() && absenteeismAlerts.length > 0,
    'employee-status': !isTerceirizado(),
    'maintenance-stats': !isTerceirizado(),
    'absenteeism-metrics': !!absenteeismMetrics,
    'birthdays': true,
    'vacations': !isTerceirizado(),
  };

  const visibleOrder = order.filter(id => sectionVisibility[id]);

  const handleMoveUp = (sectionId: string) => {
    const vIdx = visibleOrder.indexOf(sectionId);
    if (vIdx > 0) {
      const targetId = visibleOrder[vIdx - 1];
      moveCard(order.indexOf(sectionId), order.indexOf(targetId));
    }
  };

  const handleMoveDown = (sectionId: string) => {
    const vIdx = visibleOrder.indexOf(sectionId);
    if (vIdx < visibleOrder.length - 1) {
      const targetId = visibleOrder[vIdx + 1];
      moveCard(order.indexOf(sectionId), order.indexOf(targetId));
    }
  };

  const handleDrop = (targetId: string) => {
    if (dragItemRef.current && dragItemRef.current !== targetId) {
      moveCard(order.indexOf(dragItemRef.current), order.indexOf(targetId));
    }
    dragItemRef.current = null;
    setDraggingId(null);
  };

  const sectionProps = (sectionId: string) => ({
    sectionId,
    order: visibleOrder.indexOf(sectionId),
    isFirst: visibleOrder[0] === sectionId,
    isLast: visibleOrder[visibleOrder.length - 1] === sectionId,
    onMoveUp: () => handleMoveUp(sectionId),
    onMoveDown: () => handleMoveDown(sectionId),
    onDragStart: () => { dragItemRef.current = sectionId; setDraggingId(sectionId); },
    onDrop: () => handleDrop(sectionId),
    onDragEnd: () => { dragItemRef.current = null; setDraggingId(null); },
    isDragging: draggingId === sectionId,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Gerencial</h2>
          <p className="text-gray-600 mt-2">Visao geral do sistema</p>
        </div>
        {isCustomOrder && (
          <button
            onClick={resetOrder}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Restaurar ordem original"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restaurar ordem</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 md:gap-8">

      {!isTerceirizado() && (
        <DraggableDashboardSection {...sectionProps('system-overview')}>
          <SystemOverviewCards />
        </DraggableDashboardSection>
      )}

      {!isTerceirizado() && productionAlerts.length > 0 && (
        <DraggableDashboardSection {...sectionProps('production-alerts')}>
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Alertas Automaticos</h3>
              <p className="text-sm text-gray-500">Ultimos 30 dias de producao</p>
            </div>
            <span className="ml-auto bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1 rounded-full">
              {productionAlerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {productionAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{alert}</span>
              </div>
            ))}
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      {!isTerceirizado() && absenteeismAlerts.length > 0 && (
        <DraggableDashboardSection {...sectionProps('absenteeism-alerts')}>
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Alertas de Absenteismo</h3>
              <p className="text-sm text-gray-500">Baseado nos ultimos dados carregados</p>
            </div>
            <span className="ml-auto bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">
              {absenteeismAlerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {absenteeismAlerts.map((alert, index) => {
              const isUrgent = alert.toLowerCase().includes('urgente') || alert.toLowerCase().includes('atencao necessaria') || alert.toLowerCase().includes('atenção necessária');
              const isPositive = alert.toLowerCase().includes('reducao') || alert.toLowerCase().includes('diminuiram');
              const isTeamAlert = alert.toLowerCase().includes('equipe');

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:shadow-md ${
                    isUrgent
                      ? 'bg-red-50 border-red-200'
                      : isPositive
                      ? 'bg-green-50 border-green-200'
                      : isTeamAlert
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isUrgent
                      ? 'bg-red-500'
                      : isPositive
                      ? 'bg-green-500'
                      : isTeamAlert
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}>
                    {isUrgent ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    ) : isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-white rotate-180" />
                    ) : isTeamAlert ? (
                      <Users className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${
                    isUrgent
                      ? 'text-red-800'
                      : isPositive
                      ? 'text-green-800'
                      : isTeamAlert
                      ? 'text-blue-800'
                      : 'text-amber-800'
                  }`}>{alert}</span>
                </div>
              );
            })}
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      {!isTerceirizado() && (
        <DraggableDashboardSection {...sectionProps('employee-status')}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Status dos Colaboradores</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-gray-700">Ativos</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{statusCounts.active}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <Plane className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-700">Em Ferias</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">{statusCounts.vacation}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center gap-3 mb-2">
                <UserX className="w-6 h-6 text-yellow-600" />
                <span className="font-semibold text-gray-700">Afastados</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{statusCounts.away}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-2">
                <Ban className="w-6 h-6 text-orange-600" />
                <span className="font-semibold text-gray-700">Suspensos</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-700">{statusCounts.suspended}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center gap-3 mb-2">
                <UserMinus className="w-6 h-6 text-red-600" />
                <span className="font-semibold text-gray-700">Desligados</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-700">{statusCounts.terminated}</p>
            </div>
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      {!isTerceirizado() && (
        <DraggableDashboardSection {...sectionProps('maintenance-stats')}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Manutencao Fabrica</h3>
                <p className="text-sm text-gray-500">Chamados de manutencao</p>
              </div>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('factory-maintenance')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
              >
                Ver todos
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 sm:p-5 border border-red-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-100/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-red-700">Em Aberto</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-red-700">{maintenanceStats.open}</p>
                {maintenanceStats.open > 0 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">Aguardando resolucao</p>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Total</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-slate-700">{maintenanceStats.total}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Chamados registrados</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700">Concluidos</span>
                </div>
                <p className="text-4xl font-bold text-emerald-700">{maintenanceStats.completed}</p>
                {maintenanceStats.total > 0 && (
                  <p className="text-xs text-emerald-500 mt-2 font-medium">
                    {Math.round((maintenanceStats.completed / maintenanceStats.total) * 100)}% resolvidos
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      {absenteeismMetrics && (
        <DraggableDashboardSection {...sectionProps('absenteeism-metrics')}>
        <div className="space-y-6 md:space-y-8">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Metricas de Absenteismo</h3>
                  <p className="text-amber-100 text-sm">Ultimos dados carregados</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-sm text-amber-100">Taxa de Absenteismo</span>
                </div>
                <p className="text-3xl font-bold text-white">{absenteeismMetrics.absenteeismRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="text-sm text-amber-100">Horas Perdidas</span>
                </div>
                <p className="text-3xl font-bold text-white">{formatHours(absenteeismMetrics.computableHours)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-white" />
                  <span className="text-sm text-amber-100">Frequencia</span>
                </div>
                <p className="text-3xl font-bold text-white">{absenteeismMetrics.frequency}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-white" />
                  <span className="text-sm text-amber-100">% Injustificada</span>
                </div>
                <p className="text-3xl font-bold text-white">{absenteeismMetrics.injustifiedPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Tipo</h3>
              <div className="h-72 flex items-center justify-center">
                {absenteeismTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={absenteeismTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {absenteeismTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatHours(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500">Nenhum dado de ausência</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Tendência Semanal</h3>
              <div className="h-56 sm:h-64 md:h-72">
                {absenteeismTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={absenteeismTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => value.toFixed(1)}
                      />
                      <Legend />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="absentHours"
                        name="Horas Perdidas"
                        fill="#EF4444"
                        fillOpacity={0.1}
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="absenteeismRate"
                        name="Taxa (%)"
                        stroke="#005A8F"
                        strokeWidth={3}
                        dot={{ fill: '#005A8F', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Sem dados de tendência</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Pareto de Motivos</h3>
              <div className="h-56 sm:h-64 md:h-72">
                {absenteeismParetoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={absenteeismParetoData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="reason"
                        tick={{ fontSize: 10 }}
                        stroke="#6B7280"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        stroke="#6B7280"
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Horas') {
                            return [value.toFixed(1), name];
                          }
                          if (name === 'Acumulado %') {
                            return [`${value.toFixed(1)}%`, name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="hours"
                        name="Horas"
                        fill="#00A3E0"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulative"
                        name="Acumulado %"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ fill: '#EF4444' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Nenhum motivo identificado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      <DraggableDashboardSection {...sectionProps('birthdays')}>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 p-2 rounded-lg">
              <Cake className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Aniversariantes</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBirthdayMonthOffset(prev => prev - 1)}
              disabled={!canGoToPreviousMonth(birthdayMonthOffset)}
              className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-pink-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-lg min-w-[120px] text-center">
              {getMonthName(birthdayMonthOffset)}
            </span>
            <button
              onClick={() => setBirthdayMonthOffset(prev => prev + 1)}
              className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {birthdayMonthOffset !== 0 && (
              <button
                onClick={() => setBirthdayMonthOffset(0)}
                className="px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              >
                Hoje
              </button>
            )}
          </div>
        </div>

        {getFilteredBirthdays().length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum aniversariante em {getMonthName(birthdayMonthOffset)}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredBirthdays().map((employee) => (
              <div key={employee.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {employee.photo_url ? (
                    <img
                      src={employee.photo_url}
                      alt={employee.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-pink-700">
                      {employee.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{employee.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatBirthday(employee.birth_date)} - {calculateAge(employee.birth_date)} anos
                  </p>
                </div>
                <Cake className="w-7 h-7 text-pink-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
      </DraggableDashboardSection>

      {!isTerceirizado() && (
        <DraggableDashboardSection {...sectionProps('vacations')}>
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-2xl shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Palmtree className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Ferias</h3>
                  <p className="text-teal-100 text-sm">
                    {getFilteredVacations().length} colaborador{getFilteredVacations().length !== 1 ? 'es' : ''} em ferias
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVacationMonthOffset(prev => prev - 1)}
                  disabled={!canGoToPreviousMonth(vacationMonthOffset)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-white/25 text-white font-semibold rounded-lg min-w-[120px] text-center">
                  {getMonthName(vacationMonthOffset)}
                </span>
                <button
                  onClick={() => setVacationMonthOffset(prev => prev + 1)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {vacationMonthOffset !== 0 && (
                  <button
                    onClick={() => setVacationMonthOffset(0)}
                    className="px-3 py-2 text-sm text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    Hoje
                  </button>
                )}
              </div>
            </div>
            {getFilteredVacations().length === 0 ? (
              <div className="bg-white/10 rounded-xl p-8 text-center">
                <Palmtree className="w-12 h-12 text-white/50 mx-auto mb-3" />
                <p className="text-white/80">Nenhum colaborador em ferias em {getMonthName(vacationMonthOffset)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {getFilteredVacations().map((employee) => (
                  <div key={employee.id} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                        {employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={employee.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {employee.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{employee.name}</p>
                        {employee.department && (
                          <p className="text-xs text-teal-100 truncate">{employee.department.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-teal-200" />
                          <span className="text-sm text-teal-100">
                            {formatVacationPeriod(employee.next_vacation_start, employee.next_vacation_end)}
                          </span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                            {calculateVacationDays(employee.next_vacation_start, employee.next_vacation_end)} dias
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </DraggableDashboardSection>
      )}

      </div>

      {showNoticesPanel && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCloseNoticesPanel} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[90vw] sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">Notificações</h3>
                  {stats.unreadNotifications > 0 && (
                    <p className="text-xs text-orange-100">{stats.unreadNotifications} não lidas</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stats.unreadNotifications > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onCloseNoticesPanel}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <Bell className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-center font-medium">Nenhuma notificacao</p>
                  <p className="text-sm text-center mt-1">Quando colaboradores enviarem documentos, sugestoes ou visualizarem avisos, as notificacoes aparecerao aqui.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-slate-100 transition-colors cursor-pointer ${getNotificationBgColor(notification.type, notification.is_read)}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-semibold text-gray-800 ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
