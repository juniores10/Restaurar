import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getPayrollPeriod(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-21`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-20`;
  return { startDate, endDate };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticacao necessario" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario nao autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, user_type_id, user_types!inner(name)")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Perfil de colaborador nao encontrado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userTypeName = (employee as any).user_types?.name;
    if (!["Administrador", "Gestor", "Líder"].includes(userTypeName)) {
      return new Response(
        JSON.stringify({ error: "Sem permissao para excluir registros" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const month = body.month;
    const locationId = body.locationId || null;
    const uploadId = body.uploadId || null;
    const usePayrollPeriod = body.usePayrollPeriod !== false;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(
        JSON.stringify({ error: "Mes invalido. Use o formato YYYY-MM" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let startDate: string;
    let endDate: string;

    if (usePayrollPeriod) {
      const period = getPayrollPeriod(month);
      startDate = period.startDate;
      endDate = period.endDate;
    } else {
      const [year, mon] = month.split("-").map(Number);
      startDate = `${month}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
    }

    let employeeFilter: string[] | null = null;

    if (locationId) {
      const { data: employees } = await supabaseAdmin
        .from("employees")
        .select("id")
        .eq("workplace_id", locationId);

      employeeFilter = employees?.map((e: any) => e.id) || [];

      if (employeeFilter.length === 0) {
        if (uploadId) {
          await supabaseAdmin.from("time_tracking_uploads").delete().eq("id", uploadId);
        }
        return new Response(
          JSON.stringify({ success: true, deleted: 0, month, message: "Nenhum colaborador encontrado na filial" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let allIds: string[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      let query = supabaseAdmin
        .from("time_records")
        .select("id")
        .gte("record_date", startDate)
        .lte("record_date", endDate)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (employeeFilter) {
        query = query.in("employee_id", employeeFilter);
      }

      const { data: recs, error: fetchErr } = await query;

      if (fetchErr) {
        console.error("Fetch error:", fetchErr);
        break;
      }

      if (!recs || recs.length === 0) break;

      allIds = allIds.concat(recs.map((r: any) => r.id));

      if (recs.length < PAGE_SIZE) break;
      page++;
    }

    let deleted = 0;
    const BATCH_SIZE = 100;

    if (allIds.length > 0) {
      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE);

        await supabaseAdmin
          .from("time_record_attachments")
          .delete()
          .in("time_record_id", batch);

        const { error: delErr } = await supabaseAdmin
          .from("time_records")
          .delete()
          .in("id", batch);

        if (delErr) {
          console.error("Batch delete error:", delErr);
        } else {
          deleted += batch.length;
        }
      }
    }

    if (uploadId) {
      await supabaseAdmin.from("time_tracking_uploads").delete().eq("id", uploadId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted,
        month,
        message: deleted > 0
          ? `${deleted} registros excluidos com sucesso`
          : "Nenhum registro encontrado para excluir",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
