import { useState, useEffect } from 'react';
import { Plus, Save, X, Calendar, Users, ChevronLeft, ChevronRight, Trash2, Edit2, Copy, RefreshCw, AlertTriangle, CheckCircle, FileDown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Department {
  id: string;
  description: string;
}

interface Employee {
  id: string;
  name: string;
  department_id: string;
}

interface ShiftTime {
  id: string;
  name: string;
}

interface DayOption {
  id: string;
  name: string;
  color: string;
}

interface Schedule {
  id: string;
  name: string;
  department_id: string;
  month: number;
  year: number;
  status: number;
  department?: Department;
}

interface ScheduleEmployee {
  id: string;
  schedule_id: string;
  employee_id: string;
  employee?: Employee;
}

interface ScheduleEntry {
  id?: string;
  schedule_id: string;
  employee_id: string;
  day: number;
  shift_time_id: string | null;
  day_option_id: string | null;
  shift_time?: ShiftTime;
  day_option?: DayOption;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: number;
}

interface ScheduleViolation {
  employeeId: string;
  employeeName: string;
  type: 'consecutive_days' | 'consecutive_sundays';
  details: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftTimes, setShiftTimes] = useState<ShiftTime[]>([]);
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [scheduleEmployees, setScheduleEmployees] = useState<ScheduleEmployee[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showBulkFill, setShowBulkFill] = useState(false);
  const [showWeekendFill, setShowWeekendFill] = useState(false);
  const [bulkFillData, setBulkFillData] = useState({
    employeeIds: [] as string[],
    shiftTimeId: '',
    dayOptionId: '',
    fillType: 'shift' as 'shift' | 'option',
    skipWeekends: true,
    skipHolidays: true,
    fillSaturday: false,
    fillSunday: false,
    fillHoliday: false
  });
  const [showViolationsAlert, setShowViolationsAlert] = useState(false);
  const [violations, setViolations] = useState<ScheduleViolation[]>([]);
  const [ignoreViolations, setIgnoreViolations] = useState(false);
  const [pendingAction, setPendingAction] = useState<'bulk' | 'cell' | null>(null);
  const [pendingCellData, setPendingCellData] = useState<{ employeeId: string; day: number; type: 'shift' | 'option'; value: string | null } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [availableSchedulesToDuplicate, setAvailableSchedulesToDuplicate] = useState<Schedule[]>([]);
  const [selectedScheduleToDuplicate, setSelectedScheduleToDuplicate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    selectedEmployees: [] as string[]
  });
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      loadScheduleDetails(selectedSchedule.id);
      loadHolidays(selectedSchedule.month, selectedSchedule.year);
    }
  }, [selectedSchedule]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSchedules(),
        loadDepartments(),
        loadEmployees(),
        loadShiftTimes(),
        loadDayOptions()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    const { data, error } = await supabase
      .from('monthly_schedules')
      .select(`
        *,
        department:data_types(id, description)
      `)
      .eq('status', 0)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error loading schedules:', error);
      return;
    }
    setSchedules(data || []);
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('data_types')
      .select('id, description')
      .eq('type', 2)
      .eq('status', 0)
      .order('description');
    setDepartments(data || []);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, department_id')
      .in('status', [0, 1, 2, 3])
      .order('name');
    setEmployees(data || []);
  };

  const loadShiftTimes = async () => {
    const { data } = await supabase
      .from('shift_times')
      .select('id, name')
      .eq('status', 0)
      .order('name');
    setShiftTimes(data || []);
  };

  const loadDayOptions = async () => {
    const { data } = await supabase
      .from('day_options')
      .select('id, name, color')
      .eq('status', 0)
      .order('name');
    setDayOptions(data || []);
  };

  const loadHolidays = async (month: number, year: number) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data } = await supabase
      .from('holidays')
      .select('*')
      .eq('status', 0)
      .gte('date', startDate)
      .lte('date', endDate);

    setHolidays(data || []);
  };

  const loadScheduleDetails = async (scheduleId: string) => {
    const { data: empData } = await supabase
      .from('schedule_employees')
      .select(`
        *,
        employee:employees(id, name)
      `)
      .eq('schedule_id', scheduleId);

    setScheduleEmployees(empData || []);

    const { data: entriesData } = await supabase
      .from('schedule_entries')
      .select(`
        *,
        shift_time:shift_times(id, name),
        day_option:day_options(id, name, color)
      `)
      .eq('schedule_id', scheduleId);

    setScheduleEntries(entriesData || []);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getWeekDay = (day: number, month: number, year: number) => {
    return new Date(year, month - 1, day).getDay();
  };

  const isHoliday = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr);
  };

  const isWorkingDay = (employeeId: string, day: number, entries: ScheduleEntry[]) => {
    const entry = entries.find(e => e.employee_id === employeeId && e.day === day);
    if (!entry) return false;
    return entry.shift_time_id !== null;
  };

  const validateSchedule = (entries: ScheduleEntry[], scheduleEmps: ScheduleEmployee[], month: number, year: number): ScheduleViolation[] => {
    const violations: ScheduleViolation[] = [];
    const daysInMonth = getDaysInMonth(month, year);

    for (const se of scheduleEmps) {
      const employeeId = se.employee_id;
      const employeeName = se.employee?.name || 'Colaborador';

      let consecutiveDays = 0;
      let maxConsecutive = 0;
      let consecutiveStartDay = 1;
      let maxConsecutiveStartDay = 1;

      for (let day = 1; day <= daysInMonth; day++) {
        if (isWorkingDay(employeeId, day, entries)) {
          if (consecutiveDays === 0) {
            consecutiveStartDay = day;
          }
          consecutiveDays++;
          if (consecutiveDays > maxConsecutive) {
            maxConsecutive = consecutiveDays;
            maxConsecutiveStartDay = consecutiveStartDay;
          }
        } else {
          consecutiveDays = 0;
        }
      }

      if (maxConsecutive > 7) {
        violations.push({
          employeeId,
          employeeName,
          type: 'consecutive_days',
          details: `${maxConsecutive} dias consecutivos trabalhados (dias ${maxConsecutiveStartDay} a ${maxConsecutiveStartDay + maxConsecutive - 1})`
        });
      }

      const sundays: number[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const weekDay = getWeekDay(day, month, year);
        if (weekDay === 0 && isWorkingDay(employeeId, day, entries)) {
          sundays.push(day);
        }
      }

      let consecutiveSundays = 0;
      let maxConsecutiveSundays = 0;
      for (let i = 0; i < sundays.length; i++) {
        if (i === 0) {
          consecutiveSundays = 1;
        } else {
          const diff = sundays[i] - sundays[i - 1];
          if (diff === 7) {
            consecutiveSundays++;
          } else {
            consecutiveSundays = 1;
          }
        }
        if (consecutiveSundays > maxConsecutiveSundays) {
          maxConsecutiveSundays = consecutiveSundays;
        }
      }

      if (maxConsecutiveSundays > 2) {
        violations.push({
          employeeId,
          employeeName,
          type: 'consecutive_sundays',
          details: `${maxConsecutiveSundays} domingos consecutivos trabalhados`
        });
      }
    }

    return violations;
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      department_id: '',
      month: currentMonth,
      year: currentYear,
      selectedEmployees: []
    });
    setEmployeeSearchTerm('');
    setShowForm(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const empIds = scheduleEmployees.map(se => se.employee_id);
    setFormData({
      name: schedule.name,
      department_id: schedule.department_id,
      month: schedule.month,
      year: schedule.year,
      selectedEmployees: empIds
    });
    setEmployeeSearchTerm('');
    setShowForm(true);
  };

  const handleSaveSchedule = async () => {
    if (!formData.name.trim() || !formData.department_id) {
      alert('Preencha o nome e selecione o setor');
      return;
    }

    if (formData.selectedEmployees.length === 0) {
      alert('Selecione pelo menos um colaborador');
      return;
    }

    try {
      let scheduleId: string;

      if (editingSchedule) {
        const { error } = await supabase
          .from('monthly_schedules')
          .update({
            name: formData.name,
            department_id: formData.department_id,
            month: formData.month,
            year: formData.year,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;
        scheduleId = editingSchedule.id;

        await supabase
          .from('schedule_employees')
          .delete()
          .eq('schedule_id', scheduleId);
      } else {
        const { data: userData } = await supabase
          .from('employees')
          .select('id')
          .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        const { data, error } = await supabase
          .from('monthly_schedules')
          .insert({
            name: formData.name,
            department_id: formData.department_id,
            month: formData.month,
            year: formData.year,
            created_by: userData?.id || null
          })
          .select()
          .single();

        if (error) throw error;
        scheduleId = data.id;
      }

      const employeeInserts = formData.selectedEmployees.map(empId => ({
        schedule_id: scheduleId,
        employee_id: empId
      }));

      const { error: empError } = await supabase
        .from('schedule_employees')
        .insert(employeeInserts);

      if (empError) throw empError;

      await loadSchedules();
      setShowForm(false);

      const { data: newSchedule } = await supabase
        .from('monthly_schedules')
        .select(`*, department:data_types(id, description)`)
        .eq('id', scheduleId)
        .single();

      if (newSchedule) {
        setSelectedSchedule(newSchedule);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Erro ao salvar escala');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta escala?')) return;

    try {
      const { error } = await supabase
        .from('monthly_schedules')
        .update({ status: 1 })
        .eq('id', scheduleId);

      if (error) {
        console.error('Error deleting schedule:', error);
        alert(`Erro ao excluir escala: ${error.message}`);
        return;
      }

      await loadSchedules();
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule(null);
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      alert(`Erro ao excluir escala: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleCellChange = async (employeeId: string, day: number, type: 'shift' | 'option', value: string | null) => {
    if (!selectedSchedule) return;

    const simulatedEntries = [...scheduleEntries];
    const existingIndex = simulatedEntries.findIndex(
      e => e.employee_id === employeeId && e.day === day
    );

    if (existingIndex >= 0) {
      if (!value) {
        simulatedEntries.splice(existingIndex, 1);
      } else {
        simulatedEntries[existingIndex] = {
          ...simulatedEntries[existingIndex],
          shift_time_id: type === 'shift' ? value : null,
          day_option_id: type === 'option' ? value : null
        };
      }
    } else if (value) {
      simulatedEntries.push({
        schedule_id: selectedSchedule.id,
        employee_id: employeeId,
        day,
        shift_time_id: type === 'shift' ? value : null,
        day_option_id: type === 'option' ? value : null
      });
    }

    const newViolations = validateSchedule(simulatedEntries, scheduleEmployees, selectedSchedule.month, selectedSchedule.year);

    if (newViolations.length > 0) {
      setViolations(newViolations);
      setIgnoreViolations(false);
      setPendingAction('cell');
      setPendingCellData({ employeeId, day, type, value });
      setShowViolationsAlert(true);
      return;
    }

    await executeCellChange(employeeId, day, type, value);
  };

  const executeCellChange = async (employeeId: string, day: number, type: 'shift' | 'option', value: string | null) => {
    if (!selectedSchedule) return;

    const existingEntry = scheduleEntries.find(
      e => e.employee_id === employeeId && e.day === day
    );

    try {
      if (existingEntry?.id) {
        const updateData = type === 'shift'
          ? { shift_time_id: value, day_option_id: null }
          : { day_option_id: value, shift_time_id: null };

        if (!value) {
          await supabase.from('schedule_entries').delete().eq('id', existingEntry.id);
        } else {
          await supabase.from('schedule_entries').update(updateData).eq('id', existingEntry.id);
        }
      } else if (value) {
        const insertData = {
          schedule_id: selectedSchedule.id,
          employee_id: employeeId,
          day,
          shift_time_id: type === 'shift' ? value : null,
          day_option_id: type === 'option' ? value : null
        };
        await supabase.from('schedule_entries').insert(insertData);
      }

      await loadScheduleDetails(selectedSchedule.id);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleBulkFill = async () => {
    if (!selectedSchedule || bulkFillData.employeeIds.length === 0 || (!bulkFillData.shiftTimeId && !bulkFillData.dayOptionId)) {
      alert('Selecione pelo menos um colaborador e o horario ou opcao de dia');
      return;
    }

    const daysInMonth = getDaysInMonth(selectedSchedule.month, selectedSchedule.year);
    const simulatedEntries = scheduleEntries.filter(e => !bulkFillData.employeeIds.includes(e.employee_id));

    for (const employeeId of bulkFillData.employeeIds) {
      for (let day = 1; day <= daysInMonth; day++) {
        const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
        const isWeekend = weekDay === 0 || weekDay === 6;
        const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

        if (bulkFillData.skipWeekends && isWeekend) continue;
        if (bulkFillData.skipHolidays && holidayInfo) continue;

        simulatedEntries.push({
          schedule_id: selectedSchedule.id,
          employee_id: employeeId,
          day,
          shift_time_id: bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : null,
          day_option_id: bulkFillData.fillType === 'option' ? bulkFillData.dayOptionId : null
        });
      }
    }

    const newViolations = validateSchedule(simulatedEntries, scheduleEmployees, selectedSchedule.month, selectedSchedule.year);

    if (newViolations.length > 0) {
      setViolations(newViolations);
      setIgnoreViolations(false);
      setPendingAction('bulk');
      setShowViolationsAlert(true);
      return;
    }

    await executeBulkFill();
  };

  const executeBulkFill = async () => {
    if (!selectedSchedule) return;

    const daysInMonth = getDaysInMonth(selectedSchedule.month, selectedSchedule.year);
    const entriesToInsert: { schedule_id: string; employee_id: string; day: number; shift_time_id: string | null; day_option_id: string | null }[] = [];

    for (const employeeId of bulkFillData.employeeIds) {
      for (let day = 1; day <= daysInMonth; day++) {
        const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
        const isWeekend = weekDay === 0 || weekDay === 6;
        const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

        if (bulkFillData.skipWeekends && isWeekend) continue;
        if (bulkFillData.skipHolidays && holidayInfo) continue;

        entriesToInsert.push({
          schedule_id: selectedSchedule.id,
          employee_id: employeeId,
          day,
          shift_time_id: bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : null,
          day_option_id: bulkFillData.fillType === 'option' ? bulkFillData.dayOptionId : null
        });
      }
    }

    try {
      for (const employeeId of bulkFillData.employeeIds) {
        await supabase
          .from('schedule_entries')
          .delete()
          .eq('schedule_id', selectedSchedule.id)
          .eq('employee_id', employeeId);
      }

      if (entriesToInsert.length > 0) {
        const { error } = await supabase
          .from('schedule_entries')
          .insert(entriesToInsert);

        if (error) throw error;
      }

      await loadScheduleDetails(selectedSchedule.id);
      setShowBulkFill(false);
      setBulkFillData({ employeeIds: [], shiftTimeId: '', dayOptionId: '', fillType: 'shift', skipWeekends: true, skipHolidays: true, fillSaturday: false, fillSunday: false, fillHoliday: false });
    } catch (error) {
      console.error('Error bulk filling:', error);
      alert('Erro ao preencher escala');
    }
  };

  const handleConfirmWithViolations = async () => {
    if (!ignoreViolations) {
      return;
    }

    setShowViolationsAlert(false);

    if (pendingAction === 'bulk') {
      if (showWeekendFill) {
        await executeWeekendFill();
      } else {
        await executeBulkFill();
      }
    } else if (pendingAction === 'cell' && pendingCellData) {
      await executeCellChange(
        pendingCellData.employeeId,
        pendingCellData.day,
        pendingCellData.type,
        pendingCellData.value
      );
    }

    setPendingAction(null);
    setPendingCellData(null);
    setIgnoreViolations(false);
  };

  const handleCancelViolations = () => {
    setShowViolationsAlert(false);
    setPendingAction(null);
    setPendingCellData(null);
    setIgnoreViolations(false);
  };

  const handleWeekendFill = async () => {
    if (!selectedSchedule || bulkFillData.employeeIds.length === 0 || (!bulkFillData.shiftTimeId && !bulkFillData.dayOptionId)) {
      alert('Selecione pelo menos um colaborador e o horario ou opcao de dia');
      return;
    }

    if (!bulkFillData.fillSaturday && !bulkFillData.fillSunday && !bulkFillData.fillHoliday) {
      alert('Selecione pelo menos um tipo de dia (Sabado, Domingo ou Feriado)');
      return;
    }

    const daysInMonth = getDaysInMonth(selectedSchedule.month, selectedSchedule.year);
    const simulatedEntries = scheduleEntries.filter(e => !bulkFillData.employeeIds.includes(e.employee_id));

    for (const employeeId of bulkFillData.employeeIds) {
      for (let day = 1; day <= daysInMonth; day++) {
        const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
        const isSaturday = weekDay === 6;
        const isSunday = weekDay === 0;
        const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

        let shouldFill = false;
        if (bulkFillData.fillSaturday && isSaturday) shouldFill = true;
        if (bulkFillData.fillSunday && isSunday) shouldFill = true;
        if (bulkFillData.fillHoliday && holidayInfo) shouldFill = true;

        if (!shouldFill) continue;

        simulatedEntries.push({
          schedule_id: selectedSchedule.id,
          employee_id: employeeId,
          day,
          shift_time_id: bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : null,
          day_option_id: bulkFillData.fillType === 'option' ? bulkFillData.dayOptionId : null
        });
      }
    }

    const newViolations = validateSchedule(simulatedEntries, scheduleEmployees, selectedSchedule.month, selectedSchedule.year);

    if (newViolations.length > 0) {
      setViolations(newViolations);
      setIgnoreViolations(false);
      setPendingAction('bulk');
      setShowViolationsAlert(true);
      return;
    }

    await executeWeekendFill();
  };

  const executeWeekendFill = async () => {
    if (!selectedSchedule) return;

    const daysInMonth = getDaysInMonth(selectedSchedule.month, selectedSchedule.year);
    const entriesToInsert: { schedule_id: string; employee_id: string; day: number; shift_time_id: string | null; day_option_id: string | null }[] = [];
    const daysToFill: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
      const isSaturday = weekDay === 6;
      const isSunday = weekDay === 0;
      const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

      let shouldFill = false;
      if (bulkFillData.fillSaturday && isSaturday) shouldFill = true;
      if (bulkFillData.fillSunday && isSunday) shouldFill = true;
      if (bulkFillData.fillHoliday && holidayInfo) shouldFill = true;

      if (shouldFill) {
        daysToFill.push(day);
      }
    }

    for (const employeeId of bulkFillData.employeeIds) {
      for (const day of daysToFill) {
        entriesToInsert.push({
          schedule_id: selectedSchedule.id,
          employee_id: employeeId,
          day,
          shift_time_id: bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : null,
          day_option_id: bulkFillData.fillType === 'option' ? bulkFillData.dayOptionId : null
        });
      }
    }

    try {
      for (const employeeId of bulkFillData.employeeIds) {
        if (daysToFill.length > 0) {
          await supabase
            .from('schedule_entries')
            .delete()
            .eq('schedule_id', selectedSchedule.id)
            .eq('employee_id', employeeId)
            .in('day', daysToFill);
        }
      }

      if (entriesToInsert.length > 0) {
        const { error } = await supabase
          .from('schedule_entries')
          .insert(entriesToInsert);

        if (error) throw error;
      }

      await loadScheduleDetails(selectedSchedule.id);
      setShowWeekendFill(false);
      setBulkFillData({ employeeIds: [], shiftTimeId: '', dayOptionId: '', fillType: 'shift', skipWeekends: true, skipHolidays: true, fillSaturday: false, fillSunday: false, fillHoliday: false });
    } catch (error) {
      console.error('Error weekend filling:', error);
      alert('Erro ao preencher fins de semana e feriados');
    }
  };

  const handleOpenDuplicateModal = async () => {
    try {
      // Calcular o mês anterior
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }

      // Buscar escalas do mês anterior
      const { data: previousSchedules, error: scheduleError } = await supabase
        .from('monthly_schedules')
        .select(`
          *,
          department:data_types(id, description)
        `)
        .eq('month', prevMonth)
        .eq('year', prevYear)
        .eq('status', 0);

      if (scheduleError) throw scheduleError;

      if (!previousSchedules || previousSchedules.length === 0) {
        alert('Nenhuma escala encontrada no mes anterior');
        return;
      }

      setAvailableSchedulesToDuplicate(previousSchedules);
      setSelectedScheduleToDuplicate(null);
      setShowDuplicateModal(true);
    } catch (error) {
      console.error('Error loading schedules to duplicate:', error);
      alert('Erro ao buscar escalas do mes anterior');
    }
  };

  const handleDuplicatePreviousSchedule = async () => {
    if (!selectedScheduleToDuplicate) {
      alert('Selecione uma escala para duplicar');
      return;
    }

    try {
      const scheduleToDuplicate = availableSchedulesToDuplicate.find(s => s.id === selectedScheduleToDuplicate)!;

      // Buscar colaboradores da escala anterior
      const { data: prevEmployees, error: empError } = await supabase
        .from('schedule_employees')
        .select('employee_id')
        .eq('schedule_id', selectedScheduleToDuplicate);

      if (empError) throw empError;

      if (!prevEmployees || prevEmployees.length === 0) {
        alert('A escala anterior não tem colaboradores cadastrados');
        return;
      }

      // Buscar entradas da escala anterior
      const { data: prevEntries, error: entriesError } = await supabase
        .from('schedule_entries')
        .select('employee_id, day, shift_time_id, day_option_id')
        .eq('schedule_id', selectedScheduleToDuplicate);

      if (entriesError) throw entriesError;

      // Obter usuário atual
      const { data: userData } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      // Criar nova escala
      const { data: newSchedule, error: createError } = await supabase
        .from('monthly_schedules')
        .insert({
          name: `${scheduleToDuplicate.name} - ${MONTHS[currentMonth - 1]}`,
          department_id: scheduleToDuplicate.department_id,
          month: currentMonth,
          year: currentYear,
          created_by: userData?.id || null
        })
        .select()
        .single();

      if (createError) throw createError;

      // Inserir colaboradores na nova escala
      const employeeInserts = prevEmployees.map(emp => ({
        schedule_id: newSchedule.id,
        employee_id: emp.employee_id
      }));

      const { error: empInsertError } = await supabase
        .from('schedule_employees')
        .insert(employeeInserts);

      if (empInsertError) throw empInsertError;

      // Inserir entradas na nova escala (se houver)
      if (prevEntries && prevEntries.length > 0) {
        // Ajustar entradas para o novo mês (manter apenas dias válidos)
        const newMonthDays = getDaysInMonth(currentMonth, currentYear);
        const entriesInserts = prevEntries
          .filter(entry => entry.day <= newMonthDays) // Só copiar dias que existem no novo mês
          .map(entry => ({
            schedule_id: newSchedule.id,
            employee_id: entry.employee_id,
            day: entry.day,
            shift_time_id: entry.shift_time_id,
            day_option_id: entry.day_option_id
          }));

        if (entriesInserts.length > 0) {
          const { error: entriesInsertError } = await supabase
            .from('schedule_entries')
            .insert(entriesInserts);

          if (entriesInsertError) throw entriesInsertError;
        }
      }

      // Recarregar lista de escalas
      await loadSchedules();

      // Selecionar a nova escala
      const { data: fullNewSchedule } = await supabase
        .from('monthly_schedules')
        .select(`*, department:data_types(id, description)`)
        .eq('id', newSchedule.id)
        .single();

      if (fullNewSchedule) {
        setSelectedSchedule(fullNewSchedule);
      }

      setShowDuplicateModal(false);
      setSelectedScheduleToDuplicate(null);
    } catch (error) {
      console.error('Error duplicating schedule:', error);
      alert('Erro ao duplicar escala');
    }
  };

  const getCellValue = (employeeId: string, day: number) => {
    const entry = scheduleEntries.find(
      e => e.employee_id === employeeId && e.day === day
    );
    return entry;
  };

  const getCellDisplay = (employeeId: string, day: number) => {
    const entry = getCellValue(employeeId, day);
    if (!entry) return null;

    if (entry.day_option) {
      return {
        text: entry.day_option.name,
        color: entry.day_option.color,
        type: 'option'
      };
    }
    if (entry.shift_time) {
      const hyphenIndex = entry.shift_time.name.indexOf('-');
      const displayText = hyphenIndex !== -1
        ? entry.shift_time.name.substring(0, hyphenIndex).trim()
        : entry.shift_time.name;

      return {
        text: displayText,
        color: '#FFFFFF',
        type: 'shift'
      };
    }
    return null;
  };

  const filteredEmployees = employees
    .filter(e => !formData.department_id || e.department_id === formData.department_id)
    .filter(e => !employeeSearchTerm || e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()));

  const daysInMonth = selectedSchedule
    ? getDaysInMonth(selectedSchedule.month, selectedSchedule.year)
    : getDaysInMonth(currentMonth, currentYear);

  const handleExportToPDF = () => {
    if (!selectedSchedule) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const title = `${selectedSchedule.name} - ${MONTHS[selectedSchedule.month - 1].toUpperCase()} ${selectedSchedule.year}`;
    const subtitle = selectedSchedule.department?.description || '';

    doc.setFontSize(16);
    doc.text(title, 148, 15, { align: 'center' });

    if (subtitle) {
      doc.setFontSize(10);
      doc.text(subtitle, 148, 22, { align: 'center' });
    }

    const headers = [
      { content: 'DIA', styles: { halign: 'center', fillColor: [31, 41, 55] } },
      ...scheduleEmployees.map(se => {
        const nameParts = se.employee?.name?.split(' ') || [];
        const displayName = nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0] || '';
        return {
          content: displayName || '',
          styles: { halign: 'center', fillColor: [31, 41, 55] }
        };
      })
    ];

    const bodyData = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
      const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
      const isWeekend = weekDay === 0 || weekDay === 6;
      const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

      const dayLabel = `${day} ${WEEKDAYS[weekDay]}${holidayInfo ? ` (${holidayInfo.name})` : ''}`;

      const rowColor = holidayInfo ? [254, 202, 202] : isWeekend ? [254, 249, 195] : [255, 255, 255];

      return [
        { content: dayLabel, styles: { fillColor: rowColor, fontStyle: 'bold', halign: 'left' } },
        ...scheduleEmployees.map(se => {
          const cellData = getCellDisplay(se.employee_id, day);
          let cellColor = rowColor;

          if (cellData?.color && cellData.color !== '#FFFFFF') {
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
              ] : rowColor;
            };
            cellColor = hexToRgb(cellData.color);
          }

          return {
            content: cellData?.text || '-',
            styles: {
              fillColor: cellColor,
              halign: 'center',
              fontSize: 7
            }
          };
        })
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: bodyData,
      startY: subtitle ? 28 : 23,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' }
      },
      margin: { top: 10, left: 10, right: 10, bottom: 10 }
    });

    const fileName = `Escala_${selectedSchedule.name.replace(/\s+/g, '_')}_${MONTHS[selectedSchedule.month - 1]}_${selectedSchedule.year}.pdf`;
    doc.save(fileName);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Escala do Mes</h2>
        <p className="text-gray-600">Gerencie as escalas de trabalho mensais</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Escalas</h3>
              <button
                onClick={handleCreateSchedule}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4 bg-gray-100 rounded-lg p-2">
              <button
                onClick={() => {
                  if (currentMonth === 1) {
                    setCurrentMonth(12);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium">{MONTHS[currentMonth - 1]} {currentYear}</span>
              <button
                onClick={() => {
                  if (currentMonth === 12) {
                    setCurrentMonth(1);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleOpenDuplicateModal}
              className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              title="Duplicar escala do mês anterior"
            >
              <Copy className="w-4 h-4" />
              Duplicar Escala Anterior
            </button>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {schedules
                .filter(s => s.month === currentMonth && s.year === currentYear)
                .map(schedule => (
                  <div
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSchedule?.id === schedule.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{schedule.name}</p>
                        <p className="text-sm text-gray-500">{schedule.department?.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(schedule.id);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              {schedules.filter(s => s.month === currentMonth && s.year === currentYear).length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma escala neste mes</p>
              )}
            </div>
          </div>

          {holidays.length > 0 && selectedSchedule && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Feriados do Mes</h3>
              <div className="space-y-2">
                {holidays.map(holiday => {
                  const day = parseInt(holiday.date.split('-')[2]);
                  return (
                    <div key={holiday.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-medium text-xs">
                        {day}
                      </span>
                      <span className="text-gray-700">{holiday.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          {selectedSchedule ? (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedSchedule.name} - {MONTHS[selectedSchedule.month - 1].toUpperCase()} {selectedSchedule.year}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedSchedule.department?.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleExportToPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Exportar escala em PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => {
                      setBulkFillData({ employeeIds: [], shiftTimeId: '', dayOptionId: '', fillType: 'shift', skipWeekends: true, skipHolidays: true, fillSaturday: false, fillSunday: false, fillHoliday: false });
                      setShowBulkFill(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Preencher Mes
                  </button>
                  <button
                    onClick={() => {
                      setBulkFillData({ employeeIds: [], shiftTimeId: '', dayOptionId: '', fillType: 'shift', skipWeekends: true, skipHolidays: true, fillSaturday: false, fillSunday: false, fillHoliday: false });
                      setShowWeekendFill(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Preencher Fins de Semana e Feriados
                  </button>
                  <button
                    onClick={() => handleEditSchedule(selectedSchedule)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-600 px-2 py-2 text-left sticky left-0 bg-gray-800 z-10 min-w-[140px]">
                        {MONTHS[selectedSchedule.month - 1].toUpperCase()}
                      </th>
                      {scheduleEmployees.map(se => {
                        const nameParts = se.employee?.name?.split(' ') || [];
                        const displayName = nameParts.length > 1
                          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
                          : nameParts[0] || '';
                        return (
                          <th key={se.id} className="border border-gray-600 px-2 py-2 text-center min-w-[120px]">
                            {displayName.toUpperCase()}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const weekDay = getWeekDay(day, selectedSchedule.month, selectedSchedule.year);
                      const isWeekend = weekDay === 0 || weekDay === 6;
                      const holidayInfo = isHoliday(day, selectedSchedule.month, selectedSchedule.year);

                      return (
                        <tr key={day} className={holidayInfo ? 'bg-red-50' : isWeekend ? 'bg-yellow-50' : ''}>
                          <td className={`border border-gray-300 px-2 py-1 font-medium sticky left-0 z-10 ${
                            holidayInfo ? 'bg-red-100' : isWeekend ? 'bg-yellow-100' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold w-6">{day}</span>
                              <span className="text-xs text-gray-600">{WEEKDAYS[weekDay]}</span>
                              {holidayInfo && (
                                <span className="text-xs text-red-600 font-medium truncate max-w-[60px]" title={holidayInfo.name}>
                                  {holidayInfo.name}
                                </span>
                              )}
                            </div>
                          </td>
                          {scheduleEmployees.map(se => {
                            const cellData = getCellDisplay(se.employee_id, day);
                            const entry = getCellValue(se.employee_id, day);

                            return (
                              <td
                                key={`${se.id}-${day}`}
                                className="border border-gray-300 px-1 py-1 text-center"
                                style={{ backgroundColor: cellData?.color || 'transparent' }}
                              >
                                <select
                                  value={entry?.shift_time_id || entry?.day_option_id || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                      handleCellChange(se.employee_id, day, 'shift', null);
                                      return;
                                    }
                                    const isShift = shiftTimes.some(st => st.id === val);
                                    handleCellChange(se.employee_id, day, isShift ? 'shift' : 'option', val);
                                  }}
                                  className="w-full px-1 py-1 text-xs border-0 bg-transparent text-center font-medium focus:ring-2 focus:ring-blue-500 rounded"
                                  style={{
                                    backgroundColor: cellData?.color ? 'transparent' : 'white',
                                    color: cellData?.color && cellData.color !== '#FFFFFF' ? '#000' : 'inherit'
                                  }}
                                >
                                  <option value="">-</option>
                                  <optgroup label="Horarios">
                                    {shiftTimes.map(st => {
                                      const hyphenIndex = st.name.indexOf('-');
                                      const displayName = hyphenIndex !== -1
                                        ? st.name.substring(0, hyphenIndex).trim()
                                        : st.name;
                                      return (
                                        <option key={st.id} value={st.id}>{displayName}</option>
                                      );
                                    })}
                                  </optgroup>
                                  <optgroup label="Opcoes">
                                    {dayOptions.map(opt => (
                                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-100 border border-gray-300 rounded"></span>
                  <span className="text-gray-600">Fim de semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-100 border border-gray-300 rounded"></span>
                  <span className="text-gray-600">Feriado</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma escala selecionada</h3>
              <p className="text-gray-500 mb-4">Selecione uma escala existente ou crie uma nova</p>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Criar Nova Escala
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingSchedule ? 'Editar Escala' : 'Nova Escala'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Escala *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Escala RH"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mes *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS.map((month, i) => (
                      <option key={i} value={i + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={2020}
                    max={2100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setor *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value, selectedEmployees: [] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um setor</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Colaboradores *
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar colaborador..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredEmployees.map(e => e.id);
                      const allSelected = allIds.every(id => formData.selectedEmployees.includes(id));
                      if (allSelected) {
                        setFormData({
                          ...formData,
                          selectedEmployees: formData.selectedEmployees.filter(id => !allIds.includes(id))
                        });
                      } else {
                        const newSelected = [...new Set([...formData.selectedEmployees, ...allIds])];
                        setFormData({
                          ...formData,
                          selectedEmployees: newSelected
                        });
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {filteredEmployees.length > 0 && filteredEmployees.every(e => formData.selectedEmployees.includes(e.id))
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredEmployees.length} encontrado(s)
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">
                      {employeeSearchTerm
                        ? 'Nenhum colaborador encontrado'
                        : formData.department_id
                        ? 'Nenhum colaborador neste setor'
                        : 'Selecione um setor primeiro'}
                    </p>
                  ) : (
                    filteredEmployees.map(emp => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedEmployees: [...formData.selectedEmployees, emp.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedEmployees: formData.selectedEmployees.filter(id => id !== emp.id)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-gray-800">{emp.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.selectedEmployees.length} colaborador(es) selecionado(s)
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkFill && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">Preencher Mes Completo</h3>
              <button onClick={() => setShowBulkFill(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Colaboradores *
                </label>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkFillData.employeeIds.length === scheduleEmployees.length) {
                        setBulkFillData({ ...bulkFillData, employeeIds: [] });
                      } else {
                        setBulkFillData({ ...bulkFillData, employeeIds: scheduleEmployees.map(se => se.employee_id) });
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {bulkFillData.employeeIds.length === scheduleEmployees.length
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {scheduleEmployees.length} colaborador(es)
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {scheduleEmployees.map(se => (
                    <label
                      key={se.employee_id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={bulkFillData.employeeIds.includes(se.employee_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkFillData({
                              ...bulkFillData,
                              employeeIds: [...bulkFillData.employeeIds, se.employee_id]
                            });
                          } else {
                            setBulkFillData({
                              ...bulkFillData,
                              employeeIds: bulkFillData.employeeIds.filter(id => id !== se.employee_id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-800">{se.employee?.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {bulkFillData.employeeIds.length} colaborador(es) selecionado(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horario ou Opcao *</label>
                <select
                  value={bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : bulkFillData.dayOptionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setBulkFillData({ ...bulkFillData, shiftTimeId: '', dayOptionId: '', fillType: 'shift' });
                      return;
                    }
                    const isShift = shiftTimes.some(st => st.id === val);
                    setBulkFillData({
                      ...bulkFillData,
                      shiftTimeId: isShift ? val : '',
                      dayOptionId: isShift ? '' : val,
                      fillType: isShift ? 'shift' : 'option'
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o horario ou opcao</option>
                  <optgroup label="Horarios">
                    {shiftTimes.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Opcoes de Dia">
                    {dayOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkFillData.skipWeekends}
                    onChange={(e) => setBulkFillData({ ...bulkFillData, skipWeekends: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Pular fins de semana</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkFillData.skipHolidays}
                    onChange={(e) => setBulkFillData({ ...bulkFillData, skipHolidays: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Pular feriados</span>
                </label>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  Isso vai preencher todos os dias {bulkFillData.skipWeekends ? 'uteis' : ''} do mes com o horario ou opcao selecionada.
                  Os dados existentes serao substituidos.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowBulkFill(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkFill}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Preencher
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeekendFill && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">Preencher Fins de Semana e Feriados</h3>
              <button onClick={() => setShowWeekendFill(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Colaboradores *
                </label>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkFillData.employeeIds.length === scheduleEmployees.length) {
                        setBulkFillData({ ...bulkFillData, employeeIds: [] });
                      } else {
                        setBulkFillData({ ...bulkFillData, employeeIds: scheduleEmployees.map(se => se.employee_id) });
                      }
                    }}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {bulkFillData.employeeIds.length === scheduleEmployees.length
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {scheduleEmployees.length} colaborador(es)
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {scheduleEmployees.map(se => (
                    <label
                      key={se.employee_id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={bulkFillData.employeeIds.includes(se.employee_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkFillData({
                              ...bulkFillData,
                              employeeIds: [...bulkFillData.employeeIds, se.employee_id]
                            });
                          } else {
                            setBulkFillData({
                              ...bulkFillData,
                              employeeIds: bulkFillData.employeeIds.filter(id => id !== se.employee_id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span className="text-gray-800">{se.employee?.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {bulkFillData.employeeIds.length} colaborador(es) selecionado(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Dias a Preencher *
                </label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkFillData.fillSaturday}
                      onChange={(e) => setBulkFillData({ ...bulkFillData, fillSaturday: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-700 font-medium">Sabado</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkFillData.fillSunday}
                      onChange={(e) => setBulkFillData({ ...bulkFillData, fillSunday: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-700 font-medium">Domingo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkFillData.fillHoliday}
                      onChange={(e) => setBulkFillData({ ...bulkFillData, fillHoliday: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-700 font-medium">Feriado</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horario ou Opcao *</label>
                <select
                  value={bulkFillData.fillType === 'shift' ? bulkFillData.shiftTimeId : bulkFillData.dayOptionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setBulkFillData({ ...bulkFillData, shiftTimeId: '', dayOptionId: '', fillType: 'shift' });
                      return;
                    }
                    const isShift = shiftTimes.some(st => st.id === val);
                    setBulkFillData({
                      ...bulkFillData,
                      shiftTimeId: isShift ? val : '',
                      dayOptionId: isShift ? '' : val,
                      fillType: isShift ? 'shift' : 'option'
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecione o horario ou opcao</option>
                  <optgroup label="Horarios">
                    {shiftTimes.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Opcoes de Dia">
                    {dayOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700">
                  Isso vai preencher os dias selecionados (sabado, domingo e/ou feriados) do mes com o horario ou opcao escolhida.
                  Os dados existentes desses dias serao substituidos.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowWeekendFill(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleWeekendFill}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Preencher
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Duplicar Escala</h3>
                <p className="text-sm text-gray-500">
                  Selecione a escala do mes anterior que deseja duplicar
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSelectedScheduleToDuplicate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {availableSchedulesToDuplicate.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma escala encontrada no mes anterior</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSchedulesToDuplicate.map(schedule => {
                    const prevMonth = schedule.month;
                    const prevYear = schedule.year;

                    return (
                      <label
                        key={schedule.id}
                        className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer border-2 transition-all ${
                          selectedScheduleToDuplicate === schedule.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="schedule-to-duplicate"
                          value={schedule.id}
                          checked={selectedScheduleToDuplicate === schedule.id}
                          onChange={() => setSelectedScheduleToDuplicate(schedule.id)}
                          className="mt-1 w-5 h-5 text-teal-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-1">
                                {schedule.name}
                              </h4>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Setor:</span> {schedule.department?.description}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Periodo:</span> {MONTHS[prevMonth - 1]} de {prevYear}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                {MONTHS[prevMonth - 1]}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>O que sera duplicado:</strong> A nova escala tera os mesmos colaboradores e
                  horarios da escala selecionada, ajustada para {MONTHS[currentMonth - 1]} de {currentYear}.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSelectedScheduleToDuplicate(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicatePreviousSchedule}
                disabled={!selectedScheduleToDuplicate}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedScheduleToDuplicate
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Copy className="w-4 h-4" />
                Duplicar Escala
              </button>
            </div>
          </div>
        </div>
      )}

      {showViolationsAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Alerta de Escala</h3>
                <p className="text-sm text-gray-500">Foram encontradas irregularidades na escala</p>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 font-medium mb-3">Problemas encontrados:</p>
                <ul className="space-y-2">
                  {violations.map((v, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{v.employeeName}:</span>{' '}
                        {v.type === 'consecutive_days' && v.details}
                        {v.type === 'consecutive_sundays' && v.details}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={ignoreViolations}
                  onChange={(e) => setIgnoreViolations(e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded"
                />
                <div>
                  <span className="text-gray-800 font-medium">Ignorar alertas e salvar mesmo assim</span>
                  <p className="text-xs text-gray-500">Marque esta opcao para confirmar que deseja prosseguir</p>
                </div>
              </label>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancelViolations}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWithViolations}
                disabled={!ignoreViolations}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  ignoreViolations
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
