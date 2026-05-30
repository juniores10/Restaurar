import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', version: '3.0' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'ENV_MISSING', details: { url: !!supabaseUrl, key: !!supabaseServiceKey } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const testEmail = 'colaborador.teste@peganet.com';
  const testPassword = 'Teste123!';

  try {
    const { data: empData, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, name')
      .eq('email', testEmail)
      .maybeSingle();

    if (empError) {
      return new Response(
        JSON.stringify({ success: false, error: 'EMPLOYEE_QUERY_ERROR', message: empError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!empData) {
      return new Response(
        JSON.stringify({ success: false, error: 'EMPLOYEE_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUserId: string | null = null;

    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();

    if (listErr) {
      return new Response(
        JSON.stringify({ success: false, error: 'LIST_USERS_ERROR', message: listErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = usersData?.users?.find((u: { email?: string }) => u.email === testEmail);

    if (existingUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: testPassword });
      if (updateErr) {
        return new Response(
          JSON.stringify({ success: false, error: 'AUTH_UPDATE_ERROR', message: updateErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authUserId = existingUser.id;
    } else {
      const { data: signUpData, error: signUpErr } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      if (signUpErr) {
        if (signUpErr.message.includes('already registered') || signUpErr.message.includes('already been registered')) {
          const retryList = await supabaseAdmin.auth.admin.listUsers();
          const retryUser = retryList.data?.users?.find((u: { email?: string }) => u.email === testEmail);
          if (retryUser) {
            await supabaseAdmin.auth.admin.updateUserById(retryUser.id, { password: testPassword });
            authUserId = retryUser.id;
          }
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'AUTH_CREATE_ERROR', message: signUpErr.message, code: signUpErr.code }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (signUpData?.user) {
        authUserId = signUpData.user.id;
      }
    }

    if (!authUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'NO_AUTH_USER_ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: linkErr } = await supabaseAdmin
      .from('employees')
      .update({ auth_user_id: authUserId })
      .eq('id', empData.id);

    if (linkErr) {
      return new Response(
        JSON.stringify({ success: false, error: 'LINK_ERROR', message: linkErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test employee configured',
        credentials: { email: testEmail, password: testPassword }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'UNEXPECTED_ERROR', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
