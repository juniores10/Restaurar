import { useState, useEffect } from 'react';
import { Calendar, Save, Plus, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  department?: {
    description: string;
  };
}

interface ProductivityGoal {
  employee_id: string;
  planned_value: number;
}

interface DailyProductivity {
  [employeeId: string]: {
    [date: string]: number;
  };
}

interface DayInfo {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  isWeekend: boolean;
}

export default function EmployeeProductivityAnalysis() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [dailyData, setDailyData] = useState<DailyProductivity>({});
  const [daysInMonth, setDaysInMonth] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ employeeId: '', planned: 0 });
  const [editingCell, setEditingCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      generateDaysInMonth();
      loadData();
    }
  }, [selectedMonth, selectedYear]);

  const generateDaysInMonth = () => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const days: DayInfo[] = [];

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = date.getDay();

      days.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayNames[dayOfWeek],
        dayNumber: day,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    setDaysInMonth(days);
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          department:department_id (
            description
          )
        `)
        .eq('status', 0)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar metas do mês
      const { data: goalsData, error: goalsError } = await supabase
        .from('employee_productivity_goals')
        .select('employee_id, planned_value')
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (goalsError) throw goalsError;

      const goalsMap: Record<string, number> = {};
      goalsData?.forEach((g: ProductivityGoal) => {
        goalsMap[g.employee_id] = Number(g.planned_value);
      });
      setGoals(goalsMap);

      // Carregar dados diários
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0);

      const { data: dailyDataRaw, error: dailyError } = await supabase
        .from('employee_productivity_daily')
        .select('employee_id, work_date, realized_value')
        .gte('work_date', firstDay.toISOString().split('T')[0])
        .lte('work_date', lastDay.toISOString().split('T')[0]);

      if (dailyError) throw dailyError;

      const dailyMap: DailyProductivity = {};
      dailyDataRaw?.forEach((d: any) => {
        if (!dailyMap[d.employee_id]) {
          dailyMap[d.employee_id] = {};
        }
        dailyMap[d.employee_id][d.work_date] = Number(d.realized_value);
      });
      setDailyData(dailyMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDailyValue = async (employeeId: string, date: string, value: number) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('employee_productivity_daily')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('work_date', date)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        if (value === 0) {
          // Se o valor for 0, deletar o registro
          const { error: deleteError } = await supabase
            .from('employee_productivity_daily')
            .delete()
            .eq('id', existing.id);

          if (deleteError) throw deleteError;
        } else {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('employee_productivity_daily')
            .update({
              realized_value: value,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        }
      } else if (value > 0) {
        // Inserir novo registro
        const { error: insertError } = await supabase
          .from('employee_productivity_daily')
          .insert({
            employee_id: employeeId,
            work_date: date,
            realized_value: value
          });

        if (insertError) throw insertError;
      }

      // Atualizar estado local
      setDailyData(prev => {
        const newData = { ...prev };
        if (!newData[employeeId]) {
          newData[employeeId] = {};
        }
        if (value === 0) {
          delete newData[employeeId][date];
        } else {
          newData[employeeId][date] = value;
        }
        return newData;
      });

      setEditingCell(null);
      setTempValue('');
    } catch (error) {
      console.error('Erro ao salvar valor:', error);
      alert('Erro ao salvar valor');
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.employeeId || newGoal.planned <= 0) {
      alert('Por favor, selecione um colaborador e informe uma meta válida.');
      return;
    }

    try {
      const { data: existingGoal } = await supabase
        .from('employee_productivity_goals')
        .select('*')
        .eq('employee_id', newGoal.employeeId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .maybeSingle();

      if (existingGoal) {
        const shouldUpdate = confirm(
          `Já existe uma meta para este colaborador neste período (Meta atual: ${existingGoal.planned_value}).\n\nDeseja atualizar a meta para ${newGoal.planned}?`
        );

        if (!shouldUpdate) return;

        const { error: updateError } = await supabase
          .from('employee_productivity_goals')
          .update({ planned_value: newGoal.planned })
          .eq('id', existingGoal.id);

        if (updateError) throw updateError;
        alert('Meta atualizada com sucesso!');
      } else {
        const { error: insertError } = await supabase
          .from('employee_productivity_goals')
          .insert({
            employee_id: newGoal.employeeId,
            month: selectedMonth,
            year: selectedYear,
            planned_value: newGoal.planned
          });

        if (insertError) throw insertError;
        alert('Meta adicionada com sucesso!');
      }

      setShowAddModal(false);
      setNewGoal({ employeeId: '', planned: 0 });
      loadData();
    } catch (error: any) {
      console.error('Erro ao processar meta:', error);
      alert(`Erro ao processar meta: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteGoal = async (employeeId: string) => {
    if (!confirm('Deseja realmente excluir esta meta e todos os lançamentos?')) return;

    try {
      await supabase
        .from('employee_productivity_goals')
        .delete()
        .eq('employee_id', employeeId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      await supabase
        .from('employee_productivity_daily')
        .delete()
        .eq('employee_id', employeeId)
        .gte('work_date', new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0])
        .lte('work_date', new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]);

      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir meta');
    }
  };

  const calculateTotals = (employeeId: string) => {
    const realized = Object.values(dailyData[employeeId] || {}).reduce((sum, val) => sum + val, 0);
    const planned = goals[employeeId] || 0;
    const difference = realized - planned;
    const adherence = planned > 0 ? (realized / planned) * 100 : 0;
    return { realized, planned, difference, adherence };
  };

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const employeesWithGoals = employees.filter(e => goals[e.id] !== undefined);

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Adicionar Meta
          </button>
        </div>
      </div>

      {/* Tabela de Lançamentos Diários */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      ) : employeesWithGoals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma meta cadastrada
          </h3>
          <p className="text-gray-600 mb-4">
            Adicione metas para começar a registrar a produtividade diária
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Adicionar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 z-10">
                    Dia
                  </th>
                  {employeesWithGoals.map(emp => {
                    const totals = calculateTotals(emp.id);
                    return (
                      <th key={emp.id} className="px-4 py-3 text-center border-r border-gray-200 min-w-[150px]">
                        <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Meta: {totals.planned.toFixed(0)}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${
                            totals.adherence >= 100 ? 'text-green-600' :
                            totals.adherence >= 80 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {totals.adherence.toFixed(0)}%
                          </span>
                          <button
                            onClick={() => handleDeleteGoal(emp.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir meta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {daysInMonth.map(day => (
                  <tr key={day.date} className={day.isWeekend ? 'bg-gray-50' : ''}>
                    <td className="sticky left-0 bg-white px-4 py-3 text-sm border-r border-gray-200 z-10">
                      <div className="font-medium text-gray-900">
                        {day.dayOfWeek}
                      </div>
                      <div className="text-xs text-gray-500">
                        dia {day.dayNumber.toString().padStart(2, '0')}
                      </div>
                    </td>
                    {employeesWithGoals.map(emp => {
                      const value = dailyData[emp.id]?.[day.date] || 0;
                      const isEditing = editingCell?.employeeId === emp.id && editingCell?.date === day.date;

                      return (
                        <td
                          key={emp.id}
                          className="px-2 py-2 text-center border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                          onClick={() => {
                            if (!isEditing) {
                              setEditingCell({ employeeId: emp.id, date: day.date });
                              setTempValue(value > 0 ? value.toString() : '');
                            }
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => {
                                const numValue = parseFloat(tempValue.replace(',', '.')) || 0;
                                handleSaveDailyValue(emp.id, day.date, numValue);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const numValue = parseFloat(tempValue.replace(',', '.')) || 0;
                                  handleSaveDailyValue(emp.id, day.date, numValue);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                  setTempValue('');
                                }
                              }}
                              autoFocus
                              className="w-full px-2 py-1 text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className={`${value > 0 ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                              {value > 0 ? value.toFixed(1) : '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Linha de Totais */}
                <tr className="bg-blue-50 font-semibold">
                  <td className="sticky left-0 bg-blue-50 px-4 py-3 text-sm border-r border-gray-200 z-10">
                    TOTAL REALIZADO
                  </td>
                  {employeesWithGoals.map(emp => {
                    const totals = calculateTotals(emp.id);
                    return (
                      <td key={emp.id} className="px-4 py-3 text-center border-r border-gray-200">
                        <div className="text-lg font-bold text-gray-900">
                          {totals.realized.toFixed(1)}
                        </div>
                        <div className={`text-sm ${
                          totals.difference >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {totals.difference >= 0 ? '+' : ''}{totals.difference.toFixed(1)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Adicionar Meta */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Adicionar Meta de Produtividade
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colaborador
                </label>
                <select
                  value={newGoal.employeeId}
                  onChange={(e) => setNewGoal({ ...newGoal, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um colaborador</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Planejada
                </label>
                <input
                  type="text"
                  value={newGoal.planned || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) || e.target.value === '') {
                      setNewGoal({ ...newGoal, planned: e.target.value === '' ? 0 : numValue });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(',', '.');
                    const numValue = parseFloat(value) || 0;
                    setNewGoal({ ...newGoal, planned: numValue });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a meta (ex: 100 ou 100,50)"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewGoal({ employeeId: '', planned: 0 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
