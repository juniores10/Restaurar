import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Filter, ChevronDown,
  Target, Gauge, Factory, Calendar, CheckCircle2, AlertTriangle,
  Trash2, Award, ArrowUpRight, ArrowDownRight, Zap, ShieldCheck
} from 'lucide-react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, ReferenceLine,
  AreaChart, Area, Cell
} from 'recharts';
import { OEESection } from './OEESection';
import { ProductionVolumeSection } from './ProductionVolumeSection';

interface Team {
  id: string;
  name: string;
}

interface SectionSummary {
  section_key: string;
  title: string;
  total: number;
  dailyData: { date: string; value: number }[];
}

interface SectionMeta {
  section_key: string;
  title: string;
  has_subject: boolean;
  show_quality_adherence: boolean;
  show_day_total: boolean;
}

interface SubjectDailyData {
  section_key: string;
  subject: string;
  date: string;
  value: number;
}

interface UploadInfo {
  id: string;
  team_id: string;
  file_name: string;
  reference_month: string;
  description?: string;
}

interface ParameterRecord {
  id: string;
  team_id: string;
  reference_month: string;
  meta_diaria: number;
  oee: number;
  capacidade_dia: number;
  meta_mensal_volume: number;
  dias_uteis_mensal: number;
  meta_diaria_volume: number;
  ritmo_atual_volume: number;
  ritmo_atual_porcentagem: number;
}

interface TotalParameterRecord {
  id: string;
  reference_month: string;
  meta_diaria: number;
  oee: number;
  capacidade_dia: number;
  meta_mensal_volume: number;
  dias_uteis_mensal: number;
  meta_diaria_volume: number;
  ritmo_atual_volume: number;
  ritmo_atual_porcentagem: number;
}

interface DashboardData {
  upload: UploadInfo;
  sections: SectionSummary[];
  sectionMetas: SectionMeta[];
  subjectData: SubjectDailyData[];
  totalByDay: { date: string; [key: string]: number | string }[];
  allDates: string[];
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function TeamProductivityDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compareMonth, setCompareMonth] = useState('');
  const [compareData, setCompareData] = useState<DashboardData | null>(null);
  const [parameters, setParameters] = useState<ParameterRecord | null>(null);
  const [totalParameters, setTotalParameters] = useState<TotalParameterRecord | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadUploads(selectedTeam);
      setSelectedMonth('');
      setDashboardData(null);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTeam && selectedMonth) {
      loadDashboardData(selectedTeam, selectedMonth, setDashboardData);
      loadParameters(selectedTeam, selectedMonth);
      loadTotalParameters(selectedMonth);
    }
  }, [selectedTeam, selectedMonth]);

  useEffect(() => {
    if (selectedTeam && compareMonth) {
      loadDashboardData(selectedTeam, compareMonth, setCompareData);
    } else {
      setCompareData(null);
    }
  }, [selectedTeam, compareMonth]);

  const loadTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name').order('name');
    setTeams(data || []);
  };

  const loadUploads = async (teamId: string) => {
    const { data } = await supabase
      .from('team_productivity_uploads')
      .select('id, team_id, file_name, reference_month, description')
      .eq('team_id', teamId)
      .order('reference_month', { ascending: false });
    setUploads(data || []);
    if (data && data.length > 0) {
      setSelectedMonth(data[0].reference_month);
    }
  };

  const loadParameters = async (teamId: string, refMonth: string) => {
    const { data } = await supabase
      .from('team_productivity_parameters')
      .select('*')
      .eq('team_id', teamId)
      .eq('reference_month', refMonth)
      .maybeSingle();
    setParameters(data);
  };

  const loadTotalParameters = async (refMonth: string) => {
    const { data } = await supabase
      .from('team_productivity_total_parameters')
      .select('*')
      .eq('reference_month', refMonth)
      .maybeSingle();
    setTotalParameters(data);
  };

  const loadDashboardData = async (teamId: string, refMonth: string, setter: (d: DashboardData | null) => void) => {
    setIsLoading(true);
    try {
      const upload = uploads.find(u => u.team_id === teamId && u.reference_month === refMonth);
      if (!upload) { setter(null); return; }

      const [sectionsRes, recordsRes] = await Promise.all([
        supabase
          .from('team_productivity_sections')
          .select('*')
          .eq('upload_id', upload.id)
          .eq('status', 0)
          .order('display_order'),
        supabase
          .from('team_productivity_records')
          .select('*')
          .eq('upload_id', upload.id)
          .order('work_date')
      ]);

      const sections = sectionsRes.data || [];
      const records = recordsRes.data || [];
      const allDates = [...new Set(records.map(r => r.work_date))].sort();

      const sectionMetas: SectionMeta[] = sections.map(sec => ({
        section_key: sec.section_key,
        title: sec.title,
        has_subject: sec.has_subject,
        show_quality_adherence: sec.show_quality_adherence,
        show_day_total: sec.show_day_total,
      }));

      const subjectData: SubjectDailyData[] = records
        .filter(r => r.subject)
        .map(r => ({
          section_key: r.section_type,
          subject: r.subject,
          date: r.work_date,
          value: parseFloat(r.points) || 0,
        }));

      const sectionSummaries: SectionSummary[] = sections.map(sec => {
        const secRecords = records.filter(r => r.section_type === sec.section_key);
        const total = secRecords.reduce((sum, r) => sum + (parseFloat(r.points) || 0), 0);
        const dailyMap: Record<string, number> = {};
        secRecords.forEach(r => {
          dailyMap[r.work_date] = (dailyMap[r.work_date] || 0) + (parseFloat(r.points) || 0);
        });
        const dailyData = allDates.map(d => ({ date: d, value: dailyMap[d] || 0 }));
        return { section_key: sec.section_key, title: sec.title, total, dailyData };
      });

      const totalByDay = allDates.map(date => {
        const entry: { date: string; [key: string]: number | string } = {
          date: date.slice(5).replace('-', '/')
        };
        sectionSummaries.forEach(sec => {
          const found = sec.dailyData.find(d => d.date === date);
          entry[sec.section_key] = found?.value || 0;
        });
        return entry;
      });

      setter({ upload, sections: sectionSummaries, sectionMetas, subjectData, totalByDay, allDates });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setter(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonthLabel = (refMonth: string) => {
    const [y, m] = refMonth.split('-');
    return `${MONTH_LABELS[parseInt(m) - 1]}/${y}`;
  };

  const getSectionComparison = (key: string) => {
    if (!dashboardData || !compareData) return null;
    const curr = dashboardData.sections.find(s => s.section_key === key);
    const prev = compareData.sections.find(s => s.section_key === key);
    if (!curr || !prev || prev.total === 0) return null;
    return ((curr.total - prev.total) / prev.total) * 100;
  };

  const kpiMetrics = useMemo(() => {
    if (!dashboardData) return null;
    const { subjectData, sectionMetas, allDates } = dashboardData;

    const getSubjectTotal = (sectionKey: string, subjectMatch: string) => {
      return subjectData
        .filter(d => d.section_key === sectionKey && d.subject.toLowerCase().includes(subjectMatch))
        .reduce((sum, d) => sum + d.value, 0);
    };

    const getSubjectDailyMap = (sectionKey: string, subjectMatch: string) => {
      const map: Record<string, number> = {};
      subjectData
        .filter(d => d.section_key === sectionKey && d.subject.toLowerCase().includes(subjectMatch))
        .forEach(d => { map[d.date] = (map[d.date] || 0) + d.value; });
      return map;
    };

    let totalPlanejado = 0;
    let totalRealizado = 0;
    let totalRefugo = 0;
    const dailyAdherence: { date: string; label: string; adherence: number; planejado: number; realizado: number }[] = [];
    const dailyQuality: { date: string; label: string; quality: number; refugo: number; realizado: number }[] = [];
    const dailyRefugo: { date: string; label: string; refugo: number }[] = [];
    let daysAboveMeta = 0;
    let bestDay = { date: '', value: 0 };
    let worstDay = { date: '', value: Infinity };
    let sectionsWithSubjects = 0;

    sectionMetas.forEach(sec => {
      if (!sec.has_subject) return;
      const planejadoMap = getSubjectDailyMap(sec.section_key, 'planejado');
      const realizadoMap = getSubjectDailyMap(sec.section_key, 'realizado');
      const refugoMap = getSubjectDailyMap(sec.section_key, 'refugo');

      const hasPlanejado = Object.values(planejadoMap).some(v => v > 0);
      const hasRealizado = Object.values(realizadoMap).some(v => v > 0);
      if (!hasPlanejado || !hasRealizado) return;

      sectionsWithSubjects++;
      const secPlanejado = getSubjectTotal(sec.section_key, 'planejado');
      const secRealizado = getSubjectTotal(sec.section_key, 'realizado');
      const secRefugo = getSubjectTotal(sec.section_key, 'refugo');
      totalPlanejado += secPlanejado;
      totalRealizado += secRealizado;
      totalRefugo += secRefugo;

      allDates.forEach(date => {
        const p = planejadoMap[date] || 0;
        const r = realizadoMap[date] || 0;
        const ref = refugoMap[date] || 0;

        if (p > 0 && r > 0) {
          const adh = (r / p) * 100;
          const existingAdh = dailyAdherence.find(d => d.date === date);
          if (existingAdh) {
            existingAdh.planejado += p;
            existingAdh.realizado += r;
            existingAdh.adherence = (existingAdh.realizado / existingAdh.planejado) * 100;
          } else {
            dailyAdherence.push({
              date,
              label: date.slice(5).replace('-', '/'),
              adherence: adh,
              planejado: p,
              realizado: r,
            });
          }
        }

        if (r > 0) {
          const qPct = ref > 0 ? (ref / r) * 100 : 0;
          const existingQ = dailyQuality.find(d => d.date === date);
          if (existingQ) {
            existingQ.refugo += ref;
            existingQ.realizado += r;
            existingQ.quality = existingQ.realizado > 0 ? (existingQ.refugo / existingQ.realizado) * 100 : 0;
          } else {
            dailyQuality.push({
              date,
              label: date.slice(5).replace('-', '/'),
              quality: qPct,
              refugo: ref,
              realizado: r,
            });
          }
        }

        if (ref > 0) {
          const existingRef = dailyRefugo.find(d => d.date === date);
          if (existingRef) {
            existingRef.refugo += ref;
          } else {
            dailyRefugo.push({ date, label: date.slice(5).replace('-', '/'), refugo: ref });
          }
        }
      });
    });

    const meta = parameters?.meta_diaria_volume || 0;
    dashboardData.totalByDay.forEach((day, idx) => {
      const totalDay = dashboardData.sections.reduce((sum, sec) => sum + (Number(day[sec.section_key]) || 0), 0);
      const dateStr = allDates[idx];
      if (meta > 0 && totalDay >= meta) daysAboveMeta++;
      if (totalDay > bestDay.value && totalDay > 0) bestDay = { date: dateStr || '', value: totalDay };
      if (totalDay < worstDay.value && totalDay > 0) worstDay = { date: dateStr || '', value: totalDay };
    });

    if (worstDay.value === Infinity) worstDay = { date: '', value: 0 };

    const performanceAdherence = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
    const qualityRate = totalRealizado > 0 ? (totalRefugo / totalRealizado) * 100 : 0;

    dailyAdherence.sort((a, b) => a.date.localeCompare(b.date));
    dailyQuality.sort((a, b) => a.date.localeCompare(b.date));
    dailyRefugo.sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalPlanejado,
      totalRealizado,
      totalRefugo,
      performanceAdherence,
      qualityRate,
      dailyAdherence,
      dailyQuality,
      dailyRefugo,
      daysAboveMeta,
      bestDay,
      worstDay,
      sectionsWithSubjects,
      totalDays: allDates.length,
      meta,
    };
  }, [dashboardData, parameters]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Equipe</label>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8"
            >
              <option value="">Selecione...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {selectedTeam && uploads.length > 0 && (
          <>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8"
                >
                  {uploads.map(u => (
                    <option key={u.id} value={u.reference_month}>{u.file_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Filter className="w-3.5 h-3.5 inline mr-1" />
                Comparar com
              </label>
              <div className="relative">
                <select
                  value={compareMonth}
                  onChange={(e) => setCompareMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8"
                >
                  <option value="">Sem comparacao</option>
                  {uploads.filter(u => u.reference_month !== selectedMonth).map(u => (
                    <option key={u.id} value={u.reference_month}>{u.file_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </>
        )}
      </div>

      {!selectedTeam && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Selecione uma equipe para visualizar o dashboard</p>
        </div>
      )}

      {selectedTeam && !dashboardData && !isLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum dado encontrado para este periodo.</p>
          <p className="text-sm text-gray-400 mt-1">Adicione dados na aba "Lancamentos".</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}

      {dashboardData && !isLoading && (
        <>
          {totalParameters && (
            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Referencias Totais (Todas as Equipes)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'OEE', value: `${Number(totalParameters.oee).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, icon: Gauge, color: 'emerald' },
                  { label: 'Capacidade/Dia', value: Number(totalParameters.capacidade_dia).toLocaleString('pt-BR'), icon: Factory, color: 'amber' },
                  { label: 'Meta Mensal', value: Number(totalParameters.meta_mensal_volume).toLocaleString('pt-BR'), icon: Target, color: 'rose' },
                  { label: 'Dias Uteis', value: String(totalParameters.dias_uteis_mensal), icon: Calendar, color: 'sky' },
                  { label: 'Meta Dia (Vol)', value: Number(totalParameters.meta_diaria_volume).toLocaleString('pt-BR'), icon: Target, color: 'orange' },
                ].map((item, idx) => {
                  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
                    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
                    sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
                    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
                  };
                  const c = colorMap[item.color];
                  return (
                    <div key={idx} className={`${c.bg} border ${c.border} rounded-lg px-3 py-3 text-center`}>
                      <item.icon className={`w-4 h-4 ${c.text} mx-auto mb-1.5`} />
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-tight mb-1">{item.label}</p>
                      <p className={`text-lg font-bold ${c.text}`}>{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parameters && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Referencias da Equipe</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'OEE', value: `${Number(parameters.oee).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, icon: Gauge, color: 'emerald' },
                  { label: 'Capacidade/Dia', value: Number(parameters.capacidade_dia).toLocaleString('pt-BR'), icon: Factory, color: 'amber' },
                  { label: 'Meta Mensal', value: Number(parameters.meta_mensal_volume).toLocaleString('pt-BR'), icon: Target, color: 'rose' },
                  { label: 'Dias Uteis', value: String(parameters.dias_uteis_mensal), icon: Calendar, color: 'sky' },
                  { label: 'Meta Dia (Vol)', value: Number(parameters.meta_diaria_volume).toLocaleString('pt-BR'), icon: Target, color: 'orange' },
                ].map((item, idx) => {
                  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
                    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
                    sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
                    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
                  };
                  const c = colorMap[item.color];
                  return (
                    <div key={idx} className={`${c.bg} border ${c.border} rounded-lg px-3 py-3 text-center`}>
                      <item.icon className={`w-4 h-4 ${c.text} mx-auto mb-1.5`} />
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-tight mb-1">{item.label}</p>
                      <p className={`text-lg font-bold ${c.text}`}>{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {kpiMetrics && kpiMetrics.sectionsWithSubjects > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                icon={<Target className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-50"
                label="Planejado"
                value={kpiMetrics.totalPlanejado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                subLabel="Total do periodo"
                borderColor="border-blue-100"
              />
              <KpiCard
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="Realizado"
                value={kpiMetrics.totalRealizado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                subLabel={`${kpiMetrics.performanceAdherence.toFixed(1)}% do planejado`}
                subColor={kpiMetrics.performanceAdherence >= 90 ? 'text-emerald-600' : kpiMetrics.performanceAdherence >= 70 ? 'text-amber-600' : 'text-red-600'}
                borderColor="border-emerald-100"
              />
              <KpiCard
                icon={<Zap className="w-5 h-5 text-sky-600" />}
                iconBg="bg-sky-50"
                label="Aderencia Performance"
                value={`${kpiMetrics.performanceAdherence.toFixed(1)}%`}
                valueColor={kpiMetrics.performanceAdherence >= 90 ? 'text-emerald-700' : kpiMetrics.performanceAdherence >= 70 ? 'text-amber-700' : 'text-red-700'}
                subLabel="Realizado / Planejado"
                borderColor="border-sky-100"
              />
              <KpiCard
                icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-50"
                label="Aderencia Qualidade"
                value={`${kpiMetrics.qualityRate.toFixed(1)}%`}
                valueColor={kpiMetrics.qualityRate <= 2 ? 'text-emerald-700' : kpiMetrics.qualityRate <= 5 ? 'text-amber-700' : 'text-red-700'}
                subLabel="Refugo / Realizado"
                borderColor="border-teal-100"
              />
              <KpiCard
                icon={<Trash2 className="w-5 h-5 text-red-500" />}
                iconBg="bg-red-50"
                label="Refugo Total"
                value={kpiMetrics.totalRefugo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                subLabel={`${kpiMetrics.qualityRate.toFixed(1)}% da producao`}
                subColor={kpiMetrics.qualityRate <= 2 ? 'text-emerald-600' : kpiMetrics.qualityRate <= 5 ? 'text-amber-600' : 'text-red-600'}
                borderColor="border-red-100"
              />
              <KpiCard
                icon={<Award className="w-5 h-5 text-amber-600" />}
                iconBg="bg-amber-50"
                label="Melhor Dia"
                value={kpiMetrics.bestDay.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                subLabel={kpiMetrics.bestDay.date ? kpiMetrics.bestDay.date.slice(5).replace('-', '/') : '-'}
                borderColor="border-amber-100"
              />
            </div>
          )}

          {kpiMetrics && kpiMetrics.sectionsWithSubjects > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStatCard
                icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
                label="Dias Acima da Meta"
                value={kpiMetrics.meta > 0 ? String(kpiMetrics.daysAboveMeta) : '-'}
                total={kpiMetrics.meta > 0 ? `de ${kpiMetrics.totalDays} dias` : 'Meta nao definida'}
                color="emerald"
              />
              <MiniStatCard
                icon={<ArrowDownRight className="w-4 h-4 text-red-500" />}
                label="Dias Abaixo da Meta"
                value={kpiMetrics.meta > 0 ? String(kpiMetrics.totalDays - kpiMetrics.daysAboveMeta) : '-'}
                total={kpiMetrics.meta > 0 ? `de ${kpiMetrics.totalDays} dias` : 'Meta nao definida'}
                color="red"
              />
              <MiniStatCard
                icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                label="Pior Dia"
                value={kpiMetrics.worstDay.value > 0 ? kpiMetrics.worstDay.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}
                total={kpiMetrics.worstDay.date ? kpiMetrics.worstDay.date.slice(5).replace('-', '/') : ''}
                color="amber"
              />
              <MiniStatCard
                icon={<Gauge className="w-4 h-4 text-blue-600" />}
                label="Gap Planejado"
                value={kpiMetrics.totalPlanejado > 0
                  ? (kpiMetrics.totalRealizado - kpiMetrics.totalPlanejado).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                  : '-'}
                total={kpiMetrics.totalRealizado >= kpiMetrics.totalPlanejado ? 'Acima do planejado' : 'Abaixo do planejado'}
                color={kpiMetrics.totalRealizado >= kpiMetrics.totalPlanejado ? 'emerald' : 'red'}
              />
            </div>
          )}

          {kpiMetrics && kpiMetrics.sectionsWithSubjects > 0 && (
            <OEESection
              data={{
                totalPlanejado: kpiMetrics.totalPlanejado,
                totalRealizado: kpiMetrics.totalRealizado,
                totalRefugo: kpiMetrics.totalRefugo,
                totalDays: kpiMetrics.totalDays,
                diasUteis: parameters?.dias_uteis_mensal || totalParameters?.dias_uteis_mensal || kpiMetrics.totalDays,
                oeeTarget: parameters?.oee || totalParameters?.oee || 0,
                capacidadeDia: parameters?.capacidade_dia || totalParameters?.capacidade_dia || 0,
                dailyAdherence: kpiMetrics.dailyAdherence,
                dailyQuality: kpiMetrics.dailyQuality,
              }}
            />
          )}

          {kpiMetrics && kpiMetrics.sectionsWithSubjects > 0 && (parameters || totalParameters) && (
            <ProductionVolumeSection
              data={{
                capacidadeDia: parameters?.capacidade_dia || totalParameters?.capacidade_dia || 0,
                metaMensal: parameters?.meta_mensal_volume || totalParameters?.meta_mensal_volume || 0,
                metaDiaria: parameters?.meta_diaria_volume || totalParameters?.meta_diaria_volume || 0,
                diasUteis: parameters?.dias_uteis_mensal || totalParameters?.dias_uteis_mensal || kpiMetrics.totalDays,
                ritmoAtualVolume: parameters?.ritmo_atual_volume || totalParameters?.ritmo_atual_volume || 0,
                ritmoAtualPorcentagem: parameters?.ritmo_atual_porcentagem || totalParameters?.ritmo_atual_porcentagem || 0,
                totalRealizado: kpiMetrics.totalRealizado,
                totalPlanejado: kpiMetrics.totalPlanejado,
                dailyAdherence: kpiMetrics.dailyAdherence,
                allDates: dashboardData.allDates,
                totalByDay: dashboardData.totalByDay,
                sections: dashboardData.sections,
              }}
            />
          )}

          {kpiMetrics && kpiMetrics.sectionsWithSubjects > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {kpiMetrics.dailyAdherence.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-1">Aderencia de Performance Diaria</h3>
                  <p className="text-xs text-gray-400 mb-4">Realizado / Planejado por dia (%)</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={kpiMetrics.dailyAdherence} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} unit="%" />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                        formatter={(val: number, name: string) => {
                          if (name === 'adherence') return [`${val.toFixed(1)}%`, 'Aderencia'];
                          return [val.toLocaleString('pt-BR'), name];
                        }}
                      />
                      <ReferenceLine y={100} stroke="#10B981" strokeWidth={2} strokeDasharray="6 3" label={{ value: '100%', position: 'right', fill: '#10B981', fontSize: 10 }} />
                      <Bar dataKey="adherence" name="Aderencia" radius={[3, 3, 0, 0]}>
                        {kpiMetrics.dailyAdherence.map((entry, idx) => (
                          <Cell key={idx} fill={entry.adherence >= 100 ? '#10B981' : entry.adherence >= 80 ? '#F59E0B' : '#EF4444'} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {kpiMetrics.dailyRefugo.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-1">Refugo por Dia</h3>
                  <p className="text-xs text-gray-400 mb-4">Volume de refugo diario</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={kpiMetrics.dailyRefugo} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                        formatter={(val: number) => [val.toLocaleString('pt-BR'), 'Refugo']}
                      />
                      <Bar dataKey="refugo" name="Refugo" fill="#EF4444" radius={[3, 3, 0, 0]} opacity={0.85} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {kpiMetrics && kpiMetrics.dailyQuality.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Aderencia de Qualidade Diaria</h3>
              <p className="text-xs text-gray-400 mb-4">Refugo / Realizado por dia (%) - quanto menor, melhor</p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={kpiMetrics.dailyQuality} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(val: number, name: string) => {
                      if (name === 'quality') return [`${val.toFixed(1)}%`, 'Taxa Refugo'];
                      return [val.toLocaleString('pt-BR'), name];
                    }}
                  />
                  <ReferenceLine y={2} stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: '2% (meta)', position: 'right', fill: '#10B981', fontSize: 9 }} />
                  <ReferenceLine y={5} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: '5% (atencao)', position: 'right', fill: '#F59E0B', fontSize: 9 }} />
                  <Area type="monotone" dataKey="quality" name="quality" stroke="#14B8A6" strokeWidth={2} fill="url(#qualityGrad)" activeDot={{ r: 4, fill: '#14B8A6' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {kpiMetrics && kpiMetrics.dailyAdherence.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Planejado x Realizado por Dia</h3>
              <p className="text-xs text-gray-400 mb-4">Comparativo diario entre o que foi planejado e o que foi executado</p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={kpiMetrics.dailyAdherence} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(val: number, name: string) => [val.toLocaleString('pt-BR'), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="planejado" name="Planejado" fill="#93C5FD" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {dashboardData.totalByDay.length > 0 && dashboardData.sections.length > 0 && (() => {
            return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">Producao Diaria por Tabela</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={dashboardData.totalByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(val: number, name: string) => [val.toLocaleString('pt-BR', { maximumFractionDigits: 2 }), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {dashboardData.sections.map((sec, i) => (
                      <Bar key={sec.section_key} dataKey={sec.section_key} name={sec.title} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                    ))}
                    {parameters?.meta_diaria_volume ? (
                      <ReferenceLine y={Number(parameters.meta_diaria_volume)} stroke="#EF4444" strokeWidth={2} strokeDasharray="6 3" label={{ value: `Meta: ${Number(parameters.meta_diaria_volume).toLocaleString('pt-BR')}`, position: 'right', fill: '#EF4444', fontSize: 10 }} />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">Tendencia Acumulada</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboardData.totalByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(val: number, name: string) => [val.toLocaleString('pt-BR', { maximumFractionDigits: 2 }), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {dashboardData.sections.map((sec, i) => (
                      <Line
                        key={sec.section_key}
                        type="monotone"
                        dataKey={sec.section_key}
                        name={sec.title}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            );
          })()}

          {dashboardData.sections.length > 1 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-x-auto">
              <h3 className="font-semibold text-gray-800 mb-4">Resumo por Tabela</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tabela</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total do Periodo</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Media Diaria</th>
                    {compareData && <th className="text-right px-4 py-3 font-medium text-gray-600">Periodo Comparado</th>}
                    {compareData && <th className="text-right px-4 py-3 font-medium text-gray-600">Variacao</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboardData.sections.map((sec, i) => {
                    const daysWithData = sec.dailyData.filter(d => d.value > 0).length;
                    const avg = daysWithData > 0 ? sec.total / daysWithData : 0;
                    const compareSec = compareData?.sections.find(s => s.section_key === sec.section_key);
                    const pct = compareSec && compareSec.total > 0
                      ? ((sec.total - compareSec.total) / compareSec.total) * 100
                      : null;
                    return (
                      <tr key={sec.section_key} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="font-medium text-gray-800">{sec.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {sec.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {avg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </td>
                        {compareData && (
                          <td className="px-4 py-3 text-right text-gray-500">
                            {(compareSec?.total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </td>
                        )}
                        {compareData && (
                          <td className="px-4 py-3 text-right">
                            {pct !== null ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pct > 0 ? 'bg-green-100 text-green-700' : pct < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                {pct > 0 ? <TrendingUp className="w-3 h-3" /> : pct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {Math.abs(pct).toFixed(1)}%
                              </span>
                            ) : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, valueColor, subLabel, subColor, borderColor }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
  subLabel: string;
  subColor?: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-white border ${borderColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor || 'text-gray-800'}`}>{value}</p>
      <p className={`text-xs mt-1 ${subColor || 'text-gray-400'}`}>{subLabel}</p>
    </div>
  );
}

function MiniStatCard({ icon, label, value, total, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  total: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
    red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl px-4 py-3.5 flex items-center gap-3`}>
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        <p className="text-[10px] text-gray-400">{total}</p>
      </div>
    </div>
  );
}
