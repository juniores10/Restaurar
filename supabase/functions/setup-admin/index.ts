import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const email = 'admin@piongplus.com';
    const password = 'PionGPlus2024!';
    const fullName = 'Administrador do Sistema';

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Admin user already exists',
            credentials: { email, password }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      throw authError;
    }

    if (authData.user) {
      const { error: employeeError } = await supabaseAdmin
        .from('employees')
        .upsert({
          auth_user_id: authData.user.id,
          email,
          full_name: fullName,
          user_type_id: 1,
          is_active: true,
        }, {
          onConflict: 'auth_user_id'
        });

      if (employeeError) throw employeeError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        credentials: { email, password }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
