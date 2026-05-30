import { useState, useEffect } from 'react';
import { Calendar, Clock, LogIn, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ScheduleWithDetails {
  id: string;
  name: string;
  month: number;
  year: number;
  department?: {
    description: string;
  };
}

interface ScheduleEntry {
  id: string;
  day: number;
  shift_time?: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
  };
  day_option?: {
    id: string;
    name: string;
    color: string;
  };
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];

function formatTime(time: string | undefined): string {
  if (!time) return '--:--';
  return time.substring(0, 5);
}

export function EmployeeSchedule() {
  const { employeeProfile } = useAuth();
  const today = new Date();
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  useEffect(() => {
    if (employeeProfile?.id) {
      loadScheduleData();
    } else if (employeeProfile === null) {
      setIsLoading(false);
    }
  }, [employeeProfile, viewMonth, viewYear]);

  const loadScheduleData = async () => {
    if (!employeeProfile?.id) return;

    setIsLoading(true);
    try {
      const { data: scheduleEmployees } = await supabase
        .from('schedule_employees')
        .select('schedule_id')
        .eq('employee_id', employeeProfile.id);

      if (!scheduleEmployees || scheduleEmployees.length === 0) {
        setSchedules([]);
        setEntries([]);
        setIsLoading(false);
        return;
      }

      const scheduleIds = scheduleEmployees.map(se => se.schedule_id);

      const { data: schedulesData } = await supabase
        .from('monthly_schedules')
        .select(`
          id,
          name,
          month,
          year,
          department:data_types(description)
        `)
        .in('id', scheduleIds)
        .eq('month', viewMonth)
        .eq('year', viewYear)
        .eq('status', 0);

      setSchedules(schedulesData || []);

      if (schedulesData && schedulesData.length > 0) {
        const currentScheduleIds = schedulesData.map(s => s.id);

        const { data: entriesData } = await supabase
          .from('schedule_entries')
          .select(`
            id,
            day,
            shift_time:shift_times(id, name, start_time, end_time),
            day_option:day_options(id, name, color)
          `)
          .in('schedule_id', currentScheduleIds)
          .eq('employee_id', employeeProfile.id);

        setEntries(entriesData || []);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(viewYear, viewMonth, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(viewYear, viewMonth - 1, 1).getDay();
  };

  const getWeekDay = (day: number) => {
    return new Date(viewYear, viewMonth - 1, day).getDay();
  };

  const getEntryForDay = (day: number) => {
    return entries.find(e => e.day === day);
  };

  const goToToday = () => {
    setViewMonth(currentMonth);
    setViewYear(currentYear);
    setSelectedDay(today.getDate());
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };

  const canGoToPrevious = () => {
    if (viewYear > currentYear) return true;
    if (viewYear === currentYear && viewMonth > currentMonth) return true;
    return false;
  };

  const canGoToNext = () => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    if (viewYear < nextYear) return true;
    if (viewYear === nextYear && viewMonth < nextMonth) return true;
    return false;
  };

  const daysInMonth = getDaysInMonth();
  const firstDayOfMonth = getFirstDayOfMonth();
  const isCurrentMonth = viewMonth === currentMonth && viewYear === currentYear;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedEntry = selectedDay ? getEntryForDay(selectedDay) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Carregando escala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24 md:pb-8">
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 pt-6 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Minha Escala</h1>
              <p className="text-slate-300 text-sm">Visualize sua escala de trabalho</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoToPrevious()}
                  className={`p-2 rounded-lg transition-colors ${
                    canGoToPrevious()
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center flex-1">
                  <h2 className="text-lg font-bold text-slate-800">
                    {MONTHS[viewMonth - 1]} {viewYear}
                  </h2>
                  {!isCurrentMonth && (
                    <button
                      onClick={goToToday}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                    >
                      Ir para mes atual
                    </button>
                  )}
                </div>

                <button
                  onClick={goToNextMonth}
                  disabled={!canGoToNext()}
                  className={`p-2 rounded-lg transition-colors ${
                    canGoToNext()
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {schedules.length > 0 && (
              <div className="px-4 md:px-6 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Escala:</span> {schedules[0].name}
                  {schedules[0].department && (
                    <span className="ml-2 text-blue-500">({schedules[0].department.description})</span>
                  )}
                </p>
              </div>
            )}

            <div className="p-4 md:p-6">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const entry = getEntryForDay(day);
                  const isToday = isCurrentMonth && day === today.getDate();
                  const isSelected = selectedDay === day;
                  const weekDay = getWeekDay(day);
                  const isWeekend = weekDay === 0 || weekDay === 6;

                  let bgColor = isWeekend ? 'bg-amber-50' : 'bg-white';

                  if (entry?.day_option) {
                    bgColor = '';
                  } else if (entry?.shift_time) {
                    bgColor = 'bg-emerald-50';
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`
                        min-h-[70px] md:min-h-[80px] rounded-xl flex flex-col items-center justify-start pt-1.5 pb-1 px-0.5 transition-all border
                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-slate-200'}
                        ${isToday ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : bgColor}
                        ${!isToday && entry?.shift_time ? 'border-emerald-200' : ''}
                        hover:shadow-md
                      `}
                      style={entry?.day_option && !isToday ? { backgroundColor: entry.day_option.color } : undefined}
                    >
                      <span className={`text-sm font-bold ${isToday ? 'text-white' : entry?.shift_time ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {day}
                      </span>

                      {entry?.shift_time && !isToday && (
                        <div className="flex flex-col items-center mt-0.5 w-full">
                          <div className="flex items-center gap-0.5 text-emerald-600">
                            <LogIn className="w-2.5 h-2.5" />
                            <span className="text-[9px] md:text-[10px] font-bold">{formatTime(entry.shift_time.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-orange-500">
                            <LogOut className="w-2.5 h-2.5" />
                            <span className="text-[9px] md:text-[10px] font-bold">{formatTime(entry.shift_time.end_time)}</span>
                          </div>
                        </div>
                      )}

                      {entry?.shift_time && isToday && (
                        <div className="flex flex-col items-center mt-0.5 w-full">
                          <div className="flex items-center gap-0.5 text-blue-100">
                            <LogIn className="w-2.5 h-2.5" />
                            <span className="text-[9px] md:text-[10px] font-bold">{formatTime(entry.shift_time.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-blue-100">
                            <LogOut className="w-2.5 h-2.5" />
                            <span className="text-[9px] md:text-[10px] font-bold">{formatTime(entry.shift_time.end_time)}</span>
                          </div>
                        </div>
                      )}

                      {entry?.day_option && !isToday && (
                        <span className="text-[8px] md:text-[9px] font-semibold text-slate-700 mt-1 truncate max-w-full px-0.5">
                          {entry.day_option.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedDay && (
            <div className="mt-4 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-800 text-lg">
                  {selectedDay} de {MONTHS[viewMonth - 1]}
                </h3>
                <p className="text-sm text-slate-500">{WEEKDAYS_FULL[getWeekDay(selectedDay)]}</p>
              </div>

              <div className="px-4 md:px-6 py-5">
                {selectedEntry ? (
                  <div className="space-y-4">
                    {selectedEntry.shift_time && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-800">Jornada de Trabalho</p>
                            <p className="text-sm text-emerald-600">{selectedEntry.shift_time.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <LogIn className="w-4 h-4 text-emerald-500" />
                              <span className="text-xs font-medium text-slate-500">Entrada</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {formatTime(selectedEntry.shift_time.start_time)}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-orange-100">
                            <div className="flex items-center gap-2 mb-1">
                              <LogOut className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-medium text-slate-500">Saida</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">
                              {formatTime(selectedEntry.shift_time.end_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEntry.day_option && (
                      <div
                        className="rounded-xl p-4 border"
                        style={{
                          backgroundColor: selectedEntry.day_option.color + '30',
                          borderColor: selectedEntry.day_option.color
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: selectedEntry.day_option.color }}
                          >
                            <Calendar className="w-5 h-5 text-slate-700" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{selectedEntry.day_option.name}</p>
                            <p className="text-sm text-slate-600">Dia especial</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma escala definida</p>
                    <p className="text-slate-400 text-sm mt-1">Sua escala ainda não foi definida para este dia</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Escala do Mes</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Dia</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Dia da Semana</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Escala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const entry = getEntryForDay(day);
                    const weekDay = getWeekDay(day);
                    const isWeekend = weekDay === 0 || weekDay === 6;
                    const isToday = isCurrentMonth && day === today.getDate();

                    return (
                      <tr
                        key={day}
                        className={`
                          ${isWeekend ? 'bg-yellow-50' : ''}
                          ${isToday ? 'bg-blue-50' : ''}
                          hover:bg-slate-50
                        `}
                        style={entry?.day_option ? { backgroundColor: entry.day_option.color + '40' } : undefined}
                      >
                        <td className="px-4 py-2 font-medium text-slate-800">
                          {day}
                          {isToday && <span className="ml-2 text-xs text-blue-600">(Hoje)</span>}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{WEEKDAYS_FULL[weekDay]}</td>
                        <td className="px-4 py-2">
                          {entry?.shift_time && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                              {entry.shift_time.name}
                            </span>
                          )}
                          {entry?.day_option && (
                            <span
                              className="px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ backgroundColor: entry.day_option.color }}
                            >
                              {entry.day_option.name}
                            </span>
                          )}
                          {!entry && <span className="text-slate-400">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
