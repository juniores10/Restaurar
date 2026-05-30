import { supabase } from '../lib/supabase';

export interface ProductionRecord {
  colaborador: string;
  data: string;
  planejado: number;
  realizado: number;
  assunto?: string;
  equipe?: string;
  setor?: string;
  turno?: string;
}

export interface CollaboratorStats {
  colaborador: string;
  totalPlanejado: number;
  totalRealizado: number;
  produtividade: number;
  gap: number;
  diasAbaixo70: number;
  ultimoDiaProdutividade: number | null;
  melhorDia: { data: string; produtividade: number } | null;
  piorDia: { data: string; produtividade: number } | null;
  mediaProdutividade: number;
  diasConsecutivosAbaixo70: number;
}

export interface DayStats {
  data: string;
  planejado: number;
  realizado: number;
  aderencia: number;
}

export interface ProductionFilters {
  startDate?: string;
  endDate?: string;
  colaboradores?: string[];
  equipes?: string[];
  setores?: string[];
  dayOfWeek?: number[];
}

export const productionService = {
  async getProductionData(filters?: ProductionFilters): Promise<ProductionRecord[]> {
    try {
      let query = supabase
        .from('sector_productivity_records')
        .select(`
          employee_id,
          work_date,
          subject,
          points,
          sector_id,
          employees(
            id,
            name,
            team_id,
            department_id,
            teams(name)
          )
        `)
        .order('work_date', { ascending: false })
        .order('employee_id');

      if (filters?.startDate) {
        query = query.gte('work_date', filters.startDate);
      } else {
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 30);
        query = query.gte('work_date', defaultStart.toISOString().split('T')[0]);
      }

      if (filters?.endDate) {
        query = query.lte('work_date', filters.endDate);
      }

      const { data: rawRecords, error } = await query;

      if (error) {
        console.error('Error loading production data:', error);
        return [];
      }

      if (!rawRecords || rawRecords.length === 0) {
        return [];
      }

      const sectorIds = [...new Set(rawRecords.map((r: any) => r.sector_id).filter(Boolean))];
      let sectorsMap: { [key: string]: string } = {};

      if (sectorIds.length > 0) {
        const { data: sectors } = await supabase
          .from('data_types')
          .select('id, description')
          .in('id', sectorIds);

        if (sectors) {
          sectorsMap = sectors.reduce((acc: { [key: string]: string }, s: any) => {
            acc[s.id] = s.description;
            return acc;
          }, {});
        }
      }

      interface EmployeeDateStats {
        colaborador: string;
        equipe: string | null;
        setor: string | null;
        planejado: number;
        realizado: number;
        assuntos: string[];
      }

      const dateEmployeeMap: { [key: string]: EmployeeDateStats } = {};

      rawRecords.forEach((record: any) => {
        const employeeId = record.employee_id;
        const workDate = record.work_date;
        const subject = (record.subject || '').toLowerCase();
        const points = Number(record.points) || 0;
        const employeeName = record.employees?.name || 'Unknown';
        const teamName = record.employees?.teams?.name || null;
        const sectorName = record.sector_id ? sectorsMap[record.sector_id] || null : null;

        const key = `${workDate}_${employeeId}`;

        if (!dateEmployeeMap[key]) {
          dateEmployeeMap[key] = {
            colaborador: employeeName,
            equipe: teamName,
            setor: sectorName,
            planejado: 0,
            realizado: 0,
            assuntos: []
          };
        }

        if (subject.includes('planejado')) {
          dateEmployeeMap[key].planejado += points;
        } else if (subject.includes('realizado')) {
          dateEmployeeMap[key].realizado += points;
        }

        if (record.subject && !dateEmployeeMap[key].assuntos.includes(record.subject)) {
          dateEmployeeMap[key].assuntos.push(record.subject);
        }
      });

      let productionRecords: ProductionRecord[] = Object.entries(dateEmployeeMap).map(([key, stats]) => {
        const [date] = key.split('_');
        return {
          colaborador: stats.colaborador,
          data: date,
          planejado: Math.round(stats.planejado * 100) / 100,
          realizado: Math.round(stats.realizado * 100) / 100,
          assunto: stats.assuntos.join(', '),
          equipe: stats.equipe || undefined,
          setor: stats.setor || undefined,
          turno: undefined
        };
      });

      if (filters) {
        if (filters.colaboradores && filters.colaboradores.length > 0) {
          productionRecords = productionRecords.filter(d =>
            filters.colaboradores!.includes(d.colaborador)
          );
        }
        if (filters.equipes && filters.equipes.length > 0) {
          productionRecords = productionRecords.filter(d =>
            d.equipe && filters.equipes!.includes(d.equipe)
          );
        }
        if (filters.setores && filters.setores.length > 0) {
          productionRecords = productionRecords.filter(d =>
            d.setor && filters.setores!.includes(d.setor)
          );
        }
        if (filters.dayOfWeek && filters.dayOfWeek.length > 0) {
          productionRecords = productionRecords.filter(d => {
            const day = new Date(d.data).getDay();
            return filters.dayOfWeek!.includes(day);
          });
        }
      }

      return productionRecords;
    } catch (error) {
      console.error('Error in getProductionData:', error);
      return [];
    }
  },

  calculateProductivity(realizado: number, planejado: number): number | null {
    if (planejado === 0) return null;
    return (realizado / planejado) * 100;
  },

  getPerformanceColor(produtividade: number | null): string {
    if (produtividade === null) return 'gray';
    if (produtividade < 70) return 'red';
    if (produtividade < 90) return 'orange';
    if (produtividade < 110) return 'green';
    return 'blue';
  },

  getPerformanceBgColor(produtividade: number | null): string {
    if (produtividade === null) return 'bg-gray-100';
    if (produtividade < 70) return 'bg-red-100';
    if (produtividade < 90) return 'bg-orange-100';
    if (produtividade < 110) return 'bg-green-100';
    return 'bg-blue-100';
  },

  getPerformanceTextColor(produtividade: number | null): string {
    if (produtividade === null) return 'text-gray-700';
    if (produtividade < 70) return 'text-red-700';
    if (produtividade < 90) return 'text-orange-700';
    if (produtividade < 110) return 'text-green-700';
    return 'text-blue-700';
  },

  aggregateByDay(data: ProductionRecord[]): DayStats[] {
    const dayMap = new Map<string, { planejado: number; realizado: number }>();

    data.forEach(record => {
      const existing = dayMap.get(record.data) || { planejado: 0, realizado: 0 };
      dayMap.set(record.data, {
        planejado: existing.planejado + record.planejado,
        realizado: existing.realizado + record.realizado
      });
    });

    return Array.from(dayMap.entries())
      .map(([data, stats]) => ({
        data,
        planejado: stats.planejado,
        realizado: stats.realizado,
        aderencia: stats.planejado > 0 ? (stats.realizado / stats.planejado) * 100 : 0
      }))
      .sort((a, b) => a.data.localeCompare(b.data));
  },

  aggregateByCollaborator(data: ProductionRecord[]): CollaboratorStats[] {
    const collabMap = new Map<string, ProductionRecord[]>();

    data.forEach(record => {
      const existing = collabMap.get(record.colaborador) || [];
      existing.push(record);
      collabMap.set(record.colaborador, existing);
    });

    return Array.from(collabMap.entries()).map(([colaborador, records]) => {
      const totalPlanejado = records.reduce((sum, r) => sum + r.planejado, 0);
      const totalRealizado = records.reduce((sum, r) => sum + r.realizado, 0);
      const produtividade = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
      const gap = totalRealizado - totalPlanejado;

      const dailyStats = records.map(r => ({
        data: r.data,
        produtividade: r.planejado > 0 ? (r.realizado / r.planejado) * 100 : null
      })).filter(s => s.produtividade !== null);

      const diasAbaixo70 = dailyStats.filter(s => s.produtividade! < 70).length;

      const sortedByDate = [...records].sort((a, b) => b.data.localeCompare(a.data));
      const lastDay = sortedByDate[0];
      const ultimoDiaProdutividade = lastDay && lastDay.planejado > 0
        ? (lastDay.realizado / lastDay.planejado) * 100
        : null;

      const validDays = dailyStats.filter(s => s.produtividade !== null);
      const melhorDia = validDays.length > 0
        ? validDays.reduce((max, s) => s.produtividade! > max.produtividade! ? s : max)
        : null;

      const piorDia = validDays.length > 0
        ? validDays.reduce((min, s) => s.produtividade! < min.produtividade! ? s : min)
        : null;

      const mediaProdutividade = validDays.length > 0
        ? validDays.reduce((sum, s) => sum + s.produtividade!, 0) / validDays.length
        : 0;

      let diasConsecutivosAbaixo70 = 0;
      let maxConsecutivos = 0;
      sortedByDate.forEach(r => {
        const prod = r.planejado > 0 ? (r.realizado / r.planejado) * 100 : null;
        if (prod !== null && prod < 70) {
          diasConsecutivosAbaixo70++;
          maxConsecutivos = Math.max(maxConsecutivos, diasConsecutivosAbaixo70);
        } else {
          diasConsecutivosAbaixo70 = 0;
        }
      });

      return {
        colaborador,
        totalPlanejado,
        totalRealizado,
        produtividade,
        gap,
        diasAbaixo70,
        ultimoDiaProdutividade,
        melhorDia,
        piorDia,
        mediaProdutividade,
        diasConsecutivosAbaixo70: maxConsecutivos
      };
    });
  },

  getGlobalStats(data: ProductionRecord[]) {
    const totalPlanejado = data.reduce((sum, r) => sum + r.planejado, 0);
    const totalRealizado = data.reduce((sum, r) => sum + r.realizado, 0);
    const produtividadeGeral = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
    const gap = totalRealizado - totalPlanejado;

    const dayStats = this.aggregateByDay(data);
    const diasCriticos = dayStats.filter(d => d.aderencia < 70).length;

    const collabStats = this.aggregateByCollaborator(data);
    const topCollaborator = collabStats.length > 0
      ? collabStats.reduce((max, c) => c.produtividade > max.produtividade ? c : max)
      : null;

    return {
      totalPlanejado,
      totalRealizado,
      produtividadeGeral,
      gap,
      diasCriticos,
      topCollaborator
    };
  },

  getAlerts(data: ProductionRecord[]): string[] {
    const alerts: string[] = [];
    const collabStats = this.aggregateByCollaborator(data);

    collabStats.forEach(collab => {
      if (collab.diasConsecutivosAbaixo70 >= 3) {
        alerts.push(`${collab.colaborador} com ${collab.diasConsecutivosAbaixo70} dias seguidos abaixo de 70%`);
      }
    });

    const dayStats = this.aggregateByDay(data);
    dayStats.forEach(day => {
      if (day.aderencia < 70) {
        const date = new Date(day.data).toLocaleDateString('pt-BR');
        alerts.push(`Dia ${date} com aderência geral crítica (${day.aderencia.toFixed(1)}%)`);
      }
    });

    collabStats.forEach(collab => {
      if (collab.gap < -20 && collab.totalPlanejado > 50) {
        alerts.push(`${collab.colaborador} com planejado alto (${collab.totalPlanejado}) e gap negativo relevante (${collab.gap})`);
      }
    });

    return alerts.slice(0, 5);
  },

  getCollaboratorDetails(data: ProductionRecord[], colaborador: string) {
    const records = data.filter(r => r.colaborador === colaborador);
    const stats = this.aggregateByCollaborator(records)[0];

    const dailyData = records
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(r => ({
        data: r.data,
        planejado: r.planejado,
        realizado: r.realizado,
        produtividade: r.planejado > 0 ? (r.realizado / r.planejado) * 100 : null,
        assunto: r.assunto
      }));

    return {
      stats,
      dailyData
    };
  },

  exportToCSV(collabStats: CollaboratorStats[]): string {
    const headers = ['Colaborador', 'Planejado', 'Realizado', 'Produtividade (%)', 'Gap', 'Dias Abaixo 70%', 'Último Dia (%)'];
    const rows = collabStats.map(c => [
      c.colaborador,
      c.totalPlanejado.toString(),
      c.totalRealizado.toString(),
      c.produtividade.toFixed(1),
      c.gap.toString(),
      c.diasAbaixo70.toString(),
      c.ultimoDiaProdutividade ? c.ultimoDiaProdutividade.toFixed(1) : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
};
