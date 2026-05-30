import { supabase } from '../lib/supabase';
import type { DataType } from '../types/database';
import { DataTypeKind } from '../types/database';

export const dataTypeService = {
  async getByType(type: number): Promise<DataType[]> {
    const { data, error } = await supabase
      .from('data_types')
      .select('*')
      .eq('type', type)
      .order('description');

    if (error) throw error;
    return data || [];
  },

  async getDepartments(): Promise<DataType[]> {
    const { data, error } = await supabase
      .from('data_types')
      .select('*')
      .eq('type', DataTypeKind.DEPARTMENT)
      .eq('status', 0)
      .order('description');

    if (error) throw error;
    return data || [];
  },

  async getPositions(): Promise<DataType[]> {
    const { data, error } = await supabase
      .from('data_types')
      .select('*')
      .eq('type', DataTypeKind.POSITION)
      .eq('status', 0)
      .order('description');

    if (error) throw error;
    return data || [];
  },

  async getRoles(departmentId?: string): Promise<DataType[]> {
    let query = supabase
      .from('data_types')
      .select('*')
      .eq('type', DataTypeKind.ROLE)
      .eq('status', 0);

    if (departmentId) {
      query = query.eq('related_code', departmentId);
    }

    const { data, error } = await query.order('description');

    if (error) throw error;
    return data || [];
  },

  async create(dataType: Partial<DataType>): Promise<DataType> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('data_types')
      .insert({
        ...dataType,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, dataType: Partial<DataType>): Promise<DataType> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('data_types')
      .update({
        ...dataType,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('data_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
