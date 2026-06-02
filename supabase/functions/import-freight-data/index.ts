import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { records } = await req.json();

    if (!records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "records array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = records.map((r: any[]) => ({
      shipment_date: r[0] || null,
      nf_number: r[1] || null,
      nature: r[2] || null,
      client_cnpj: r[3] || null,
      client_name: r[4] || null,
      destination_city: r[5] || null,
      destination_state: r[6] || null,
      destination_cep: r[7] || null,
      volume: r[8] || 0,
      weight: r[9] || 0,
      nf_value: r[10] || 0,
      carrier_name: r[11] || null,
      competencia: r[12] || null,
      day_number: r[13] || null,
      month_name: r[14] || null,
      year_number: r[15] || null,
      invoice_number: r[16] || null,
      cte_number: r[17] || null,
      quote_value: r[18] || 0,
      freight_value: r[19] || 0,
      quote_vs_nf_pct: r[20] || 0,
      freight_vs_nf_pct: r[21] || 0,
      cost_value: r[22] || 0,
      estimated_delivery: r[23] || null,
      delivered_at: r[24] || null,
      status: r[25] || "em_transporte",
      business_days: r[26] || 0,
      observations: r[27] || null,
    }));

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from("freight_records").insert(batch);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, inserted, batch_index: i }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ success: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
