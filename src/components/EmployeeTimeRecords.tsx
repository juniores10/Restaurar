import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TimeRecord {
  id: string;
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
  observations: string | null;
  record_type: string;
  original_record_type: string | null;
}

interface MonthlyStats {
  totalWorked: number;
  totalExpected: number;
  totalBalance: number;
  workDays: number;
  dayoffs: number;
  absences: number;
}

export default function EmployeeTimeRecords() {
  const { user } = useAuth();
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalWorked: 0,
    totalExpected: 0,
    totalBalance: 0,
    workDays: 0,
    dayoffs: 0,
    absences: 0,
  });

  useEffect(() => {
    if (user) {
      loadTimeRecords();
    }
  }, [user, selectedMonth]);

  const loadTimeRecords = async () => {
    setLoading(true);
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!employee) return;

      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: false });

      if (error) throw error;

      setTimeRecords(data || []);
      calculateMonthlyStats(data || []);
    } catch (error) {
      console.error('Error loading time records:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (records: TimeRecord[]) => {
    const stats: MonthlyStats = {
      totalWorked: 0,
      totalExpected: 0,
      totalBalance: 0,
      workDays: 0,
      dayoffs: 0,
      absences: 0,
    };

    records.forEach((record) => {
      stats.totalWorked += record.total_hours;
      stats.totalExpected += record.expected_hours;
      stats.totalBalance += record.balance_hours;

      if (record.record_type === 'work') stats.workDays++;
      if (record.record_type === 'dayoff') stats.dayoffs++;
      if (record.record_type === 'absence') stats.absences++;
    });

    setMonthlyStats(stats);
  };

  const formatTimeWithLocation = (time: string | null, location: string | null) => {
    if (time) return time.slice(0, 5);
    if (location) return location;
    return '-';
  };

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    return `${weekday}, ${dateStr}`;
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

  const getRecordTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      work: 'bg-blue-100 text-blue-800',
      dayoff: 'bg-green-100 text-green-800',
      vacation: 'bg-purple-100 text-purple-800',
      absence: 'bg-red-100 text-red-800',
      holiday: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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

  const getDisplayRecordTypeColor = (record: TimeRecord) => {
    if (isBancoHoras(record)) {
      return 'bg-green-100 text-green-800';
    }
    if (isEmptyWorkDay(record)) {
      return 'bg-red-100 text-red-800';
    }
    return getRecordTypeColor(record.record_type);
  };

  const getRecordCardClass = (record: TimeRecord) => {
    if (isBancoHoras(record)) {
      return 'bg-green-50 border-green-200';
    }
    if (isEmptyWorkDay(record)) {
      return 'bg-red-50 border-red-200';
    }
    if (isWeekend(record.record_date)) {
      return 'bg-gray-50 border-gray-200';
    }
    return 'bg-white border-gray-200';
  };

  const getDayOfWeek = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    return d.getDay();
  };

  const isWeekend = (date: string) => {
    const day = getDayOfWeek(date);
    return day === 0 || day === 6;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Registros de Ponto</h1>
          <p className="text-gray-600">Acompanhe seus horários, saldo de horas e dias trabalhados</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o Mês
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Horas Trabalhadas</p>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{monthlyStats.totalWorked.toFixed(1)}h</p>
            <p className="text-xs text-gray-500 mt-1">Total do mês</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Saldo de Horas</p>
              {monthlyStats.totalBalance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className={`text-3xl font-bold ${getBalanceColor(monthlyStats.totalBalance)}`}>
              {monthlyStats.totalBalance > 0 ? '+' : ''}{monthlyStats.totalBalance.toFixed(1)}h
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Esperado: {monthlyStats.totalExpected.toFixed(1)}h
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Dias Trabalhados</p>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{monthlyStats.workDays}</p>
            <p className="text-xs text-gray-500 mt-1">Dias úteis</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Folgas</p>
              <AlertCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{monthlyStats.dayoffs}</p>
            <p className="text-xs text-gray-500 mt-1">
              Faltas: {monthlyStats.absences}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registros Detalhados</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Carregando registros...</p>
            </div>
          ) : timeRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum registro encontrado para este mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeRecords.map((record) => {
                const isEmpty = isEmptyWorkDay(record);
                const isBH = isBancoHoras(record);
                return (
                <div
                  key={record.id}
                  className={`border rounded-lg p-4 ${getRecordCardClass(record)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className={`font-semibold ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{formatDate(record.record_date)}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 font-semibold ${getDisplayRecordTypeColor(record)}`}>
                        {getDisplayRecordType(record)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-600'}`}>Saldo</p>
                      <p className={`text-xl font-bold ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : getBalanceColor(record.balance_hours)}`}>
                        {record.balance_hours > 0 ? '+' : ''}{record.balance_hours.toFixed(2)}h
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-xs mb-1 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Entrada 1</p>
                      <p className={`text-sm font-medium ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{formatTimeWithLocation(record.clock_in_1, record.clock_in_1_location)}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Saida 1</p>
                      <p className={`text-sm font-medium ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{formatTimeWithLocation(record.clock_out_1, record.clock_out_1_location)}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Entrada 2</p>
                      <p className={`text-sm font-medium ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{formatTimeWithLocation(record.clock_in_2, record.clock_in_2_location)}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Saida 2</p>
                      <p className={`text-sm font-medium ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{formatTimeWithLocation(record.clock_out_2, record.clock_out_2_location)}</p>
                    </div>
                  </div>

                  <div className={`mt-3 pt-3 border-t flex items-center justify-between ${isBH ? 'border-green-200' : isEmpty ? 'border-red-200' : 'border-gray-100'}`}>
                    <div>
                      <span className={`text-xs ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Total: </span>
                      <span className={`text-sm font-semibold ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{record.total_hours.toFixed(2)}h</span>
                      <span className={`text-xs ml-2 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Esperado: </span>
                      <span className={`text-sm font-semibold ${isBH ? 'text-green-900' : isEmpty ? 'text-red-900' : 'text-gray-900'}`}>{record.expected_hours.toFixed(2)}h</span>
                    </div>
                  </div>

                  {record.observations && (
                    <div className={`mt-3 pt-3 border-t ${isBH ? 'border-green-200' : isEmpty ? 'border-red-200' : 'border-gray-100'}`}>
                      <p className={`text-xs mb-1 ${isBH ? 'text-green-600' : isEmpty ? 'text-red-600' : 'text-gray-500'}`}>Observacoes:</p>
                      <p className={`text-sm ${isBH ? 'text-green-800' : isEmpty ? 'text-red-800' : 'text-gray-700'}`}>{record.observations}</p>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
