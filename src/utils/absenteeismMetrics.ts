import type {
  ParsedEmployee,
  DailyRecord,
  AbsenteeismMetrics,
  TeamMetrics,
  EmployeeMetrics,
  TrendData,
  HeatmapData,
  AbsenteeismFilter,
  AbsenceType,
  AbsenteeismRecord,
} from '../types/absenteeism';

const EMPTY_TYPE_METRICS = (): Record<AbsenceType, { hours: number; count: number }> => ({
  saude: { hours: 0, count: 0 },
  injustificada: { hours: 0, count: 0 },
  atraso: { hours: 0, count: 0 },
  ferias: { hours: 0, count: 0 },
  folga: { hours: 0, count: 0 },
  feriado: { hours: 0, count: 0 },
  compensacao: { hours: 0, count: 0 },
  licenca: { hours: 0, count: 0 },
  normal: { hours: 0, count: 0 },
  outros: { hours: 0, count: 0 },
});

function filterRecords(records: DailyRecord[], filter?: AbsenteeismFilter): DailyRecord[] {
  if (!filter) return records;

  return records.filter(r => {
    if (filter.dateStart && r.date < filter.dateStart) return false;
    if (filter.dateEnd && r.date > filter.dateEnd) return false;
    if (filter.absenceTypes?.length && !filter.absenceTypes.includes(r.absenceType)) return false;
    if (filter.isComputable !== undefined && r.isComputable !== filter.isComputable) return false;
    return true;
  });
}

function filterEmployees(employees: ParsedEmployee[], filter?: AbsenteeismFilter): ParsedEmployee[] {
  if (!filter) return employees;

  return employees.filter(e => {
    if (filter.teams?.length && e.info.team && !filter.teams.includes(e.info.team)) return false;
    if (filter.positions?.length && e.info.position && !filter.positions.includes(e.info.position)) return false;
    if (filter.employees?.length && !filter.employees.includes(e.info.name)) return false;
    if (filter.sectors?.length && e.info.sector && !filter.sectors.includes(e.info.sector)) return false;
    if (filter.units?.length && e.info.unit && !filter.units.includes(e.info.unit)) return false;
    return true;
  }).map(e => ({
    ...e,
    records: filterRecords(e.records, filter),
  }));
}

export function calculateMetrics(records: DailyRecord[]): AbsenteeismMetrics {
  const byType = EMPTY_TYPE_METRICS();

  let totalAbsentHours = 0;
  let totalExpectedHours = 0;
  let computableHours = 0;
  let nonComputableHours = 0;
  let frequency = 0;

  for (const record of records) {
    totalExpectedHours += record.expectedHours;

    if (record.absentHours > 0) {
      totalAbsentHours += record.absentHours;

      const absenceType = record.absenceType in byType ? record.absenceType : 'outros';
      byType[absenceType].hours += record.absentHours;
      byType[absenceType].count++;

      if (record.isComputable) {
        computableHours += record.absentHours;
        frequency++;
      } else {
        nonComputableHours += record.absentHours;
      }
    }
  }

  if (totalExpectedHours === 0) {
    const totalNormal = records.reduce((sum, r) => sum + r.normalHours, 0);
    totalExpectedHours = totalNormal + totalAbsentHours;
  }

  const absenteeismRate = totalExpectedHours > 0
    ? (computableHours / totalExpectedHours) * 100
    : 0;

  const severity = frequency > 0 ? computableHours / frequency : 0;

  const totalComputableEvents =
    byType.saude.count +
    byType.injustificada.count +
    byType.atraso.count +
    byType.licenca.count +
    byType.outros.count;

  const injustifiedPercentage = totalComputableEvents > 0
    ? (byType.injustificada.count / totalComputableEvents) * 100
    : 0;

  const healthPercentage = totalComputableEvents > 0
    ? (byType.saude.count / totalComputableEvents) * 100
    : 0;

  const delayPercentage = totalComputableEvents > 0
    ? (byType.atraso.count / totalComputableEvents) * 100
    : 0;

  return {
    totalAbsentHours,
    totalExpectedHours,
    absenteeismRate,
    frequency,
    severity,
    byType,
    injustifiedPercentage,
    healthPercentage,
    delayPercentage,
    computableHours,
    nonComputableHours,
  };
}

export function calculateOverallMetrics(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter
): AbsenteeismMetrics {
  const filtered = filterEmployees(employees, filter);
  const allRecords = filtered.flatMap(e => e.records);
  return calculateMetrics(allRecords);
}

export function calculateTeamMetrics(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter
): TeamMetrics[] {
  const filtered = filterEmployees(employees, filter);
  const teamMap = new Map<string, ParsedEmployee[]>();

  for (const employee of filtered) {
    const team = employee.info.team || 'Sem Equipe';
    if (!teamMap.has(team)) {
      teamMap.set(team, []);
    }
    teamMap.get(team)!.push(employee);
  }

  const results: TeamMetrics[] = [];

  for (const [team, teamEmployees] of teamMap) {
    const allRecords = teamEmployees.flatMap(e => e.records);
    results.push({
      team,
      metrics: calculateMetrics(allRecords),
      employeeCount: teamEmployees.length,
    });
  }

  return results.sort((a, b) => b.metrics.absenteeismRate - a.metrics.absenteeismRate);
}

export function calculateEmployeeMetrics(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter,
  recurrenceThreshold = 3
): EmployeeMetrics[] {
  const filtered = filterEmployees(employees, filter);

  return filtered.map(employee => {
    const metrics = calculateMetrics(employee.records);
    const eventCount = metrics.frequency;

    return {
      employee: employee.info,
      metrics,
      eventCount,
      isRecurrent: eventCount >= recurrenceThreshold,
    };
  }).sort((a, b) => b.metrics.computableHours - a.metrics.computableHours);
}

export function calculateTrendData(
  employees: ParsedEmployee[],
  groupBy: 'week' | 'month' = 'week',
  filter?: AbsenteeismFilter
): TrendData[] {
  const filtered = filterEmployees(employees, filter);
  const allRecords = filtered.flatMap(e => e.records);

  const groups = new Map<string, DailyRecord[]>();

  for (const record of allRecords) {
    let key: string;

    if (groupBy === 'week') {
      const weekStart = new Date(record.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  const trends: TrendData[] = [];

  const sortedKeys = Array.from(groups.keys()).sort();

  for (const key of sortedKeys) {
    const records = groups.get(key)!;
    const metrics = calculateMetrics(records);

    let period: string;
    if (groupBy === 'week') {
      const date = new Date(key);
      period = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      const [year, month] = key.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      period = `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
    }

    trends.push({
      period,
      absenteeismRate: metrics.absenteeismRate,
      absentHours: metrics.computableHours,
      frequency: metrics.frequency,
    });
  }

  return trends;
}

export function calculateHeatmapData(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter
): HeatmapData[] {
  const filtered = filterEmployees(employees, filter);
  const data: HeatmapData[] = [];

  const teams = new Set<string>();
  for (const employee of filtered) {
    teams.add(employee.info.team || 'Sem Equipe');
  }

  for (const team of teams) {
    const teamEmployees = filtered.filter(e => (e.info.team || 'Sem Equipe') === team);
    const allRecords = teamEmployees.flatMap(e => e.records);

    for (let day = 0; day < 7; day++) {
      const dayRecords = allRecords.filter(r => r.date.getDay() === day && r.isComputable);
      const absentHours = dayRecords.reduce((sum, r) => sum + r.absentHours, 0);

      data.push({
        team,
        dayOfWeek: day,
        value: absentHours,
      });
    }
  }

  return data;
}

export function calculateParetoData(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter
): { reason: string; hours: number; percentage: number; cumulative: number }[] {
  const filtered = filterEmployees(employees, filter);
  const allRecords = filtered.flatMap(e => e.records).filter(r => r.isComputable && r.absentHours > 0);

  const reasonMap = new Map<string, number>();

  for (const record of allRecords) {
    const reason = record.reason || record.absenceType;
    const current = reasonMap.get(reason) || 0;
    reasonMap.set(reason, current + record.absentHours);
  }

  const sorted = Array.from(reasonMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [, hours]) => sum + hours, 0);

  let cumulative = 0;
  return sorted.map(([reason, hours]) => {
    const percentage = total > 0 ? (hours / total) * 100 : 0;
    cumulative += percentage;
    return {
      reason,
      hours: Number(hours.toFixed(1)),
      percentage: Number(percentage.toFixed(1)),
      cumulative: Number(cumulative.toFixed(1))
    };
  });
}

export function detectAlerts(
  employees: ParsedEmployee[],
  settings: {
    targetRate: number;
    alertThreshold: number;
    previousPeriodData?: AbsenteeismMetrics;
  }
): string[] {
  const alerts: string[] = [];
  const overall = calculateOverallMetrics(employees);
  const teamMetrics = calculateTeamMetrics(employees);
  const trendData = calculateTrendData(employees, 'week');

  if (overall.absenteeismRate > settings.targetRate) {
    const difference = overall.absenteeismRate - settings.targetRate;
    alerts.push(
      `Taxa de absenteísmo (${overall.absenteeismRate.toFixed(1)}%) esta ${difference.toFixed(1)}% acima da meta (${settings.targetRate}%)`
    );
  }

  for (const team of teamMetrics) {
    const percentageAbove = ((team.metrics.absenteeismRate / overall.absenteeismRate - 1) * 100);
    if (percentageAbove > settings.alertThreshold) {
      alerts.push(
        `Equipe "${team.team}" está +${percentageAbove.toFixed(0)}% acima da média geral (${team.metrics.absenteeismRate.toFixed(1)}% vs ${overall.absenteeismRate.toFixed(1)}%)`
      );
    }
  }

  if (overall.injustifiedPercentage > 40) {
    alerts.push(
      `Faltas injustificadas representam ${overall.injustifiedPercentage.toFixed(0)}% do total - atenção necessária`
    );
  }

  if (overall.severity > 8) {
    alerts.push(
      `Alta gravidade média por evento (${overall.severity.toFixed(1)}h) - investigar causas de ausências prolongadas`
    );
  }

  if (trendData.length >= 2) {
    const lastWeek = trendData[trendData.length - 1];
    const previousWeek = trendData[trendData.length - 2];
    const weekChange = lastWeek.absenteeismRate - previousWeek.absenteeismRate;

    if (weekChange > 1.5) {
      alerts.push(
        `Taxa aumentou ${weekChange.toFixed(1)}% na última semana (${previousWeek.absenteeismRate.toFixed(1)}% → ${lastWeek.absenteeismRate.toFixed(1)}%)`
      );
    }
  }

  if (settings.previousPeriodData) {
    const injustifiedChange =
      overall.injustifiedPercentage - settings.previousPeriodData.injustifiedPercentage;
    if (Math.abs(injustifiedChange) > 10) {
      const direction = injustifiedChange > 0 ? 'aumentaram' : 'diminuiram';
      alerts.push(
        `Injustificadas ${direction} ${Math.abs(injustifiedChange).toFixed(0)}% vs período anterior (${settings.previousPeriodData.injustifiedPercentage.toFixed(0)}% → ${overall.injustifiedPercentage.toFixed(0)}%)`
      );
    }

    const rateChange = overall.absenteeismRate - settings.previousPeriodData.absenteeismRate;
    if (Math.abs(rateChange) > 0.5) {
      const direction = rateChange > 0 ? 'Aumento' : 'Redução';
      alerts.push(
        `${direction} de ${Math.abs(rateChange).toFixed(1)}% na taxa geral vs período anterior`
      );
    }
  }

  const topTeam = teamMetrics[0];
  const avgTeamRate = teamMetrics.reduce((sum, t) => sum + t.metrics.absenteeismRate, 0) / teamMetrics.length;
  if (topTeam && topTeam.metrics.absenteeismRate > avgTeamRate * 1.5) {
    alerts.push(
      `Equipe "${topTeam.team}" necessita atenção urgente - taxa ${topTeam.metrics.absenteeismRate.toFixed(1)}% muito acima da média das equipes`
    );
  }

  if (overall.byType.saude.hours > overall.computableHours * 0.6) {
    alerts.push(
      `Ausências por saúde representam ${((overall.byType.saude.hours / overall.computableHours) * 100).toFixed(0)}% - avaliar saude ocupacional`
    );
  }

  return alerts;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
}

export function getUniqueValues(
  employees: ParsedEmployee[]
): {
  teams: string[];
  positions: string[];
  sectors: string[];
  units: string[];
  employeeNames: string[];
  reasons: string[];
} {
  const teams = new Set<string>();
  const positions = new Set<string>();
  const sectors = new Set<string>();
  const units = new Set<string>();
  const employeeNames = new Set<string>();
  const reasons = new Set<string>();

  for (const employee of employees) {
    if (employee.info.team) teams.add(employee.info.team);
    if (employee.info.position) positions.add(employee.info.position);
    if (employee.info.sector) sectors.add(employee.info.sector);
    if (employee.info.unit) units.add(employee.info.unit);
    employeeNames.add(employee.info.name);
    for (const record of employee.records) {
      if (record.reason) reasons.add(record.reason);
    }
  }

  return {
    teams: Array.from(teams).sort(),
    positions: Array.from(positions).sort(),
    sectors: Array.from(sectors).sort(),
    units: Array.from(units).sort(),
    employeeNames: Array.from(employeeNames).sort(),
    reasons: Array.from(reasons).sort(),
  };
}

export function convertToAbsenteeismRecords(
  employees: ParsedEmployee[],
  uploadId: string
): Omit<AbsenteeismRecord, 'id' | 'created_at'>[] {
  const records: Omit<AbsenteeismRecord, 'id' | 'created_at'>[] = [];

  for (const employee of employees) {
    for (const record of employee.records) {
      if (record.absentHours > 0 || record.absenceType !== 'normal') {
        records.push({
          upload_id: uploadId,
          employee_name: employee.info.name,
          employee_id_external: employee.info.registration,
          sector: employee.info.sector,
          unit: employee.info.unit,
          position: employee.info.position,
          team: employee.info.team,
          shift: employee.info.shift,
          record_date: record.date.toISOString().split('T')[0],
          absence_type: record.absenceType,
          status: record.isComputable ? 'computavel' : 'nao_computavel',
          expected_hours: record.expectedHours,
          absent_hours: record.absentHours,
          worked_hours: record.workedHours,
          overtime_hours: record.overtimeHours,
          reason: record.reason,
          raw_data: {
            dayOfWeek: record.dayOfWeek,
            normalHours: record.normalHours,
            observation: record.observation,
          },
        });
      }
    }
  }

  return records;
}

export function convertFromAbsenteeismRecords(
  records: AbsenteeismRecord[]
): ParsedEmployee[] {
  const employeeMap = new Map<string, ParsedEmployee>();

  const mapAbsenceType = (type: string): AbsenceType => {
    const validTypes: AbsenceType[] = [
      'saude',
      'injustificada',
      'atraso',
      'ferias',
      'folga',
      'feriado',
      'compensacao',
      'licenca',
      'normal',
      'outros',
    ];

    return validTypes.includes(type as AbsenceType) ? (type as AbsenceType) : 'outros';
  };

  for (const record of records) {
    const key = record.employee_name;

    if (!employeeMap.has(key)) {
      employeeMap.set(key, {
        info: {
          name: record.employee_name,
          registration: record.employee_id_external,
          sector: record.sector,
          unit: record.unit,
          position: record.position,
          team: record.team,
          shift: record.shift,
        },
        periodStart: new Date(record.record_date),
        periodEnd: new Date(record.record_date),
        records: [],
      });
    }

    const employee = employeeMap.get(key)!;
    const recordDate = new Date(record.record_date);

    if (recordDate < employee.periodStart) employee.periodStart = recordDate;
    if (recordDate > employee.periodEnd) employee.periodEnd = recordDate;

    const rawData = record.raw_data as { dayOfWeek?: string; normalHours?: number; observation?: string } | undefined;

    employee.records.push({
      date: recordDate,
      dayOfWeek: rawData?.dayOfWeek || ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][recordDate.getDay()],
      expectedHours: record.expected_hours,
      workedHours: record.worked_hours,
      absentHours: record.absent_hours,
      normalHours: rawData?.normalHours || record.worked_hours,
      overtimeHours: record.overtime_hours,
      reason: record.reason,
      observation: rawData?.observation,
      absenceType: mapAbsenceType(record.absence_type),
      isComputable: record.status === 'computavel',
    });
  }

  return Array.from(employeeMap.values());
}

export function exportToCSV(
  employees: ParsedEmployee[],
  filter?: AbsenteeismFilter
): string {
  const filtered = filterEmployees(employees, filter);
  const headers = [
    'Colaborador',
    'Matricula',
    'Equipe',
    'Cargo',
    'Setor',
    'Unidade',
    'Data',
    'Dia',
    'Horas Previstas',
    'Horas Trabalhadas',
    'Horas Faltantes',
    'Tipo',
    'Motivo',
    'Computavel',
  ];

  const rows: string[][] = [headers];

  for (const employee of filtered) {
    for (const record of employee.records) {
      if (record.absentHours > 0 || record.absenceType !== 'normal') {
        rows.push([
          employee.info.name,
          employee.info.registration || '',
          employee.info.team || '',
          employee.info.position || '',
          employee.info.sector || '',
          employee.info.unit || '',
          record.date.toLocaleDateString('pt-BR'),
          record.dayOfWeek,
          record.expectedHours.toFixed(2),
          record.workedHours.toFixed(2),
          record.absentHours.toFixed(2),
          record.absenceType,
          record.reason || '',
          record.isComputable ? 'Sim' : 'Nao',
        ]);
      }
    }
  }

  return rows.map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
}
