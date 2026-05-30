import { useState, useEffect } from 'react';
import { Target, Activity, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemOverviewData {
  totalPlanned: number;
  totalRealized: number;
  overallProductivity: number;
  overallGap: number;
  criticalDays: number;
  topEmployee: { name: string; percentage: number } | null;
}

export function SystemOverviewCards() {
  const [data, setData] = useState<SystemOverviewData>({
    totalPlanned: 0,
    totalRealized: 0,
    overallProductivity: 0,
    overallGap: 0,
    criticalDays: 0,
    topEmployee: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemOverview();
  }, []);

  const loadSystemOverview = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: rawRecords, error: recordsError } = await supabase
        .from('sector_productivity_records')
        .select(`
          work_date,
          subject,
          points,
          employee_id,
          employees!inner(id, name)
        `)
        .gte('work_date', startDateStr)
        .order('work_date', { ascending: false });

      if (recordsError) {
        console.error('Error loading records:', recordsError);
        setLoading(false);
        return;
      }

      if (!rawRecords || rawRecords.length === 0) {
        console.log('No productivity records found');
        setLoading(false);
        return;
      }

      interface EmployeeDateStats {
        planned: number;
        realized: number;
      }

      const employeeDateMap: { [key: string]: { [date: string]: EmployeeDateStats } } = {};

      rawRecords.forEach((record: any) => {
        const employeeId = record.employee_id;
        const workDate = record.work_date;
        const subject = (record.subject || '').toLowerCase();
        const points = Number(record.points) || 0;

        if (!employeeId || !workDate) return;

        if (!employeeDateMap[employeeId]) {
          employeeDateMap[employeeId] = {};
        }

        if (!employeeDateMap[employeeId][workDate]) {
          employeeDateMap[employeeId][workDate] = { planned: 0, realized: 0 };
        }

        if (subject.includes('planejado')) {
          employeeDateMap[employeeId][workDate].planned += points;
        } else if (subject.includes('realizado')) {
          employeeDateMap[employeeId][workDate].realized += points;
        }
      });

      let totalPlanned = 0;
      let totalRealized = 0;
      const dailyProductivity: { [key: string]: { planned: number; realized: number } } = {};
      const employeeStats: { [key: string]: { name: string; planned: number; realized: number } } = {};

      Object.entries(employeeDateMap).forEach(([employeeId, dates]) => {
        const employee = rawRecords.find((r: any) => r.employee_id === employeeId);
        const employeeName = employee?.employees?.name || 'Unknown';

        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = { name: employeeName, planned: 0, realized: 0 };
        }

        Object.entries(dates).forEach(([date, stats]) => {
          if (!dailyProductivity[date]) {
            dailyProductivity[date] = { planned: 0, realized: 0 };
          }

          dailyProductivity[date].planned += stats.planned;
          dailyProductivity[date].realized += stats.realized;

          employeeStats[employeeId].planned += stats.planned;
          employeeStats[employeeId].realized += stats.realized;

          totalPlanned += stats.planned;
          totalRealized += stats.realized;
        });
      });

      totalPlanned = Math.round(totalPlanned * 10) / 10;
      totalRealized = Math.round(totalRealized * 10) / 10;
      const overallProductivity = totalPlanned > 0 ? Math.round((totalRealized / totalPlanned) * 1000) / 10 : 0;
      const overallGap = Math.round((totalRealized - totalPlanned) * 10) / 10;

      let criticalDays = 0;
      Object.values(dailyProductivity).forEach(day => {
        if (day.planned > 0) {
          const dayProductivity = (day.realized / day.planned) * 100;
          if (dayProductivity < 70) {
            criticalDays++;
          }
        }
      });

      let topEmployee: { name: string; percentage: number } | null = null;
      let maxPercentage = 0;

      Object.values(employeeStats).forEach(emp => {
        if (emp.planned > 0) {
          const percentage = Math.round((emp.realized / emp.planned) * 1000) / 10;
          if (percentage > maxPercentage) {
            maxPercentage = percentage;
            topEmployee = { name: emp.name.split(' ')[0], percentage };
          }
        }
      });

      setData({
        totalPlanned,
        totalRealized,
        overallProductivity,
        overallGap,
        criticalDays,
        topEmployee,
      });
    } catch (error) {
      console.error('Error loading system overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm animate-pulse">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-200 rounded-lg mb-3"></div>
            <div className="h-7 sm:h-8 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg mb-2 sm:mb-3">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.totalPlanned}</p>
        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Total Planejado</p>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg mb-2 sm:mb-3">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.totalRealized}</p>
        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Total Realizado</p>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${
            data.overallProductivity >= 110 ? 'bg-blue-100' :
            data.overallProductivity >= 90 ? 'bg-green-100' :
            data.overallProductivity >= 70 ? 'bg-orange-100' : 'bg-red-100'
          }`}>
            <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${
              data.overallProductivity >= 110 ? 'text-blue-600' :
              data.overallProductivity >= 90 ? 'text-green-600' :
              data.overallProductivity >= 70 ? 'text-orange-600' : 'text-red-600'
            }`} />
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            data.overallProductivity >= 110 ? 'bg-blue-100 text-blue-700' :
            data.overallProductivity >= 90 ? 'bg-green-100 text-green-700' :
            data.overallProductivity >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
          }`}>
            {data.overallProductivity >= 110 ? 'BLUE' :
             data.overallProductivity >= 90 ? 'GREEN' :
             data.overallProductivity >= 70 ? 'ORANGE' : 'RED'}
          </span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.overallProductivity}%</p>
        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Produtividade Geral</p>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 ${
          data.overallGap >= 0 ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {data.overallGap >= 0 ? (
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          )}
        </div>
        <p className={`text-xl sm:text-2xl font-bold ${data.overallGap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {data.overallGap}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Gap Geral</p>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg mb-2 sm:mb-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.criticalDays}</p>
        <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Dias Criticos</p>
        {data.criticalDays > 0 && (
          <p className="text-[10px] text-orange-600 mt-0.5">&lt; 70% aderencia</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg mb-2 sm:mb-3">
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        {data.topEmployee ? (
          <>
            <p className="text-lg font-bold text-slate-900 truncate">{data.topEmployee.name}</p>
            <p className="text-xs text-slate-600 mt-1">Top Colaborador</p>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">{data.topEmployee.percentage}%</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-400">-</p>
            <p className="text-xs text-slate-600 mt-1">Top Colaborador</p>
          </>
        )}
      </div>
    </div>
  );
}
