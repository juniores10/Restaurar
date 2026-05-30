import { supabase } from '../lib/supabase';
import type { Employee, DataType, Location, UserType } from '../types/database';

export interface EmployeeWithRelations extends Employee {
  location?: Location;
  workplace?: Location;
  department?: DataType;
  position?: DataType;
  role?: DataType;
  user_type?: UserType;
}

interface EmployeeCreateData extends Partial<Employee> {
  password?: string;
}

async function manageEmployeeAuth(action: 'create' | 'update' | 'delete', employeeId: string, email: string, password?: string, name?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/manage-employee-auth`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, employee_id: employeeId, email, password, name }),
  });

  const result = await response.json();
  if (!result.success) {
    console.error('Auth management error:', result.error);
  }
  return result;
}

export const employeeService = {
  async getAll(): Promise<EmployeeWithRelations[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        location:locations!employees_location_id_fkey(id, legal_name, trade_name),
        workplace:locations!employees_workplace_id_fkey(id, legal_name, trade_name),
        department:data_types!employees_department_id_fkey(id, description),
        position:data_types!employees_position_id_fkey(id, description),
        role:data_types!employees_role_id_fkey(id, description),
        user_type:user_types(id, name, description)
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<EmployeeWithRelations | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        location:locations!employees_location_id_fkey(id, legal_name, trade_name),
        workplace:locations!employees_workplace_id_fkey(id, legal_name, trade_name),
        department:data_types!employees_department_id_fkey(id, description),
        position:data_types!employees_position_id_fkey(id, description),
        role:data_types!employees_role_id_fkey(id, description)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(employeeData: EmployeeCreateData): Promise<Employee> {
    const { data: { user } } = await supabase.auth.getUser();

    const { password, ...employee } = employeeData;

    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...employee,
        password: password || 'temp_password',
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          throw new Error('CPF ja cadastrado no sistema');
        }
        throw new Error('Registro duplicado');
      }
      throw new Error(error.message);
    }

    if (password && data.email) {
      await manageEmployeeAuth('create', data.id, data.email, password, data.name);
    }

    return data;
  },

  async update(id: string, employeeData: EmployeeCreateData): Promise<Employee> {
    const { data: { user } } = await supabase.auth.getUser();

    const { password, ...employee } = employeeData;

    const { data, error } = await supabase
      .from('employees')
      .update({
        ...employee,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (password || employee.email) {
      await manageEmployeeAuth('update', id, data.email, password, data.name);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department_id', departmentId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getByLocation(locationId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('location_id', locationId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async searchByName(searchTerm: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getAllEmployees(): Promise<{ id: string; name: string; email: string; department_id: string | null }[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, department_id')
      .in('status', [0, 1, 2, 3])
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async uploadPhoto(employeeId: string, file: File): Promise<string> {
    const { data: employee } = await supabase
      .from('employees')
      .select('photo_url')
      .eq('id', employeeId)
      .maybeSingle();

    if (employee?.photo_url) {
      const oldPath = employee.photo_url.split('/profile-photos/')[1];
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([oldPath]);
      }
    }

    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `employees/${employeeId}-${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('employees')
      .update({ photo_url: publicUrl })
      .eq('id', employeeId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  async deletePhoto(employeeId: string, photoUrl: string): Promise<void> {
    const path = photoUrl.split('/profile-photos/')[1];

    if (path) {
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([path]);

      if (deleteError) throw deleteError;
    }

    const { error: updateError } = await supabase
      .from('employees')
      .update({ photo_url: null })
      .eq('id', employeeId);

    if (updateError) throw updateError;
  }
};
