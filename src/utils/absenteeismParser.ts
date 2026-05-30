import * as pdfjsLib from 'pdfjs-dist';
import type {
  ParsedEmployee,
  ParseResult,
  DailyRecord,
  AbsenceType,
  ParseError,
  UnparsedLine,
  EmployeeInfo,
} from '../types/absenteeism';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const REASON_MAPPINGS: Record<string, AbsenceType> = {
  'atestado': 'saude',
  'atestado medico': 'saude',
  'declaracao medica': 'saude',
  'consulta medica': 'saude',
  'doenca': 'saude',
  'licenca medica': 'saude',
  'acidente trabalho': 'saude',
  'falta': 'injustificada',
  'falta sem justificativa': 'injustificada',
  'falta injustificada': 'injustificada',
  'ausencia': 'injustificada',
  'atraso': 'atraso',
  'chegada tardia': 'atraso',
  'ferias': 'ferias',
  'folga': 'folga',
  'descanso semanal': 'folga',
  'dsr': 'folga',
  'feriado': 'feriado',
  'natal': 'feriado',
  'ano novo': 'feriado',
  'compensacao': 'compensacao',
  'compensacao empresa': 'compensacao',
  'banco de horas': 'compensacao',
  'licenca': 'licenca',
  'licenca paternidade': 'licenca',
  'licenca maternidade': 'licenca',
  'licenca casamento': 'licenca',
  'licenca obito': 'licenca',
  'abono': 'compensacao',
};

const NON_COMPUTABLE_TYPES: AbsenceType[] = [
  'ferias',
  'folga',
  'feriado',
  'compensacao',
];

const DAYS_OF_WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAYS_OF_WEEK_FULL = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseTime(timeStr: string): number {
  if (!timeStr || timeStr === '-' || timeStr === '--:--') return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours + minutes / 60;
}

function classifyAbsence(reason: string, absentHours: number): AbsenceType {
  if (!reason && absentHours === 0) return 'normal';
  if (!reason && absentHours > 0) return 'injustificada';

  const normalized = normalizeText(reason);
  for (const [key, value] of Object.entries(REASON_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  if (absentHours > 0 && absentHours < 2) {
    return 'atraso';
  }

  return 'outros';
}

function isComputable(type: AbsenceType): boolean {
  return !NON_COMPUTABLE_TYPES.includes(type);
}

function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  let year = parseInt(match[3], 10);
  if (year < 100) year += 2000;

  return new Date(year, month, day);
}

function extractPeriod(text: string): { start: Date | null; end: Date | null } {
  const periodMatch = text.match(/periodo[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:a|ate|-)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (periodMatch) {
    return {
      start: parseDate(periodMatch[1]),
      end: parseDate(periodMatch[2]),
    };
  }
  return { start: null, end: null };
}

function extractEmployeeInfo(lines: string[]): EmployeeInfo {
  const info: EmployeeInfo = { name: '' };

  for (const line of lines) {
    const normalizedLine = line.toLowerCase();

    const nameMatch = line.match(/(?:nome|colaborador|funcionario)[:\s]+([A-Za-zÀ-ÿ\s]+)/i);
    if (nameMatch) {
      info.name = nameMatch[1].trim();
    }

    const cpfMatch = line.match(/cpf[:\s]+(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i);
    if (cpfMatch) {
      info.cpf = cpfMatch[1];
    }

    const matriculaMatch = line.match(/(?:matricula|registro|id)[:\s]+(\d+)/i);
    if (matriculaMatch) {
      info.registration = matriculaMatch[1];
    }

    const cargoMatch = line.match(/(?:cargo|funcao)[:\s]+([A-Za-zÀ-ÿ\s\/\-]+)/i);
    if (cargoMatch) {
      info.position = cargoMatch[1].trim();
    }

    const equipeMatch = line.match(/(?:equipe|time)[:\s]+([A-Za-zÀ-ÿ\s\d]+)/i);
    if (equipeMatch) {
      info.team = equipeMatch[1].trim();
    }

    const setorMatch = line.match(/(?:setor|departamento)[:\s]+([A-Za-zÀ-ÿ\s\d]+)/i);
    if (setorMatch) {
      info.sector = setorMatch[1].trim();
    }

    const unidadeMatch = line.match(/(?:unidade|filial|empresa)[:\s]+([A-Za-zÀ-ÿ\s\d\-]+)/i);
    if (unidadeMatch) {
      info.unit = unidadeMatch[1].trim();
    }

    const turnoMatch = line.match(/(?:turno|horario|jornada)[:\s]+([A-Za-zÀ-ÿ\s\d:\-]+)/i);
    if (turnoMatch) {
      info.shift = turnoMatch[1].trim();
    }
  }

  return info;
}

function parseDailyLine(line: string): DailyRecord | null {
  const normalized = normalizeText(line);

  let dayMatch = null;
  for (const day of DAYS_OF_WEEK) {
    if (normalized.includes(day)) {
      dayMatch = day;
      break;
    }
  }
  if (!dayMatch) {
    for (const day of DAYS_OF_WEEK_FULL) {
      if (normalized.includes(day)) {
        dayMatch = day.substring(0, 3);
        break;
      }
    }
  }

  const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/?\d{0,4})/);
  if (!dateMatch) return null;

  let dateStr = dateMatch[1];
  if (!dateStr.match(/\d{4}$/)) {
    const currentYear = new Date().getFullYear();
    if (dateStr.split('/').length === 2) {
      dateStr += `/${currentYear}`;
    } else if (dateStr.match(/\/\d{2}$/)) {
      dateStr = dateStr.replace(/\/(\d{2})$/, `/20$1`);
    }
  }

  const date = parseDate(dateStr);
  if (!date) return null;

  const times = line.match(/\d{2}:\d{2}/g) || [];

  let expectedHours = 8;
  let workedHours = 0;
  let absentHours = 0;
  let normalHours = 0;
  let overtimeHours = 0;

  if (times.length > 0) {
    const horasNormaisMatch = line.match(/(?:h\.?\s*normais?|horas?\s*normais?)[:\s]*(\d{2}:\d{2})/i);
    if (horasNormaisMatch) {
      normalHours = parseTime(horasNormaisMatch[1]);
      workedHours = normalHours;
    }

    const horasFaltantesMatch = line.match(/(?:h\.?\s*falt(?:antes?)?|horas?\s*falt(?:antes?)?)[:\s]*(\d{2}:\d{2})/i);
    if (horasFaltantesMatch) {
      absentHours = parseTime(horasFaltantesMatch[1]);
    }

    const horasExtrasMatch = line.match(/(?:h\.?\s*extras?|horas?\s*extras?|h\.?e\.?)[:\s]*(\d{2}:\d{2})/i);
    if (horasExtrasMatch) {
      overtimeHours = parseTime(horasExtrasMatch[1]);
    }

    const htMatch = line.match(/(?:h\.?\s*t\.?|horas?\s*totais?)[:\s]*(\d{2}:\d{2})/i);
    if (htMatch) {
      workedHours = parseTime(htMatch[1]);
    }
  }

  const parts = line.split(/\s{2,}|\t/);
  let reason = '';

  const motivoIndex = parts.findIndex(p =>
    p.toLowerCase().includes('atestado') ||
    p.toLowerCase().includes('falta') ||
    p.toLowerCase().includes('ferias') ||
    p.toLowerCase().includes('folga') ||
    p.toLowerCase().includes('feriado') ||
    p.toLowerCase().includes('compensacao') ||
    p.toLowerCase().includes('licenca') ||
    p.toLowerCase().includes('atraso')
  );

  if (motivoIndex !== -1) {
    reason = parts[motivoIndex].trim();
  }

  if (!reason && absentHours === 0 && workedHours === 0 && times.length === 0) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('folga') || lowerLine.includes('dsr')) {
      reason = 'folga';
      expectedHours = 0;
    } else if (lowerLine.includes('ferias')) {
      reason = 'ferias';
      expectedHours = 0;
    } else if (lowerLine.includes('feriado')) {
      reason = 'feriado';
      expectedHours = 0;
    }
  }

  if (normalHours > 0) {
    expectedHours = normalHours + absentHours;
  }

  const absenceType = classifyAbsence(reason, absentHours);

  return {
    date,
    dayOfWeek: dayMatch || DAYS_OF_WEEK[date.getDay()],
    expectedHours,
    workedHours: workedHours || normalHours,
    absentHours,
    normalHours,
    overtimeHours,
    reason: reason || undefined,
    absenceType,
    isComputable: isComputable(absenceType) && absentHours > 0,
  };
}

async function extractTextFromPdf(file: File): Promise<{ pages: string[]; errors: ParseError[] }> {
  const errors: ParseError[] = [];
  const pages: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => {
            const textItem = item as { str?: string };
            return textItem.str || '';
          })
          .join(' ');
        pages.push(pageText);
      } catch (pageError) {
        errors.push({
          page: i,
          message: `Erro ao extrair texto da página ${i}: ${pageError}`,
        });
        pages.push('');
      }
    }
  } catch (error) {
    errors.push({
      page: 0,
      message: `Erro ao abrir o PDF: ${error}`,
    });
  }

  return { pages, errors };
}

function splitIntoEmployeeBlocks(pageText: string): string[] {
  const blocks: string[] = [];
  const lines = pageText.split(/\n|\r\n/);

  let currentBlock: string[] = [];

  for (const line of lines) {
    const normalized = normalizeText(line);

    if (
      normalized.includes('nome:') ||
      normalized.includes('colaborador:') ||
      normalized.includes('funcionario:') ||
      (normalized.includes('espelho') && normalized.includes('ponto'))
    ) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
      }
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  if (blocks.length === 0 && pageText.trim()) {
    blocks.push(pageText);
  }

  return blocks;
}

export async function parsePontomaisPdf(files: File[]): Promise<ParseResult> {
  const result: ParseResult = {
    success: true,
    employees: [],
    errors: [],
    warnings: [],
    unparsedLines: [],
  };

  for (const file of files) {
    const { pages, errors } = await extractTextFromPdf(file);
    result.errors.push(...errors);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageText = pages[pageIndex];
      if (!pageText.trim()) continue;

      const blocks = splitIntoEmployeeBlocks(pageText);

      for (const block of blocks) {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length < 3) continue;

        const employeeInfo = extractEmployeeInfo(lines);

        if (!employeeInfo.name) {
          const firstNonEmptyLine = lines.find(l => {
            const normalized = normalizeText(l);
            return l.trim().length > 3 &&
              !normalized.includes('espelho') &&
              !normalized.includes('ponto') &&
              !normalized.includes('periodo') &&
              !l.match(/^\d/);
          });
          if (firstNonEmptyLine) {
            employeeInfo.name = firstNonEmptyLine.trim().split(/\s{2,}/)[0];
          }
        }

        if (!employeeInfo.name) {
          result.warnings.push(`Não foi possível identificar o nome do colaborador na página ${pageIndex + 1}`);
          continue;
        }

        const periodText = lines.join(' ');
        const period = extractPeriod(periodText);

        const records: DailyRecord[] = [];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];

          const hasDate = line.match(/\d{1,2}\/\d{1,2}/);
          const hasDayOfWeek = DAYS_OF_WEEK.some(d => normalizeText(line).includes(d)) ||
            DAYS_OF_WEEK_FULL.some(d => normalizeText(line).includes(d));

          if (hasDate || hasDayOfWeek) {
            const record = parseDailyLine(line);
            if (record) {
              records.push(record);
            } else if (hasDate && hasDayOfWeek) {
              result.unparsedLines.push({
                page: pageIndex + 1,
                lineNumber: lineIndex + 1,
                text: line.substring(0, 100),
                reason: 'Não foi possível extrair os dados da linha',
              });
            }
          }
        }

        if (records.length > 0) {
          const employee: ParsedEmployee = {
            info: employeeInfo,
            periodStart: period.start || records[0].date,
            periodEnd: period.end || records[records.length - 1].date,
            records,
          };
          result.employees.push(employee);
        }
      }
    }
  }

  if (result.employees.length === 0 && files.length > 0) {
    result.success = false;
    result.errors.push({
      page: 0,
      message: 'Não foi possível extrair dados de nenhum colaborador. Verifique se o formato do PDF é compatível.',
    });
  }

  return result;
}

export function getParsePreview(result: ParseResult): {
  employeeCount: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  totalRecords: number;
  sampleRecords: Array<{
    employee: string;
    date: string;
    absentHours: number;
    reason: string;
  }>;
} {
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  let totalRecords = 0;
  const sampleRecords: Array<{
    employee: string;
    date: string;
    absentHours: number;
    reason: string;
  }> = [];

  for (const employee of result.employees) {
    totalRecords += employee.records.length;

    if (!periodStart || employee.periodStart < periodStart) {
      periodStart = employee.periodStart;
    }
    if (!periodEnd || employee.periodEnd > periodEnd) {
      periodEnd = employee.periodEnd;
    }

    const absentRecords = employee.records.filter(r => r.absentHours > 0);
    for (const record of absentRecords.slice(0, 2)) {
      if (sampleRecords.length < 10) {
        sampleRecords.push({
          employee: employee.info.name,
          date: record.date.toLocaleDateString('pt-BR'),
          absentHours: record.absentHours,
          reason: record.reason || record.absenceType,
        });
      }
    }
  }

  return {
    employeeCount: result.employees.length,
    periodStart,
    periodEnd,
    totalRecords,
    sampleRecords,
  };
}
