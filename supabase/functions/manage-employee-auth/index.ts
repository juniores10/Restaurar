import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestPayload {
  action: 'create' | 'update' | 'delete';
  employee_id: string;
  email: string;
  password?: string;
  name?: string;
}

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

    const payload: RequestPayload = await req.json();
    const { action, employee_id, email, password, name } = payload;

    if (action === 'create') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || '' },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === email);

          if (existingUser) {
            const { error: updateError } = await supabaseAdmin
              .from('employees')
              .update({ auth_user_id: existingUser.id })
              .eq('id', employee_id);

            if (updateError) throw updateError;

            if (password) {
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
            }

            return new Response(
              JSON.stringify({ success: true, message: 'User linked and password updated', auth_user_id: existingUser.id }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        throw authError;
      }

      if (authData.user) {
        const { error: updateError } = await supabaseAdmin
          .from('employees')
          .update({ auth_user_id: authData.user.id })
          .eq('id', employee_id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, message: 'User created successfully', auth_user_id: authData.user.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'update') {
      const { data: employee } = await supabaseAdmin
        .from('employees')
        .select('auth_user_id')
        .eq('id', employee_id)
        .maybeSingle();

      if (employee?.auth_user_id) {
        const updateData: Record<string, unknown> = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (name) updateData.user_metadata = { full_name: name };

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(
            employee.auth_user_id,
            updateData
          );

          if (error) throw error;
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        if (email && password) {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name || '' },
          });

          if (authError) {
            if (authError.message.includes('already registered')) {
              const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
              const existingUser = existingUsers?.users?.find(u => u.email === email);

              if (existingUser) {
                await supabaseAdmin
                  .from('employees')
                  .update({ auth_user_id: existingUser.id })
                  .eq('id', employee_id);

                if (password) {
                  await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
                }

                return new Response(
                  JSON.stringify({ success: true, message: 'User linked', auth_user_id: existingUser.id }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
            throw authError;
          }

          if (authData.user) {
            await supabaseAdmin
              .from('employees')
              .update({ auth_user_id: authData.user.id })
              .eq('id', employee_id);

            return new Response(
              JSON.stringify({ success: true, message: 'User created and linked', auth_user_id: authData.user.id }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'No auth user to update' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'delete') {
      const { data: employee } = await supabaseAdmin
        .from('employees')
        .select('auth_user_id')
        .eq('id', employee_id)
        .maybeSingle();

      if (employee?.auth_user_id) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(employee.auth_user_id);
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
