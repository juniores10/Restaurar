import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TimeRecord {
  employeeName: string;
  recordDate: string;
  clockIn1?: string;
  clockOut1?: string;
  clockIn2?: string;
  clockOut2?: string;
  clockIn1Location?: string;
  clockOut1Location?: string;
  clockIn2Location?: string;
  clockOut2Location?: string;
  totalHours?: number;
  bankHours?: number | null;
  accumulatedBalance?: number | null;
  recordType?: string;
  originalRecordType?: string;
  observations?: string;
  intervalHours?: number;
  missingHours?: number;
  normalHours?: number;
  overtime1?: number;
  overtime2?: number;
  adicionalNoturno?: number;
  horasNoturasReduzidas?: number;
}

interface TimeBankEntry {
  employeeName: string;
  entryDate: string;
  hours: number;
  reason: string;
}

interface ParsedTimeResult {
  time: string | null;
  location: string | null;
}

function parseTimeWithLocation(timeValue: any): ParsedTimeResult {
  if (!timeValue) return { time: null, location: null };

  if (typeof timeValue === 'string') {
    const trimmed = timeValue.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      return { time: `${hours}:${minutes}:${seconds}`, location: null };
    }
    if (trimmed.length > 0) {
      return { time: null, location: trimmed.toUpperCase() };
    }
    return { time: null, location: null };
  }

  if (typeof timeValue === 'number') {
    const hours = Math.floor(timeValue * 24);
    const minutes = Math.floor((timeValue * 24 * 60) % 60);
    return { time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`, location: null };
  }

  return { time: null, location: null };
}

function parseTime(timeValue: any): string | null {
  return parseTimeWithLocation(timeValue).time;
}

function parseDate(dateValue: any): string | null {
  if (!dateValue) return null;

  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();

    const skipPatterns = ['total', 'totais', '>>>', 'soma', 'subtotal', 'pontos', 'horas'];
    if (skipPatterns.some(p => trimmed.toLowerCase().includes(p))) {
      return null;
    }

    const dowDdmmyyyyMatch = trimmed.match(/^[A-Za-zÀ-ú]{3,},?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dowDdmmyyyyMatch) {
      const [, day, month, year] = dowDdmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const anyDateMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (anyDateMatch) {
      const [, day, month, year] = anyDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const yyyyDowMmDdMatch = trimmed.match(/^(\d{4})\s+\w{3}-(\d{2})-(\d{2})/);
    if (yyyyDowMmDdMatch) {
      const [, year, month, day] = yyyyDowMmDdMatch;
      return `${year}-${month}-${day}`;
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    return null;
  }

  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return null;
}

function normalizeRecordType(value: any): string {
  if (!value) return 'work';

  const normalized = String(value).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (['fo', 'folga', 'dayoff', 'day off', 'fo bh', 'bh'].some(v => normalized.includes(v))) {
    return 'dayoff';
  }
  if (['fer', 'ferias', 'vacation'].some(v => normalized.includes(v))) {
    return 'vacation';
  }
  if (['fa', 'falta', 'ausencia', 'absence'].some(v => normalized.includes(v))) {
    return 'absence';
  }

  const holidayKeywords = [
    'feriado', 'holiday', 'natal', 'ano novo', 'ano-novo',
    'carnaval', 'paixao', 'pascoa', 'tiradentes', 'corpus christi',
    'independencia', 'aparecida', 'finados', 'proclamacao', 'consciencia negra',
    'confraternizacao', 'sexta-feira santa', 'sexta feira santa'
  ];
  if (holidayKeywords.some(v => normalized.includes(v))) {
    return 'holiday';
  }

  if (['work', 'trabalho', 'normal'].some(v => normalized.includes(v))) {
    return 'work';
  }

  return 'work';
}

function calculateHours(clockIn1: string | null, clockOut1: string | null, clockIn2: string | null, clockOut2: string | null): number {
  let totalMinutes = 0;

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  if (clockIn1 && clockOut1) {
    totalMinutes += timeToMinutes(clockOut1) - timeToMinutes(clockIn1);
  }

  if (clockIn2 && clockOut2) {
    totalMinutes += timeToMinutes(clockOut2) - timeToMinutes(clockIn2);
  }

  return Number((totalMinutes / 60).toFixed(2));
}

function timeStringToMinutes(time: string | null): number {
  if (!time) return 0;
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

function calculateShiftExpectedHours(shift: any, recordDate: string): number {
  if (!shift) return 0;

  const date = new Date(recordDate + 'T12:00:00Z');
  const dayOfWeek = date.getUTCDay();

  const workDays: Record<number, string> = {
    0: 'works_sunday',
    1: 'works_monday',
    2: 'works_tuesday',
    3: 'works_wednesday',
    4: 'works_thursday',
    5: 'works_friday',
    6: 'works_saturday'
  };

  const workDayField = workDays[dayOfWeek];
  if (!shift[workDayField]) {
    return 0;
  }

  let totalMinutes = 0;

  if (shift.start_time && shift.end_time) {
    const start1 = timeStringToMinutes(shift.start_time);
    const end1 = timeStringToMinutes(shift.end_time);
    totalMinutes += end1 - start1;
  }

  if (shift.start_time_2 && shift.end_time_2) {
    const start2 = timeStringToMinutes(shift.start_time_2);
    const end2 = timeStringToMinutes(shift.end_time_2);
    totalMinutes += end2 - start2;
  }

  return Number((totalMinutes / 60).toFixed(2));
}

function normalizeEmployeeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findEmployeeIdByName(
  searchName: string,
  employeeMap: Map<string, string>,
  allEmployeeMap: Map<string, any>
): { id: string | null; matchType: 'exact' | 'normalized' | 'partial' | 'prefix' | 'none'; actualEmployee?: any } {
  const normalizedSearch = normalizeEmployeeName(searchName);
  const searchLower = searchName.toLowerCase().trim();

  const exactMatch = employeeMap.get(searchLower);
  if (exactMatch) {
    return { id: exactMatch, matchType: 'exact' };
  }

  for (const [empName, empId] of employeeMap.entries()) {
    if (normalizeEmployeeName(empName) === normalizedSearch) {
      return { id: empId, matchType: 'normalized' };
    }
  }

  const searchParts = normalizedSearch.split(' ').filter(p => p.length > 2);
  if (searchParts.length >= 2) {
    const firstName = searchParts[0];
    const lastName = searchParts[searchParts.length - 1];

    for (const [empName, empId] of employeeMap.entries()) {
      const normalizedEmpName = normalizeEmployeeName(empName);
      const empParts = normalizedEmpName.split(' ');

      if (empParts.length >= 2 && empParts[0] === firstName && empParts[empParts.length - 1] === lastName) {
        return { id: empId, matchType: 'partial' };
      }
    }
  }

  if (searchParts.length >= 1) {
    for (const [empName, empId] of employeeMap.entries()) {
      const normalizedEmpName = normalizeEmployeeName(empName);
      if (normalizedEmpName.startsWith(normalizedSearch + ' ') || normalizedEmpName === normalizedSearch) {
        return { id: empId, matchType: 'prefix' };
      }
    }

    for (const [empName, empId] of employeeMap.entries()) {
      const empParts = normalizeEmployeeName(empName).split(' ');
      let allPartsMatch = searchParts.length > 0;
      for (let i = 0; i < searchParts.length && allPartsMatch; i++) {
        if (i >= empParts.length || empParts[i] !== searchParts[i]) {
          allPartsMatch = false;
        }
      }
      if (allPartsMatch) {
        return { id: empId, matchType: 'prefix' };
      }
    }
  }

  for (const [empName, emp] of allEmployeeMap.entries()) {
    const normalizedEmpName = normalizeEmployeeName(empName);
    if (normalizedEmpName === normalizedSearch || normalizedEmpName.startsWith(normalizedSearch + ' ')) {
      return { id: null, matchType: 'none', actualEmployee: emp };
    }
  }

  return { id: null, matchType: 'none' };
}

function parsePdfToWorkbook(pdfText: string): any {
  const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sheets: { [key: string]: any[][] } = {};
  let currentEmployee = '';
  let currentSheetData: any[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().includes('nome:') || line.toLowerCase().includes('colaborador:') || line.toLowerCase().includes('funcionário:')) {
      if (currentEmployee && currentSheetData.length > 0) {
        sheets[currentEmployee] = currentSheetData;
      }

      const nameMatch = line.match(/(?:nome|colaborador|funcionário):\s*(.+)/i);
      if (nameMatch) {
        currentEmployee = nameMatch[1].trim();
        currentSheetData = [['Data', 'Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2', 'Tipo', 'Observações']];
      }
      continue;
    }

    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch && currentEmployee) {
      const parts = line.split(/\s+/);
      const date = parts[0];

      const times = [];
      for (let j = 1; j < parts.length; j++) {
        if (parts[j].match(/^\d{1,2}:\d{2}/)) {
          times.push(parts[j]);
        }
      }

      const recordType = line.toLowerCase().includes('folga') ? 'FO' :
                        line.toLowerCase().includes('férias') ? 'FER' :
                        line.toLowerCase().includes('falta') ? 'FA' :
                        line.toLowerCase().includes('feriado') ? 'FERIADO' : '';

      currentSheetData.push([
        date,
        times[0] || '',
        times[1] || '',
        times[2] || '',
        times[3] || '',
        recordType,
        ''
      ]);
    }
  }

  if (currentEmployee && currentSheetData.length > 0) {
    sheets[currentEmployee] = currentSheetData;
  }

  const workbook: any = {
    SheetNames: Object.keys(sheets),
    Sheets: {}
  };

  for (const sheetName of workbook.SheetNames) {
    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(sheets[sheetName]);
  }

  return workbook;
}

interface DaySchedule {
  entry1: string;
  exit1: string;
  entry2: string;
  exit2: string;
  expectedHours: number;
}

type WeekSchedule = Map<number, DaySchedule>;

interface PontoMaisEmployee {
  name: string;
  records: TimeRecord[];
}

function parseDayName(name: string): number[] {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (n.startsWith('dom')) return [0];
  if (n.startsWith('seg')) return [1];
  if (n.startsWith('ter')) return [2];
  if (n.startsWith('qua')) return [3];
  if (n.startsWith('qui')) return [4];
  if (n.startsWith('sex')) return [5];
  if (n.startsWith('sab')) return [6];
  return [];
}

function expandDayRange(startDay: string, endDay: string): number[] {
  const startDays = parseDayName(startDay);
  const endDays = parseDayName(endDay);
  if (startDays.length === 0 || endDays.length === 0) return [];
  const start = startDays[0];
  const end = endDays[0];
  const days: number[] = [];
  if (start <= end) {
    for (let i = start; i <= end; i++) days.push(i);
  } else {
    for (let i = start; i <= 6; i++) days.push(i);
    for (let i = 0; i <= end; i++) days.push(i);
  }
  return days;
}

function extractScheduleFromHeader(rows: any[][]): WeekSchedule {
  const schedule: WeekSchedule = new Map();

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i];
    if (!row) continue;

    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (typeof cell !== 'string') continue;
      const cellStr = cell.trim();
      if (!cellStr) continue;

      const fullText = cellStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (!fullText.includes('das ') && !fullText.includes('das:')) continue;

      const segments = fullText.split(/(?=(?:segunda|terca|quarta|quinta|sexta|sabado|domingo))/g).filter(s => s.trim());

      for (const segment of segments) {
        const timeMatches = segment.match(/(\d{1,2}:\d{2})/g);
        if (!timeMatches || timeMatches.length < 4) continue;

        const rangeMatch = segment.match(/(segunda|terca|quarta|quinta|sexta|sabado|domingo)\s*(?:a|ate|até)\s*(segunda|terca|quarta|quinta|sexta|sabado|domingo)/i);
        const singleMatch = segment.match(/^(segunda|terca|quarta|quinta|sexta|sabado|domingo)/i);

        let days: number[] = [];
        if (rangeMatch) {
          days = expandDayRange(rangeMatch[1], rangeMatch[2]);
        } else if (singleMatch) {
          days = parseDayName(singleMatch[1]);
        }

        if (days.length === 0) continue;

        const [e1, x1, e2, x2] = timeMatches;
        const calcHours = (start: string, end: string): number => {
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          return (eh * 60 + em - sh * 60 - sm) / 60;
        };
        const expectedHours = Number((calcHours(e1, x1) + calcHours(e2, x2)).toFixed(2));

        for (const day of days) {
          schedule.set(day, { entry1: e1, exit1: x1, entry2: e2, exit2: x2, expectedHours });
        }
      }
    }
  }

  return schedule;
}

function getExpectedHoursFromSchedule(schedule: WeekSchedule, recordDate: string): number {
  if (schedule.size === 0) return 0;
  const date = new Date(recordDate + 'T12:00:00Z');
  const dayOfWeek = date.getUTCDay();
  const daySchedule = schedule.get(dayOfWeek);
  return daySchedule?.expectedHours ?? 0;
}

function extractEmployeeNameFromHeader(rows: any[][]): string | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;

    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      const cellStr = String(cell || '').toLowerCase().trim();

      if (cellStr === 'nome' || cellStr === 'nome:' || cellStr === 'colaborador' || cellStr === 'colaborador:' || cellStr === 'funcionário' || cellStr === 'funcionário:') {
        for (let k = j + 1; k < Math.min(j + 5, row.length); k++) {
          const nameCell = row[k];
          if (nameCell && typeof nameCell === 'string' && nameCell.trim().length > 2) {
            const name = nameCell.trim();
            if (!name.match(/^\d/) && !name.match(/^[A-Z]{2,4}$/)) {
              return name;
            }
          }
        }
      }

      if (typeof cell === 'string') {
        const nameMatch = cell.match(/^(?:nome|colaborador|funcionário):\s*(.+)/i);
        if (nameMatch && nameMatch[1].trim().length > 0) {
          return nameMatch[1].trim();
        }
      }
    }
  }

  return null;
}

function normalizeColumnName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ªº°]/g, '')
    .replace(/\s+/g, ' ');
}

interface ColumnIndices {
  dataCol: number;
  entrada1Col: number;
  saida1Col: number;
  entrada2Col: number;
  saida2Col: number;
  motivoCol: number;
  he1Col: number;
  he2Col: number;
  saldoCol: number;
  intervalCol: number;
  missingCol: number;
  normalHoursCol: number;
  totalHoursCol: number;
  adicionalNoturnoCol: number;
  horasNoturasReduzidosCol: number;
  locationCols: Set<number>;
  ignoreCols: Set<number>;
}

function isLocationColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return normalized.includes('local') || normalized.includes('endereco') ||
         normalized.includes('localizacao') || normalized.includes('gps') ||
         normalized.includes('coordenada') || normalized.includes('location');
}

function isSaldoColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return normalized === 'saldo' || normalized.includes('saldo bh') || normalized.includes('saldo banco');
}

function isIgnoreColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  if (isHe1Column(cell)) return false;
  if (isHe2Column(cell)) return false;
  if (isSaldoColumn(cell)) return false;
  if (isIntervalColumn(cell)) return false;
  if (isMissingHoursColumn(cell)) return false;
  if (isNormalHoursColumn(cell)) return false;
  if (isTotalHoursColumn(cell)) return false;
  if (isAdicionalNoturnoColumn(cell)) return false;
  if (isHorasNoturasReduzidosColumn(cell)) return false;
  return normalized.includes('carga') || normalized.includes('horario') ||
         normalized.includes('jornada') || normalized.includes('total') ||
         normalized.includes('horas') ||
         normalized.includes('extra') || normalized.includes('banco') ||
         normalized.includes('trabalhad') || normalized.includes('previst');
}

function isHe1Column(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  if (isHe2Column(cell)) return false;
  return (normalized.includes('he1') || normalized.includes('h.e.1') ||
          normalized.includes('he 1') || normalized.includes('h.e. 1') ||
          withoutSpaces.includes('h.e.1') || withoutSpaces.includes('he1') ||
          (normalized.includes('extra') && normalized.includes('1') && normalized.includes('0%')) ||
          (normalized.includes('extras') && normalized.includes('fator 1')) ||
          (normalized.includes('extra') && normalized.includes('fator 1')) ||
          (normalized.includes('extras') && normalized.includes('fator') && normalized.includes('1') && !normalized.includes('2')) ||
          (normalized.includes('extra') && normalized.includes('fator') && normalized.includes('50')) ||
          (normalized.includes('horas') && normalized.includes('fator 1')) ||
          (normalized.includes('horas') && normalized.includes('50%')) ||
          /h\.?e\.?\s*1/i.test(normalized) ||
          /fator\s*1/i.test(normalized) ||
          /serao\s*50/i.test(normalized) ||
          /serao.*50/i.test(normalized));
}

function isHe2Column(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  return (normalized.includes('he2') || normalized.includes('h.e.2') ||
          normalized.includes('he 2') || normalized.includes('h.e. 2') ||
          withoutSpaces.includes('h.e.2') || withoutSpaces.includes('he2') ||
          (normalized.includes('extra') && normalized.includes('2') && normalized.includes('100')) ||
          (normalized.includes('extras') && normalized.includes('fator 2')) ||
          (normalized.includes('extra') && normalized.includes('fator 2')) ||
          (normalized.includes('extras') && normalized.includes('fator') && normalized.includes('2')) ||
          (normalized.includes('extra') && normalized.includes('fator') && normalized.includes('100')) ||
          (normalized.includes('horas') && normalized.includes('fator 2')) ||
          (normalized.includes('horas') && normalized.includes('100%')) ||
          /h\.?e\.?\s*2/i.test(normalized) ||
          /fator\s*2/i.test(normalized) ||
          /serao\s*100/i.test(normalized) ||
          /serao.*100/i.test(normalized));
}

function isIntervalColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return normalized.includes('intervalo') || normalized === 'h. intervalo' ||
         normalized === 'h intervalo' || normalized === 'interjornada' ||
         normalized === 'horas intervalo' || normalized === 'h. de intervalo' ||
         (normalized.includes('horas') && normalized.includes('intervalo'));
}

function isMissingHoursColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return normalized.includes('faltante') || normalized === 'h. faltantes' ||
         normalized === 'h faltantes' || normalized === 'horas faltantes' ||
         (normalized.includes('horas') && normalized.includes('faltante')) ||
         (normalized.includes('h.') && normalized.includes('faltante'));
}

function isNormalHoursColumn(cell: string): boolean {
  if (isHe1Column(cell) || isHe2Column(cell)) return false;
  const normalized = normalizeColumnName(cell);
  return (normalized.includes('normais') || normalized.includes('normal')) &&
         (normalized.includes('hora') || normalized.includes('h.') || normalized.includes('h ')) ||
         normalized === 'horas normais' || normalized === 'h. normais' || normalized === 'h normais';
}

function isTotalHoursColumn(cell: string): boolean {
  if (isHe1Column(cell) || isHe2Column(cell)) return false;
  const normalized = normalizeColumnName(cell);
  return ((normalized.includes('totais') || normalized.includes('total')) &&
         (normalized.includes('hora') || normalized.includes('h.') || normalized.includes('h ') || normalized.includes('h.t'))) ||
         normalized === 'horas totais' || normalized === 'h. totais' || normalized === 'h totais' ||
         normalized === 'total de horas' || normalized === 'total horas';
}

function isAdicionalNoturnoColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  return normalized === 'a.n.' || normalized === 'a.n' || normalized === 'an' ||
         normalized === 'a. n.' || normalized === 'a. n' ||
         withoutSpaces === 'a.n.' || withoutSpaces === 'a.n' ||
         /^a\.?\s*n\.?$/.test(normalized) ||
         normalized === 'adicional noturno' || normalized.includes('adic. noturno') ||
         (normalized.includes('adicional') && normalized.includes('noturno'));
}

function isHorasNoturasReduzidosColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  return withoutSpaces === 'h.n.rod.' || withoutSpaces === 'h.n.rod' ||
         withoutSpaces === 'h.n.ped.' || withoutSpaces === 'h.n.ped' ||
         withoutSpaces === 'h.n.red.' || withoutSpaces === 'h.n.red' ||
         withoutSpaces === 'hnrod' || withoutSpaces === 'hnped' || withoutSpaces === 'hnred' ||
         normalized === 'horas noturnas reduzidas' || normalized === 'h. noturnas red.' ||
         /^h\.?\s*n\.?\s*(rod|ped|red)\.?$/.test(normalized) ||
         (normalized.includes('noturna') && (normalized.includes('reduz') || normalized.includes('rod') || normalized.includes('ped') || normalized.includes('red')));
}

function isTimeColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return (normalized.includes('entrada') || normalized.includes('saida') || normalized.includes('said') ||
         /^ent\.?\s*\d?$/i.test(normalized) || /^sai\.?\s*\d?$/i.test(normalized)) &&
         !isLocationColumn(cell);
}

function findDataColumnIndices(headerRow: any[]): ColumnIndices | null {
  let dataCol = -1;
  let entrada1Col = -1;
  let saida1Col = -1;
  let entrada2Col = -1;
  let saida2Col = -1;
  let motivoCol = -1;
  let he1Col = -1;
  let he2Col = -1;
  let saldoCol = -1;
  let intervalCol = -1;
  let missingCol = -1;
  let normalHoursCol = -1;
  let totalHoursCol = -1;
  let adicionalNoturnoCol = -1;
  let horasNoturasReduzidosCol = -1;

  const locationCols = new Set<number>();
  const ignoreCols = new Set<number>();
  const timeColumns: { index: number; type: 'entrada' | 'saida'; number: number }[] = [];

  console.log(`[findDataColumnIndices] Full header (${headerRow.length} cols):`, JSON.stringify(headerRow.map((c: any, i: number) => `${i}:"${String(c || '').trim()}"`)));

  for (let i = 0; i < headerRow.length; i++) {
    const cellRaw = String(headerRow[i] || '');
    const cell = normalizeColumnName(cellRaw);

    if (isLocationColumn(cellRaw)) {
      locationCols.add(i);
      continue;
    }

    if (isSaldoColumn(cellRaw)) {
      if (saldoCol === -1) saldoCol = i;
      continue;
    }

    if (isHe1Column(cellRaw)) {
      if (he1Col === -1) he1Col = i;
      continue;
    }

    if (isHe2Column(cellRaw)) {
      if (he2Col === -1) he2Col = i;
      continue;
    }

    if (isIntervalColumn(cellRaw)) {
      if (intervalCol === -1) intervalCol = i;
      continue;
    }

    if (isMissingHoursColumn(cellRaw)) {
      if (missingCol === -1) missingCol = i;
      continue;
    }

    if (isNormalHoursColumn(cellRaw)) {
      if (normalHoursCol === -1) normalHoursCol = i;
      continue;
    }

    if (isTotalHoursColumn(cellRaw)) {
      if (totalHoursCol === -1) totalHoursCol = i;
      continue;
    }

    if (isAdicionalNoturnoColumn(cellRaw)) {
      if (adicionalNoturnoCol === -1) adicionalNoturnoCol = i;
      continue;
    }

    if (isHorasNoturasReduzidosColumn(cellRaw)) {
      if (horasNoturasReduzidosCol === -1) horasNoturasReduzidosCol = i;
      continue;
    }

    if (isIgnoreColumn(cellRaw)) {
      ignoreCols.add(i);
      continue;
    }

    if (cell === 'data' || cell === 'dia' || cell === 'dias' || cell === 'date') {
      if (dataCol === -1) dataCol = i;
      continue;
    }

    if (cell === 'motivo' || cell === 'tipo' || cell === 'observacao' || cell === 'obs' ||
        cell === 'justificativa' || cell === 'ocorrencia') {
      if (motivoCol === -1) motivoCol = i;
      continue;
    }

    const has1 = cell.includes('1') || cell.includes('primeira') || cell.includes('1a');
    const has2 = cell.includes('2') || cell.includes('segunda') || cell.includes('2a');
    const hasEntrada = cell.includes('entrada') || /\bent\.?\b/.test(cell);
    const hasSaida = cell.includes('saida') || cell.includes('said') || /\bsai\.?\b/.test(cell);

    if (hasEntrada && !hasSaida) {
      const num = has2 ? 2 : 1;
      timeColumns.push({ index: i, type: 'entrada', number: num });
    } else if (hasSaida && !hasEntrada) {
      const num = has2 ? 2 : 1;
      timeColumns.push({ index: i, type: 'saida', number: num });
    } else if (hasEntrada && hasSaida) {
      continue;
    }
  }

  if (timeColumns.length === 0 && dataCol >= 0) {
    const unclassifiedCols: number[] = [];
    for (let i = 0; i < headerRow.length; i++) {
      if (i === dataCol) continue;
      if (locationCols.has(i) || ignoreCols.has(i)) continue;
      if (i === motivoCol || i === he1Col || i === he2Col || i === saldoCol) continue;
      if (i === intervalCol || i === missingCol || i === normalHoursCol || i === totalHoursCol) continue;
      if (i === adicionalNoturnoCol || i === horasNoturasReduzidosCol) continue;
      const cellRaw = String(headerRow[i] || '').trim();
      if (!cellRaw) continue;
      unclassifiedCols.push(i);
    }

    if (unclassifiedCols.length >= 4) {
      const sorted = unclassifiedCols.sort((a, b) => a - b);
      timeColumns.push({ index: sorted[0], type: 'entrada', number: 1 });
      timeColumns.push({ index: sorted[1], type: 'saida', number: 1 });
      timeColumns.push({ index: sorted[2], type: 'entrada', number: 2 });
      timeColumns.push({ index: sorted[3], type: 'saida', number: 2 });
      console.log(`[Column Detection] Fallback: assigned 4 unclassified cols as time columns: ${sorted.slice(0, 4).join(', ')}`);
    }
  }

  const entrada1Cols = timeColumns.filter(c => c.type === 'entrada' && c.number === 1);
  const saida1Cols = timeColumns.filter(c => c.type === 'saida' && c.number === 1);
  const entrada2Cols = timeColumns.filter(c => c.type === 'entrada' && c.number === 2);
  const saida2Cols = timeColumns.filter(c => c.type === 'saida' && c.number === 2);

  if (entrada1Cols.length > 0) entrada1Col = entrada1Cols[0].index;
  if (saida1Cols.length > 0) saida1Col = saida1Cols[0].index;
  if (entrada2Cols.length > 0) entrada2Col = entrada2Cols[0].index;
  if (saida2Cols.length > 0) saida2Col = saida2Cols[0].index;

  if (entrada1Col === -1 && timeColumns.length >= 1) {
    const sortedTimeCols = timeColumns.filter(c => c.type === 'entrada').sort((a, b) => a.index - b.index);
    if (sortedTimeCols.length > 0) entrada1Col = sortedTimeCols[0].index;
  }

  if (saida1Col === -1 && entrada1Col >= 0) {
    const saidaCols = timeColumns.filter(c => c.type === 'saida' && c.index > entrada1Col).sort((a, b) => a.index - b.index);
    if (saidaCols.length > 0) saida1Col = saidaCols[0].index;
  }

  if (entrada2Col === -1 && saida1Col >= 0) {
    const entradaCols = timeColumns.filter(c => c.type === 'entrada' && c.index > saida1Col).sort((a, b) => a.index - b.index);
    if (entradaCols.length > 0) entrada2Col = entradaCols[0].index;
  }

  if (saida2Col === -1 && entrada2Col >= 0) {
    const saidaCols = timeColumns.filter(c => c.type === 'saida' && c.index > entrada2Col).sort((a, b) => a.index - b.index);
    if (saidaCols.length > 0) saida2Col = saidaCols[0].index;
  }

  if (dataCol === -1 || entrada1Col === -1) return null;

  console.log(`[Column Detection] he1Col=${he1Col}, he2Col=${he2Col}, saldoCol=${saldoCol}`);
  console.log(`[Column Detection] Headers: ${headerRow.map((c: any, i: number) => `${i}:"${String(c || '')}"`).join(', ')}`);

  const hasDataExact = headerRow.some((cell: any) => {
    const normalized = normalizeColumnName(String(cell || ''));
    return normalized === 'data' || normalized === 'dia' || normalized === 'dias' || normalized === 'date';
  });

  if (!hasDataExact) return null;

  const hasTimeColumns = timeColumns.length >= 1;
  if (!hasTimeColumns) return null;

  return { dataCol, entrada1Col, saida1Col, entrada2Col, saida2Col, motivoCol, he1Col, he2Col, saldoCol, intervalCol, missingCol, normalHoursCol, totalHoursCol, adicionalNoturnoCol, horasNoturasReduzidosCol, locationCols, ignoreCols };
}

function isTimeValue(value: any): boolean {
  if (!value) return false;
  if (typeof value === 'number' && value > 0 && value < 1) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed);
  }
  return false;
}

function parseHoursToDecimal(value: any): number {
  if (!value) return 0;

  if (typeof value === 'number') {
    if (value >= 0 && value < 1) {
      return Number((value * 24).toFixed(2));
    }
    return Number(value.toFixed(2));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    const timeMatch = trimmed.match(/^([+-]?)(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const negative = timeMatch[1] === '-';
      const hours = parseInt(timeMatch[2], 10);
      const minutes = parseInt(timeMatch[3], 10);
      const totalHours = hours + (minutes / 60);
      return Number((negative ? -totalHours : totalHours).toFixed(2));
    }

    const numValue = parseFloat(trimmed.replace(',', '.'));
    if (!isNaN(numValue)) {
      return Number(numValue.toFixed(2));
    }
  }

  return 0;
}

function parseLancamentosBancoHoras(rows: any[][], startRowIndex: number, employeeName: string): TimeBankEntry[] {
  const entries: TimeBankEntry[] = [];
  let currentSectionReason = '';

  for (let i = startRowIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let dateStr: string | null = null;
    let hoursMotivo: string | null = null;
    const cellTexts: string[] = [];

    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (!cell) continue;
      const cellStr = String(cell).trim();
      if (!cellStr) continue;
      cellTexts.push(cellStr);

      if (!dateStr) {
        const parsed = parseDate(cell);
        if (parsed) {
          dateStr = parsed;
          continue;
        }
        const dateMatch = cellStr.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dateMatch) {
          const parsed2 = parseDate(dateMatch[0]);
          if (parsed2) {
            dateStr = parsed2;
            continue;
          }
        }
      }

      if (dateStr && !hoursMotivo) {
        if (cellStr.match(/^-?\d{1,2}:\d{2}/) || cellStr.match(/^-?\d+[.,]\d+/)) {
          hoursMotivo = cellStr;
        }
      }
    }

    if (dateStr && hoursMotivo) {
      const hoursMatch = hoursMotivo.match(/^(-?\d{1,2}:\d{2})/);
      if (hoursMatch) {
        const hours = parseHoursToDecimal(hoursMatch[1]);
        let reason = currentSectionReason;
        const motivoMatch = hoursMotivo.match(/Motivo:\s*([\s\S]+)/i);
        if (motivoMatch) {
          reason = motivoMatch[1].replace(/[\r\n]+/g, ' ').trim();
        }
        entries.push({ employeeName, entryDate: dateStr, hours, reason });
      }
      continue;
    }

    if (!dateStr && cellTexts.length > 0) {
      const firstText = cellTexts[0];
      const normalized = firstText.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (normalized === 'data' || normalized === 'horas' ||
        normalized.includes('horas/motivo') || normalized.includes('horas / motivo') ||
        normalized === 'total' || normalized.startsWith('totais') ||
        normalized.startsWith('lancamento')) {
        continue;
      }

      if (normalized.includes('serao') || normalized.includes('falta') ||
        normalized.includes('atraso') || normalized.includes('banco') ||
        normalized.includes('compensac') || normalized.includes('abono') ||
        normalized.includes('hora') || normalized.includes('noturno') ||
        normalized.includes('dsr') || normalized.includes('adicional') ||
        normalized.includes('extra') || normalized.includes('folga') ||
        normalized.includes('ferias') || normalized.includes('licenc') ||
        normalized.includes('ajuste') || /\d+\s*%/.test(firstText)) {
        currentSectionReason = firstText;
      }
    }
  }

  return entries;
}

function parsePontoMaisSheet(rows: any[][], sheetNameFallback?: string): { employeeName: string | null; records: TimeRecord[]; timeBankEntries: TimeBankEntry[]; schedule: WeekSchedule } {
  const headerName = extractEmployeeNameFromHeader(rows);
  const employeeName = headerName || sheetNameFallback || null;
  const schedule = extractScheduleFromHeader(rows);
  const records: TimeRecord[] = [];
  const timeBankEntries: TimeBankEntry[] = [];

  if (!employeeName) return { employeeName: null, records: [], timeBankEntries: [], schedule };
  console.log(`[parsePontoMaisSheet] Employee: "${employeeName}" (from ${headerName ? 'header' : 'sheet name'})`);

  let headerRowIndex = -1;
  let columnIndices: ColumnIndices | null = null;
  let bestScore = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const candidate = findDataColumnIndices(row);
    if (candidate) {
      let score = 1;
      if (candidate.saida1Col >= 0) score++;
      if (candidate.entrada2Col >= 0) score++;
      if (candidate.saida2Col >= 0) score++;
      if (candidate.he1Col >= 0) score++;
      if (candidate.he2Col >= 0) score++;
      if (candidate.normalHoursCol >= 0) score++;
      if (candidate.totalHoursCol >= 0) score++;
      if (candidate.saldoCol >= 0) score++;
      if (candidate.intervalCol >= 0) score++;
      if (candidate.missingCol >= 0) score++;
      if (candidate.motivoCol >= 0) score++;

      console.log(`[${employeeName}] Candidate header row ${i} (score=${score}):`, JSON.stringify(row.map((c: any) => String(c || '').trim()).filter(Boolean)));

      if (score > bestScore) {
        bestScore = score;
        columnIndices = candidate;
        headerRowIndex = i;
      }
    }
  }

  if (headerRowIndex === -1 || !columnIndices) return { employeeName, records: [], timeBankEntries: [], schedule };

  console.log(`[${employeeName}] Header row ${headerRowIndex}:`, JSON.stringify(rows[headerRowIndex]?.map((c: any) => String(c || '').trim())));
  console.log(`[${employeeName}] Column indices:`, JSON.stringify(columnIndices));

  if (headerRowIndex + 1 < rows.length) {
    const sampleRow = rows[headerRowIndex + 1];
    if (sampleRow) {
      console.log(`[${employeeName}] First data row (raw):`, JSON.stringify(sampleRow));
      if (columnIndices.he1Col >= 0) console.log(`[${employeeName}] he1Col[${columnIndices.he1Col}] value:`, JSON.stringify(sampleRow[columnIndices.he1Col]));
      if (columnIndices.he2Col >= 0) console.log(`[${employeeName}] he2Col[${columnIndices.he2Col}] value:`, JSON.stringify(sampleRow[columnIndices.he2Col]));
      if (columnIndices.normalHoursCol >= 0) console.log(`[${employeeName}] normalHoursCol[${columnIndices.normalHoursCol}] value:`, JSON.stringify(sampleRow[columnIndices.normalHoursCol]));
      if (columnIndices.totalHoursCol >= 0) console.log(`[${employeeName}] totalHoursCol[${columnIndices.totalHoursCol}] value:`, JSON.stringify(sampleRow[columnIndices.totalHoursCol]));
    }
  }

  const rawRecords: { record: TimeRecord; cumulativeSaldo: number | null }[] = [];
  let lancamentosStartRow = -1;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let isEndOfData = false;
    for (let j = 0; j < Math.min(row.length, 6); j++) {
      const cellStr = String(row[j] || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cellStr === 'totais' || cellStr.startsWith('lancamento') || cellStr.startsWith('total')) {
        isEndOfData = true;
        if (cellStr.startsWith('lancamento')) {
          lancamentosStartRow = i + 1;
        }
        break;
      }
    }
    if (isEndOfData) {
      if (lancamentosStartRow === -1) {
        for (let k = i + 1; k < rows.length; k++) {
          const nextRow = rows[k];
          if (!nextRow) continue;
          for (let j = 0; j < Math.min(nextRow.length, 6); j++) {
            const cs = String(nextRow[j] || '').trim().toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (cs.startsWith('lancamento')) {
              lancamentosStartRow = k + 1;
              break;
            }
          }
          if (lancamentosStartRow !== -1) break;
        }
      }
      break;
    }

    const parsedDate = parseDate(row[columnIndices.dataCol]);
    if (!parsedDate) continue;

    if (rawRecords.length === 0) {
      console.log(`[${employeeName}] First data row [${i}] length=${row.length}:`, JSON.stringify(row.slice(0, 20)));
      console.log(`[${employeeName}] Col mapping: data=${columnIndices.dataCol} e1=${columnIndices.entrada1Col} s1=${columnIndices.saida1Col} e2=${columnIndices.entrada2Col} s2=${columnIndices.saida2Col} he1=${columnIndices.he1Col} he2=${columnIndices.he2Col} normal=${columnIndices.normalHoursCol} total=${columnIndices.totalHoursCol} interval=${columnIndices.intervalCol} missing=${columnIndices.missingCol} saldo=${columnIndices.saldoCol}`);
      if (columnIndices.he2Col >= 0) console.log(`[${employeeName}] he2 raw value:`, JSON.stringify(row[columnIndices.he2Col]), typeof row[columnIndices.he2Col]);
    }

    const clockIn1Result = parseTimeWithLocation(row[columnIndices.entrada1Col]);
    const clockOut1Result = columnIndices.saida1Col >= 0 ? parseTimeWithLocation(row[columnIndices.saida1Col]) : { time: null, location: null };
    const clockIn2Result = columnIndices.entrada2Col >= 0 ? parseTimeWithLocation(row[columnIndices.entrada2Col]) : { time: null, location: null };
    const clockOut2Result = columnIndices.saida2Col >= 0 ? parseTimeWithLocation(row[columnIndices.saida2Col]) : { time: null, location: null };

    let motivo = '';
    if (columnIndices.motivoCol >= 0) {
      const motivoValue = row[columnIndices.motivoCol];
      if (!isTimeValue(motivoValue)) {
        motivo = String(motivoValue || '');
      }
    }

    let cumulativeSaldo: number | null = null;
    if (columnIndices.saldoCol >= 0) {
      const saldoValue = row[columnIndices.saldoCol];
      if (saldoValue !== null && saldoValue !== undefined && saldoValue !== '') {
        cumulativeSaldo = parseHoursToDecimal(saldoValue);
      }
    }

    let bankHours: number | null = null;
    if (columnIndices.he1Col >= 0 && columnIndices.saldoCol < 0) {
      const he1Value = row[columnIndices.he1Col];
      if (he1Value !== null && he1Value !== undefined && he1Value !== '') {
        bankHours = parseHoursToDecimal(he1Value);
      }
    }

    let intervalHours = 0;
    if (columnIndices.intervalCol >= 0) {
      const val = row[columnIndices.intervalCol];
      if (val !== null && val !== undefined && val !== '') {
        intervalHours = parseHoursToDecimal(val);
      }
    }

    let missingHours = 0;
    if (columnIndices.missingCol >= 0) {
      const val = row[columnIndices.missingCol];
      if (val !== null && val !== undefined && val !== '') {
        missingHours = parseHoursToDecimal(val);
      }
    }

    let normalHours = 0;
    if (columnIndices.normalHoursCol >= 0) {
      const val = row[columnIndices.normalHoursCol];
      if (val !== null && val !== undefined && val !== '') {
        normalHours = parseHoursToDecimal(val);
      }
    }

    let overtime1 = 0;
    if (columnIndices.he1Col >= 0) {
      const val = row[columnIndices.he1Col];
      if (val !== null && val !== undefined && val !== '') {
        overtime1 = parseHoursToDecimal(val);
      }
    }

    let overtime2 = 0;
    if (columnIndices.he2Col >= 0) {
      const val = row[columnIndices.he2Col];
      if (val !== null && val !== undefined && val !== '') {
        overtime2 = parseHoursToDecimal(val);
      }
    }

    let adicionalNoturno = 0;
    if (columnIndices.adicionalNoturnoCol >= 0) {
      const val = row[columnIndices.adicionalNoturnoCol];
      if (val !== null && val !== undefined && val !== '') {
        adicionalNoturno = parseHoursToDecimal(val);
      }
    }

    let horasNoturasReduzidas = 0;
    if (columnIndices.horasNoturasReduzidosCol >= 0) {
      const val = row[columnIndices.horasNoturasReduzidosCol];
      if (val !== null && val !== undefined && val !== '') {
        horasNoturasReduzidas = parseHoursToDecimal(val);
      }
    }

    let sheetTotalHours = 0;
    if (columnIndices.totalHoursCol >= 0) {
      const val = row[columnIndices.totalHoursCol];
      if (val !== null && val !== undefined && val !== '') {
        sheetTotalHours = parseHoursToDecimal(val);
      }
    }

    const calculatedTotal = calculateHours(clockIn1Result.time, clockOut1Result.time, clockIn2Result.time, clockOut2Result.time);
    const finalTotal = sheetTotalHours > 0 ? sheetTotalHours : calculatedTotal;

    const record: TimeRecord = {
      employeeName,
      recordDate: parsedDate,
      clockIn1: clockIn1Result.time,
      clockOut1: clockOut1Result.time,
      clockIn2: clockIn2Result.time,
      clockOut2: clockOut2Result.time,
      clockIn1Location: clockIn1Result.location,
      clockOut1Location: clockOut1Result.location,
      clockIn2Location: clockIn2Result.location,
      clockOut2Location: clockOut2Result.location,
      recordType: normalizeRecordType(motivo),
      originalRecordType: motivo,
      observations: motivo,
      totalHours: finalTotal,
      bankHours,
      intervalHours,
      missingHours,
      normalHours,
      overtime1,
      overtime2,
      adicionalNoturno,
      horasNoturasReduzidas,
    };

    rawRecords.push({ record, cumulativeSaldo });
  }

  for (let i = 0; i < rawRecords.length; i++) {
    const { record, cumulativeSaldo } = rawRecords[i];

    if (cumulativeSaldo !== null) {
      record.accumulatedBalance = cumulativeSaldo;
      if (record.bankHours === null) {
        const previousSaldo = i > 0 ? rawRecords[i - 1].cumulativeSaldo : 0;
        const dailySaldo = cumulativeSaldo - (previousSaldo || 0);
        record.bankHours = Number(dailySaldo.toFixed(2));
      }
    }

    records.push(record);
  }

  if (lancamentosStartRow > 0) {
    const parsed = parseLancamentosBancoHoras(rows, lancamentosStartRow, employeeName);
    timeBankEntries.push(...parsed);
  }

  return { employeeName, records, timeBankEntries, schedule };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header não encontrado. Por favor, faça login novamente.");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Token não encontrado. Por favor, faça login novamente.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error("Authentication error:", userError);
      throw new Error(`Erro de autenticação: ${userError.message}. Por favor, faça login novamente.`);
    }

    if (!user) {
      throw new Error('Usuário não encontrado. Por favor, faça login novamente.');
    }

    console.log("User authenticated:", user.email);

    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, user_type_id, user_types(name)")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (empError) {
      console.error("Employee lookup error:", empError);
      throw new Error("Erro ao verificar permissões do usuário");
    }

    if (!employee) {
      console.error("No employee found for user:", user.id);
      throw new Error("Funcionário não encontrado para este usuário");
    }

    const userTypeName = (employee.user_types as any)?.name;
    console.log("User type:", userTypeName);

    if (!['Administrador', 'Gerente'].includes(userTypeName)) {
      throw new Error("Apenas administradores e gerentes podem fazer upload de folhas de ponto");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const locationId = formData.get("locationId") as string;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!locationId) {
      throw new Error("Location ID is required");
    }

    const uploadRecord = await supabaseAdmin
      .from("time_tracking_uploads")
      .insert({
        uploaded_by: employee.id,
        file_name: fileName || file.name,
        status: "processing",
        location_id: locationId || null,
      })
      .select()
      .single();

    const arrayBuffer = await file.arrayBuffer();
    const fileNameLower = (fileName || file.name).toLowerCase();
    const isPdf = fileNameLower.endsWith('.pdf');
    const isCsv = fileNameLower.endsWith('.csv');

    let workbook;
    if (isPdf) {
      const pdfData = await pdfParse(new Uint8Array(arrayBuffer));
      workbook = parsePdfToWorkbook(pdfData.text);
    } else {
      workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    }

    const { data: locationEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name, workplace_id, shift_id, shifts:shift_id(start_time, end_time, start_time_2, end_time_2, works_sunday, works_monday, works_tuesday, works_wednesday, works_thursday, works_friday, works_saturday)")
      .eq("workplace_id", locationId)
      .eq("is_active", true);

    if (!locationEmployees || locationEmployees.length === 0) {
      throw new Error("Nenhum colaborador ativo encontrado para o local de trabalho selecionado");
    }

    const { data: allEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name, workplace_id, shift_id, shifts:shift_id(start_time, end_time, start_time_2, end_time_2, works_sunday, works_monday, works_tuesday, works_wednesday, works_thursday, works_friday, works_saturday), locations:workplace_id(legal_name, trade_name)")
      .eq("is_active", true);

    const { data: systemSettings } = await supabaseAdmin
      .from("system_settings")
      .select("default_weekly_hours")
      .eq("id", 1)
      .maybeSingle();

    const defaultDailyHours = systemSettings?.default_weekly_hours || 8;

    const employeeMap = new Map(
      locationEmployees?.map(emp => [emp.name.toLowerCase().trim(), emp.id]) || []
    );

    const employeeShiftMap = new Map(
      locationEmployees?.map(emp => [emp.id, emp.shifts]) || []
    );

    const allEmployeeMap = new Map(
      allEmployees?.map(emp => [emp.name.toLowerCase().trim(), emp]) || []
    );

    const records: TimeRecord[] = [];
    const allTimeBankEntries: TimeBankEntry[] = [];
    const employeeScheduleMap = new Map<string, WeekSchedule>();

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      if (sheet['!merges'] && sheet['!merges'].length > 0) {
        for (const merge of sheet['!merges']) {
          const startCell = sheet[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
          if (!startCell) continue;
          for (let r = merge.s.r; r <= merge.e.r; r++) {
            for (let c = merge.s.c; c <= merge.e.c; c++) {
              if (r === merge.s.r && c === merge.s.c) continue;
              const cellRef = XLSX.utils.encode_cell({ r, c });
              sheet[cellRef] = { ...startCell };
            }
          }
        }
      }

      let maxRow = 0;
      let maxCol = 0;
      for (const key of Object.keys(sheet)) {
        if (key.startsWith('!')) continue;
        const decoded = XLSX.utils.decode_cell(key);
        if (decoded.r > maxRow) maxRow = decoded.r;
        if (decoded.c > maxCol) maxCol = decoded.c;
      }
      if (maxRow > 0 || maxCol > 0) {
        sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

      const pontoMaisResult = parsePontoMaisSheet(rows, sheetName.trim());

      const sampleRecords = pontoMaisResult.records.slice(0, 3).map(r => ({
        date: r.recordDate,
        clockIn1: r.clockIn1,
        clockOut1: r.clockOut1,
        clockIn2: r.clockIn2,
        clockOut2: r.clockOut2,
        intervalHours: r.intervalHours,
        missingHours: r.missingHours,
        normalHours: r.normalHours,
        overtime1: r.overtime1,
        overtime2: r.overtime2,
        adicionalNoturno: r.adicionalNoturno,
        horasNoturasReduzidas: r.horasNoturasReduzidas,
        totalHours: r.totalHours,
        observations: r.observations,
      }));

      const headerRow = rows.length > 0 ? rows.slice(0, 10).map((r, idx) => ({
        rowIdx: idx,
        cells: (r || []).map((c: any) => {
          const val = c;
          return { raw: String(val ?? '').substring(0, 50), type: typeof val };
        })
      })) : [];

      let diagColumnIndices: any = null;
      let diagHeaderRowIdx = -1;
      for (let ri = 0; ri < rows.length; ri++) {
        const candidate = findDataColumnIndices(rows[ri]);
        if (candidate) {
          diagHeaderRowIdx = ri;
          diagColumnIndices = candidate;
          diagColumnIndices.locationCols = Array.from(candidate.locationCols || []);
          diagColumnIndices.ignoreCols = Array.from(candidate.ignoreCols || []);
          break;
        }
      }

      let firstDataRowRaw: any = null;
      if (diagHeaderRowIdx >= 0 && diagHeaderRowIdx + 1 < rows.length) {
        const dr = rows[diagHeaderRowIdx + 1];
        if (dr) {
          firstDataRowRaw = dr.map((c: any, idx: number) => ({
            col: idx,
            raw: String(c ?? '').substring(0, 50),
            type: typeof c,
            numVal: typeof c === 'number' ? c : undefined,
          }));
        }
      }

      const mergesInfo = sheet['!merges'] ? sheet['!merges'].slice(0, 20).map((m: any) => ({
        start: `${XLSX.utils.encode_cell(m.s)}`,
        end: `${XLSX.utils.encode_cell(m.e)}`,
      })) : [];

      const sheetRef = sheet['!ref'] || 'N/A';

      const sheetCellKeys = Object.keys(sheet).filter(k => !k.startsWith('!')).slice(0, 50);

      await supabaseAdmin.from("parse_diagnostics").insert({
        diagnostic_data: {
          sheetName,
          sheetRef,
          mergesCount: sheet['!merges']?.length || 0,
          mergesSample: mergesInfo,
          sheetCellKeysSample: sheetCellKeys,
          employeeName: pontoMaisResult.employeeName,
          recordCount: pontoMaisResult.records.length,
          timeBankCount: pontoMaisResult.timeBankEntries.length,
          usedParsePontoMais: pontoMaisResult.records.length > 0,
          sampleRecords,
          first10Rows: headerRow,
          columnIndices: diagColumnIndices,
          headerRowIndex: diagHeaderRowIdx,
          firstDataRowRaw,
        }
      });

      if (pontoMaisResult.employeeName && pontoMaisResult.records.length > 0) {
        records.push(...pontoMaisResult.records);
        allTimeBankEntries.push(...pontoMaisResult.timeBankEntries);
        if (pontoMaisResult.schedule.size > 0) {
          employeeScheduleMap.set(pontoMaisResult.employeeName.toLowerCase().trim(), pontoMaisResult.schedule);
        }
        continue;
      }

      const employeeName = pontoMaisResult.employeeName || sheetName.trim();
      console.log(`[Fallback] Sheet "${sheetName}" - using fallback parser for employee: ${employeeName}`);

      let headerRowIndex = -1;
      let fallbackColIndices: ColumnIndices | null = null;
      let fallbackBestScore = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const candidate = findDataColumnIndices(row);
        if (candidate) {
          let score = 1;
          if (candidate.saida1Col >= 0) score++;
          if (candidate.entrada2Col >= 0) score++;
          if (candidate.saida2Col >= 0) score++;
          if (candidate.he1Col >= 0) score++;
          if (candidate.he2Col >= 0) score++;
          if (candidate.normalHoursCol >= 0) score++;
          if (candidate.totalHoursCol >= 0) score++;
          if (candidate.saldoCol >= 0) score++;
          if (candidate.intervalCol >= 0) score++;
          if (candidate.missingCol >= 0) score++;
          if (candidate.motivoCol >= 0) score++;
          if (score > fallbackBestScore) {
            fallbackBestScore = score;
            fallbackColIndices = candidate;
            headerRowIndex = i;
          }
        }
      }

      if (headerRowIndex === -1) {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row && row.some((cell: any) =>
            typeof cell === 'string' &&
            (cell.toLowerCase().includes('data') || cell.toLowerCase().includes('dia'))
          )) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0;
      }

      console.log(`[Fallback] Header row: ${headerRowIndex}, colIndices:`, fallbackColIndices ? JSON.stringify(fallbackColIndices) : 'null (using positional)');

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const dateColIdx = fallbackColIndices ? fallbackColIndices.dataCol : 0;
        if (!row[dateColIdx]) continue;

        const dateValue = row[dateColIdx];
        const parsedDate = parseDate(dateValue);
        if (!parsedDate) continue;

        let clockIn1Result, clockOut1Result, clockIn2Result, clockOut2Result;
        let motivo = '';
        let intervalHours = 0, missingHours = 0, normalHours = 0;
        let overtime1 = 0, overtime2 = 0, adicionalNoturno = 0, horasNoturasReduzidas = 0;
        let sheetTotalHours = 0;
        let cumulativeSaldo: number | null = null;

        if (fallbackColIndices) {
          clockIn1Result = parseTimeWithLocation(row[fallbackColIndices.entrada1Col]);
          clockOut1Result = fallbackColIndices.saida1Col >= 0 ? parseTimeWithLocation(row[fallbackColIndices.saida1Col]) : { time: null, location: null };
          clockIn2Result = fallbackColIndices.entrada2Col >= 0 ? parseTimeWithLocation(row[fallbackColIndices.entrada2Col]) : { time: null, location: null };
          clockOut2Result = fallbackColIndices.saida2Col >= 0 ? parseTimeWithLocation(row[fallbackColIndices.saida2Col]) : { time: null, location: null };

          if (fallbackColIndices.motivoCol >= 0) {
            const mv = row[fallbackColIndices.motivoCol];
            if (mv && !isTimeValue(mv)) motivo = String(mv);
          }
          if (fallbackColIndices.intervalCol >= 0) intervalHours = parseHoursToDecimal(row[fallbackColIndices.intervalCol]);
          if (fallbackColIndices.missingCol >= 0) missingHours = parseHoursToDecimal(row[fallbackColIndices.missingCol]);
          if (fallbackColIndices.normalHoursCol >= 0) normalHours = parseHoursToDecimal(row[fallbackColIndices.normalHoursCol]);
          if (fallbackColIndices.he1Col >= 0) overtime1 = parseHoursToDecimal(row[fallbackColIndices.he1Col]);
          if (fallbackColIndices.he2Col >= 0) overtime2 = parseHoursToDecimal(row[fallbackColIndices.he2Col]);
          if (fallbackColIndices.adicionalNoturnoCol >= 0) adicionalNoturno = parseHoursToDecimal(row[fallbackColIndices.adicionalNoturnoCol]);
          if (fallbackColIndices.horasNoturasReduzidosCol >= 0) horasNoturasReduzidas = parseHoursToDecimal(row[fallbackColIndices.horasNoturasReduzidosCol]);
          if (fallbackColIndices.totalHoursCol >= 0) sheetTotalHours = parseHoursToDecimal(row[fallbackColIndices.totalHoursCol]);
          if (fallbackColIndices.saldoCol >= 0) {
            const sv = row[fallbackColIndices.saldoCol];
            if (sv !== null && sv !== undefined && sv !== '') cumulativeSaldo = parseHoursToDecimal(sv);
          }
        } else {
          clockIn1Result = parseTimeWithLocation(row[1]);
          clockOut1Result = parseTimeWithLocation(row[2]);
          clockIn2Result = parseTimeWithLocation(row[3]);
          clockOut2Result = parseTimeWithLocation(row[4]);
          motivo = row[5] ? String(row[5]).trim() : '';
        }

        const calculatedTotal = calculateHours(clockIn1Result.time, clockOut1Result.time, clockIn2Result.time, clockOut2Result.time);
        const finalTotal = sheetTotalHours > 0 ? sheetTotalHours : calculatedTotal;

        const record: TimeRecord = {
          employeeName: employeeName,
          recordDate: parsedDate,
          clockIn1: clockIn1Result.time,
          clockOut1: clockOut1Result.time,
          clockIn2: clockIn2Result.time,
          clockOut2: clockOut2Result.time,
          clockIn1Location: clockIn1Result.location,
          clockOut1Location: clockOut1Result.location,
          clockIn2Location: clockIn2Result.location,
          clockOut2Location: clockOut2Result.location,
          recordType: normalizeRecordType(motivo),
          originalRecordType: motivo,
          observations: motivo,
          totalHours: finalTotal,
          intervalHours,
          missingHours,
          normalHours,
          overtime1,
          overtime2,
          adicionalNoturno,
          horasNoturasReduzidas,
          accumulatedBalance: cumulativeSaldo ?? undefined,
        };

        records.push(record);
      }
    }

    const errors: string[] = [];
    const skippedEmployees = new Set<string>();
    const matchStats = { exact: 0, normalized: 0, partial: 0, none: 0 };
    const recordsMap = new Map<string, any>();

    for (const record of records) {
      const matchResult = findEmployeeIdByName(record.employeeName, employeeMap, allEmployeeMap);
      const employeeId = matchResult.id;

      matchStats[matchResult.matchType]++;

      if (!employeeId) {
        if (!skippedEmployees.has(record.employeeName)) {
          if (matchResult.actualEmployee) {
            const locationName = matchResult.actualEmployee.locations?.trade_name || matchResult.actualEmployee.locations?.legal_name || 'outra filial';
            errors.push(`ERRO DE FILIAL: O colaborador "${record.employeeName}" está cadastrado na filial "${locationName}", não na filial selecionada para este upload.`);
          } else {
            errors.push(`Colaborador não encontrado no sistema: ${record.employeeName}`);
          }
          skippedEmployees.add(record.employeeName);
        }
        continue;
      }

      const totalHours = record.totalHours || 0;
      const employeeShift = employeeShiftMap.get(employeeId);
      const shiftExpectedHours = calculateShiftExpectedHours(employeeShift, record.recordDate);
      const sheetSchedule = employeeScheduleMap.get(record.employeeName.toLowerCase().trim());
      const sheetExpectedHours = sheetSchedule ? getExpectedHoursFromSchedule(sheetSchedule, record.recordDate) : 0;
      const recordType = record.recordType || 'work';
      const isWorkDay = recordType === 'work';
      let expectedHours = 0;
      if (isWorkDay) {
        if (sheetExpectedHours > 0) {
          expectedHours = sheetExpectedHours;
        } else if (employeeShift) {
          expectedHours = shiftExpectedHours;
        } else {
          expectedHours = defaultDailyHours;
        }
      }
      const balanceHours = (record.bankHours !== undefined && record.bankHours !== null) ? record.bankHours : (totalHours - expectedHours);
      const key = `${employeeId}_${record.recordDate}`;

      const hasExplicitAccumulated = record.accumulatedBalance !== undefined && record.accumulatedBalance !== null;
      recordsMap.set(key, {
        employee_id: employeeId,
        record_date: record.recordDate,
        clock_in_1: record.clockIn1,
        clock_out_1: record.clockOut1,
        clock_in_2: record.clockIn2,
        clock_out_2: record.clockOut2,
        clock_in_1_location: record.clockIn1Location,
        clock_out_1_location: record.clockOut1Location,
        clock_in_2_location: record.clockIn2Location,
        clock_out_2_location: record.clockOut2Location,
        total_hours: totalHours,
        expected_hours: expectedHours,
        balance_hours: balanceHours,
        accumulated_balance: record.accumulatedBalance ?? 0,
        _hasExplicitAccumulated: hasExplicitAccumulated,
        record_type: record.recordType || 'work',
        original_record_type: record.originalRecordType,
        observations: record.observations,
        interval_hours: record.intervalHours ?? 0,
        missing_hours: record.missingHours ?? 0,
        normal_hours: record.normalHours ?? 0,
        overtime_1: record.overtime1 ?? 0,
        overtime_2: record.overtime2 ?? 0,
        adicional_noturno: record.adicionalNoturno ?? 0,
        horas_noturnas_reduzidas: record.horasNoturasReduzidas ?? 0,
      });
    }

    const employeeGroups = new Map<string, any[]>();
    for (const [, rec] of recordsMap) {
      const empId = rec.employee_id;
      if (!employeeGroups.has(empId)) employeeGroups.set(empId, []);
      employeeGroups.get(empId)!.push(rec);
    }

    for (const [, recs] of employeeGroups) {
      recs.sort((a: any, b: any) => a.record_date.localeCompare(b.record_date));
      let runningBalance = 0;
      let hasAnyAnchor = recs.some((r: any) => r._hasExplicitAccumulated);

      if (hasAnyAnchor) {
        const firstAnchor = recs.find((r: any) => r._hasExplicitAccumulated);
        const firstAnchorIdx = recs.indexOf(firstAnchor);
        runningBalance = firstAnchor.accumulated_balance;
        for (let i = firstAnchorIdx - 1; i >= 0; i--) {
          runningBalance -= recs[i + 1].balance_hours;
          recs[i].accumulated_balance = Number(runningBalance.toFixed(2));
        }
        runningBalance = firstAnchor.accumulated_balance;
        for (let i = firstAnchorIdx + 1; i < recs.length; i++) {
          if (recs[i]._hasExplicitAccumulated) {
            runningBalance = recs[i].accumulated_balance;
          } else {
            runningBalance = Number((runningBalance + recs[i].balance_hours).toFixed(2));
            recs[i].accumulated_balance = runningBalance;
          }
        }
      }

      for (const rec of recs) {
        delete rec._hasExplicitAccumulated;
      }
    }

    const recordsToInsert = Array.from(recordsMap.values());

    let processedCount = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
      const { error: batchError } = await supabaseAdmin
        .from("time_records")
        .upsert(batch, { onConflict: 'employee_id,record_date' });

      if (batchError) {
        errors.push(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`);
      } else {
        processedCount += batch.length;
      }
    }

    const bankEntriesMap = new Map<string, any>();

    for (const entry of allTimeBankEntries) {
      const matchResult = findEmployeeIdByName(entry.employeeName, employeeMap, allEmployeeMap);
      if (matchResult.id) {
        const key = `${matchResult.id}_${entry.entryDate}_${entry.reason}`;
        const existing = bankEntriesMap.get(key);
        if (existing) {
          existing.hours = Number((existing.hours + entry.hours).toFixed(2));
        } else {
          bankEntriesMap.set(key, {
            employee_id: matchResult.id,
            entry_date: entry.entryDate,
            hours: entry.hours,
            reason: entry.reason,
          });
        }
      }
    }

    const bankEntriesToInsert = Array.from(bankEntriesMap.values());
    if (bankEntriesToInsert.length > 0) {
      for (let i = 0; i < bankEntriesToInsert.length; i += BATCH_SIZE) {
        const batch = bankEntriesToInsert.slice(i, i + BATCH_SIZE);
        const { error: bankError } = await supabaseAdmin
          .from("time_bank_entries")
          .upsert(batch, { onConflict: 'employee_id,entry_date,reason' });
        if (bankError) {
          errors.push(`Erro ao inserir lançamentos banco de horas: ${bankError.message}`);
        }
      }
    }

    const allDates = recordsToInsert.map((r: any) => r.record_date).filter(Boolean).sort();
    const refMonth = allDates.length > 0 ? allDates[Math.floor(allDates.length / 2)].slice(0, 7) : null;
    const uniqueEmployees = new Set(recordsToInsert.map((r: any) => r.employee_id));

    await supabaseAdmin
      .from("time_tracking_uploads")
      .update({
        status: errors.length > 0 ? "failed" : "completed",
        records_processed: processedCount,
        error_message: errors.length > 0 ? errors.join("\n") : null,
        reference_month: refMonth,
        total_employees_processed: uniqueEmployees.size,
      })
      .eq("id", uploadRecord.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        recordsProcessed: processedCount,
        totalRecords: records.length,
        errors: errors.length > 0 ? errors : undefined,
        matchStats,
        referenceMonth: refMonth,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing timesheet:", error);

    let errorMessage = "Erro desconhecido ao processar planilha";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
