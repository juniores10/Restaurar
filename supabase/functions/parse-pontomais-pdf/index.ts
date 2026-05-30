import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AbsenteeismRecord {
  employee_name: string;
  employee_id_external?: string;
  team?: string;
  position?: string;
  sector?: string;
  unit?: string;
  record_date: string;
  absence_type: string;
  status: string;
  expected_hours: number;
  absent_hours: number;
  worked_hours: number;
  overtime_hours: number;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Content-Type must be multipart/form-data"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = extractTextFromPdf(uint8Array);

    const records = parseAbsenteeismText(text);

    return new Response(
      JSON.stringify({
        success: true,
        records,
        totalRecords: records.length,
        fileName: file.name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractTextFromPdf(data: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(data);

  const textParts: string[] = [];

  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let match;

  while ((match = streamRegex.exec(content)) !== null) {
    const streamContent = match[1];
    const textMatches = streamContent.match(/\(([^)]*)\)/g);
    if (textMatches) {
      for (const textMatch of textMatches) {
        const text = textMatch.slice(1, -1);
        const decoded = decodeEscapedText(text);
        if (decoded.trim()) {
          textParts.push(decoded);
        }
      }
    }

    const tjMatches = streamContent.match(/\[(.*?)\]\s*TJ/g);
    if (tjMatches) {
      for (const tjMatch of tjMatches) {
        const innerMatches = tjMatch.match(/\(([^)]*)\)/g);
        if (innerMatches) {
          const combined = innerMatches
            .map(m => decodeEscapedText(m.slice(1, -1)))
            .join("");
          if (combined.trim()) {
            textParts.push(combined);
          }
        }
      }
    }
  }

  return textParts.join("\n");
}

function decodeEscapedText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function parseAbsenteeismText(text: string): AbsenteeismRecord[] {
  const records: AbsenteeismRecord[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  let currentEmployee: {
    name?: string;
    registration?: string;
    team?: string;
    position?: string;
    sector?: string;
    unit?: string;
  } = {};

  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const timePattern = /(\d{2}:\d{2})/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().includes("funcionário:") || line.toLowerCase().includes("funcionario:")) {
      const namePart = line.split(":")[1]?.trim();
      if (namePart) {
        currentEmployee.name = namePart.split("-")[0]?.trim();
        const regMatch = namePart.match(/matrícula[:\s]*(\d+)/i);
        if (regMatch) {
          currentEmployee.registration = regMatch[1];
        }
      }
    }

    if (line.toLowerCase().includes("matrícula:") || line.toLowerCase().includes("matricula:")) {
      const regPart = line.split(":")[1]?.trim();
      if (regPart) {
        currentEmployee.registration = regPart.replace(/\D/g, "");
      }
    }

    if (line.toLowerCase().includes("equipe:")) {
      currentEmployee.team = line.split(":")[1]?.trim();
    }

    if (line.toLowerCase().includes("cargo:") || line.toLowerCase().includes("função:")) {
      currentEmployee.position = line.split(":")[1]?.trim();
    }

    if (line.toLowerCase().includes("setor:") || line.toLowerCase().includes("departamento:")) {
      currentEmployee.sector = line.split(":")[1]?.trim();
    }

    if (line.toLowerCase().includes("unidade:") || line.toLowerCase().includes("filial:")) {
      currentEmployee.unit = line.split(":")[1]?.trim();
    }

    const dateMatch = line.match(datePattern);
    if (dateMatch && currentEmployee.name) {
      const [, day, month, year] = dateMatch;
      const recordDate = `${year}-${month}-${day}`;

      const times = line.match(timePattern) || [];
      const workedHours = calculateWorkedHours(times);

      const dayOfWeek = getDayOfWeek(line);
      const isWeekend = dayOfWeek === "sab" || dayOfWeek === "dom";
      const expectedHours = isWeekend ? 0 : 8;

      const absentHours = Math.max(0, expectedHours - workedHours);
      const overtimeHours = Math.max(0, workedHours - expectedHours);

      let absenceType = "presente";
      let reason: string | undefined;

      if (line.toLowerCase().includes("falta") || (workedHours === 0 && !isWeekend)) {
        absenceType = "falta";
        if (line.toLowerCase().includes("justificada")) {
          absenceType = "falta_justificada";
        }
      } else if (line.toLowerCase().includes("atestado")) {
        absenceType = "atestado";
        reason = "Atestado médico";
      } else if (line.toLowerCase().includes("férias") || line.toLowerCase().includes("ferias")) {
        absenceType = "ferias";
      } else if (line.toLowerCase().includes("folga")) {
        absenceType = "folga";
      } else if (line.toLowerCase().includes("licença") || line.toLowerCase().includes("licenca")) {
        absenceType = "licenca";
      } else if (absentHours > 0 && absentHours < expectedHours) {
        absenceType = "atraso";
      }

      const isComputable = !["ferias", "folga", "licenca"].includes(absenceType) && !isWeekend;

      records.push({
        employee_name: currentEmployee.name,
        employee_id_external: currentEmployee.registration,
        team: currentEmployee.team,
        position: currentEmployee.position,
        sector: currentEmployee.sector,
        unit: currentEmployee.unit,
        record_date: recordDate,
        absence_type: absenceType,
        status: isComputable ? "computavel" : "nao_computavel",
        expected_hours: expectedHours,
        absent_hours: absentHours,
        worked_hours: workedHours,
        overtime_hours: overtimeHours,
        reason,
      });
    }
  }

  return records;
}

function calculateWorkedHours(times: string[]): number {
  if (times.length < 2) return 0;

  let totalMinutes = 0;

  for (let i = 0; i < times.length - 1; i += 2) {
    const entry = parseTime(times[i]);
    const exit = parseTime(times[i + 1]);
    if (entry !== null && exit !== null) {
      totalMinutes += exit - entry;
    }
  }

  return Math.round((totalMinutes / 60) * 100) / 100;
}

function parseTime(time: string): number | null {
  const match = time.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function getDayOfWeek(line: string): string {
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const lowerLine = line.toLowerCase();
  for (const day of days) {
    if (lowerLine.includes(day)) {
      return day;
    }
  }
  return "";
}
