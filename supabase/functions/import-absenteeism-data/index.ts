import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AbsenteeismRecord {
  employee_name: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { records, uploadId } = await req.json();

    if (!records || !Array.isArray(records) || !uploadId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: records (array) and uploadId (string)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar informações dos colaboradores para enriquecer os dados
    const uniqueEmployeeNames = Array.from(
      new Set(records.map((r: AbsenteeismRecord) => r.employee_name))
    );

    const { data: employees } = await supabase
      .from("employees")
      .select(`
        name,
        registration_number,
        team_id,
        department_id,
        teams:team_id (name),
        departments:department_id (name)
      `)
      .in("name", uniqueEmployeeNames);

    const employeeMap = new Map(
      (employees || []).map((e: any) => [
        e.name.toUpperCase(),
        {
          registration: e.registration_number,
          team: e.teams?.name || null,
          department: e.departments?.name || null,
        },
      ])
    );

    // Preparar registros para inserção com informações enriquecidas
    const recordsToInsert = records.map((r: AbsenteeismRecord) => {
      const employeeInfo = employeeMap.get(r.employee_name.toUpperCase());
      return {
        upload_id: uploadId,
        employee_name: r.employee_name,
        employee_id_external: employeeInfo?.registration || null,
        team: employeeInfo?.team || null,
        sector: employeeInfo?.department || null,
        record_date: r.record_date,
        absence_type: r.absence_type,
        status: r.status,
        expected_hours: r.expected_hours,
        absent_hours: r.absent_hours,
        worked_hours: r.worked_hours,
        overtime_hours: r.overtime_hours,
        reason: r.reason || null,
      };
    });

    // Inserir em lotes de 100
    const batchSize = 100;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from("absenteeism_records").insert(batch);

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        total: recordsToInsert.length,
        errors: errors.length > 0 ? errors : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
