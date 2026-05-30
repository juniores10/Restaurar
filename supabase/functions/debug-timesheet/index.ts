import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizeColumnName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ªº°]/g, '')
    .replace(/\s+/g, ' ');
}

function isLocationColumn(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  return normalized.includes('local') || normalized.includes('endereco') ||
         normalized.includes('localizacao') || normalized.includes('gps') ||
         normalized.includes('coordenada') || normalized.includes('location');
}

function isHe2Column(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  return (normalized.includes('he2') || normalized.includes('h.e.2') ||
          normalized.includes('he 2') || normalized.includes('h.e. 2') ||
          withoutSpaces.includes('h.e.2') || withoutSpaces.includes('he2') ||
          (normalized.includes('extra') && normalized.includes('2') && normalized.includes('100')) ||
          (normalized.includes('extra') && normalized.includes('fator 2')) ||
          (normalized.includes('extra') && normalized.includes('fator') && normalized.includes('100')) ||
          /h\.?e\.?\s*2/i.test(normalized) ||
          /fator\s*2/i.test(normalized));
}

function isHe1Column(cell: string): boolean {
  const normalized = normalizeColumnName(cell);
  const withoutSpaces = normalized.replace(/\s+/g, '');
  if (isHe2Column(cell)) return false;
  return (normalized.includes('he1') || normalized.includes('h.e.1') ||
          normalized.includes('he 1') || normalized.includes('h.e. 1') ||
          withoutSpaces.includes('h.e.1') || withoutSpaces.includes('he1') ||
          (normalized.includes('extra') && normalized.includes('1') && normalized.includes('0')) ||
          /h\.?e\.?\s*1/i.test(normalized));
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
  return normalized.includes('carga') || normalized.includes('horario') ||
         normalized.includes('jornada') || normalized.includes('total') ||
         normalized.includes('horas') ||
         normalized.includes('extra') || normalized.includes('banco') ||
         normalized.includes('trabalhad') || normalized.includes('previst');
}

function analyzeHeader(headerRow: any[]): any {
  const analysis: any = {
    columns: [],
    detected: {
      dataCol: -1,
      entrada1Col: -1,
      saida1Col: -1,
      entrada2Col: -1,
      saida2Col: -1,
      motivoCol: -1,
      he1Col: -1,
      he2Col: -1,
      saldoCol: -1,
      locationCols: [],
      ignoreCols: []
    }
  };

  const timeColumns: { index: number; type: string; number: number; raw: string }[] = [];

  for (let i = 0; i < headerRow.length; i++) {
    const cellRaw = String(headerRow[i] || '');
    const cell = normalizeColumnName(cellRaw);

    let classification = 'unknown';

    if (isLocationColumn(cellRaw)) {
      classification = 'location';
      analysis.detected.locationCols.push(i);
    } else if (isSaldoColumn(cellRaw)) {
      classification = 'saldo';
      if (analysis.detected.saldoCol === -1) analysis.detected.saldoCol = i;
    } else if (isHe2Column(cellRaw)) {
      classification = 'he2';
      if (analysis.detected.he2Col === -1) analysis.detected.he2Col = i;
    } else if (isHe1Column(cellRaw)) {
      classification = 'he1';
      if (analysis.detected.he1Col === -1) analysis.detected.he1Col = i;
    } else if (isIgnoreColumn(cellRaw)) {
      classification = 'ignore';
      analysis.detected.ignoreCols.push(i);
    } else if (cell === 'data' || cell === 'dia') {
      classification = 'data';
      if (analysis.detected.dataCol === -1) analysis.detected.dataCol = i;
    } else if (cell === 'motivo' || cell === 'tipo' || cell === 'observacao' || cell === 'obs' ||
               cell === 'justificativa' || cell === 'ocorrencia') {
      classification = 'motivo';
      if (analysis.detected.motivoCol === -1) analysis.detected.motivoCol = i;
    } else {
      const has1 = cell.includes('1') || cell.includes('primeira') || cell.includes('1a');
      const has2 = cell.includes('2') || cell.includes('segunda') || cell.includes('2a');
      const hasEntrada = cell.includes('entrada');
      const hasSaida = cell.includes('saida') || cell.includes('said');

      if (hasEntrada && !hasSaida) {
        const num = has2 ? 2 : 1;
        classification = `entrada${num}`;
        timeColumns.push({ index: i, type: 'entrada', number: num, raw: cellRaw });
      } else if (hasSaida && !hasEntrada) {
        const num = has2 ? 2 : 1;
        classification = `saida${num}`;
        timeColumns.push({ index: i, type: 'saida', number: num, raw: cellRaw });
      }
    }

    analysis.columns.push({
      index: i,
      raw: cellRaw,
      normalized: cell,
      classification
    });
  }

  const entrada1Cols = timeColumns.filter(c => c.type === 'entrada' && c.number === 1);
  const saida1Cols = timeColumns.filter(c => c.type === 'saida' && c.number === 1);
  const entrada2Cols = timeColumns.filter(c => c.type === 'entrada' && c.number === 2);
  const saida2Cols = timeColumns.filter(c => c.type === 'saida' && c.number === 2);

  if (entrada1Cols.length > 0) analysis.detected.entrada1Col = entrada1Cols[0].index;
  if (saida1Cols.length > 0) analysis.detected.saida1Col = saida1Cols[0].index;
  if (entrada2Cols.length > 0) analysis.detected.entrada2Col = entrada2Cols[0].index;
  if (saida2Cols.length > 0) analysis.detected.saida2Col = saida2Cols[0].index;

  analysis.timeColumnsFound = timeColumns;

  return analysis;
}

function extractEmployeeName(rows: any[][]): string | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      const cellStr = String(cell || '').toLowerCase().trim();
      if (cellStr === 'nome' || cellStr === 'nome:' || cellStr === 'colaborador' || cellStr === 'colaborador:') {
        const nameCell = row[j + 1];
        if (nameCell && typeof nameCell === 'string' && nameCell.trim().length > 0) {
          return nameCell.trim();
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Invalid authentication token");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

    const debugInfo: any = {
      sheetNames: workbook.SheetNames,
      sheets: {}
    };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const employeeName = extractEmployeeName(rows);

      let headerRowIndex = -1;
      let headerAnalysis = null;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const hasDataExact = row.some((cell: any) => {
          const cellStr = normalizeColumnName(String(cell || ''));
          return cellStr === 'data' || cellStr === 'dia';
        });

        const hasEntrada = row.some((cell: any) => {
          const cellStr = normalizeColumnName(String(cell || ''));
          return cellStr.includes('entrada');
        });

        if (hasDataExact && hasEntrada) {
          headerRowIndex = i;
          headerAnalysis = analyzeHeader(row);
          break;
        }
      }

      const sampleDataRows = [];
      if (headerRowIndex >= 0 && headerAnalysis) {
        for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 6, rows.length); i++) {
          const row = rows[i];
          if (!row) continue;
          const mappedRow: any = { rowIndex: i, rawCells: row };
          if (headerAnalysis.detected.dataCol >= 0) mappedRow.data = row[headerAnalysis.detected.dataCol];
          if (headerAnalysis.detected.entrada1Col >= 0) mappedRow.entrada1 = row[headerAnalysis.detected.entrada1Col];
          if (headerAnalysis.detected.saida1Col >= 0) mappedRow.saida1 = row[headerAnalysis.detected.saida1Col];
          if (headerAnalysis.detected.entrada2Col >= 0) mappedRow.entrada2 = row[headerAnalysis.detected.entrada2Col];
          if (headerAnalysis.detected.saida2Col >= 0) mappedRow.saida2 = row[headerAnalysis.detected.saida2Col];
          if (headerAnalysis.detected.motivoCol >= 0) mappedRow.motivo = row[headerAnalysis.detected.motivoCol];
          if (headerAnalysis.detected.he1Col >= 0) mappedRow.he1 = row[headerAnalysis.detected.he1Col];
          if (headerAnalysis.detected.he2Col >= 0) mappedRow.he2 = row[headerAnalysis.detected.he2Col];
          if (headerAnalysis.detected.saldoCol >= 0) mappedRow.saldo = row[headerAnalysis.detected.saldoCol];
          sampleDataRows.push(mappedRow);
        }
      }

      debugInfo.sheets[sheetName] = {
        totalRows: rows.length,
        employeeName,
        headerRowIndex,
        headerAnalysis,
        sampleDataRows,
        first15Rows: rows.slice(0, 15).map((row, idx) => ({
          rowIndex: idx,
          cells: row
        }))
      };
    }

    return new Response(
      JSON.stringify(debugInfo, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
