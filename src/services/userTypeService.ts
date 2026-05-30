import { supabase } from '../lib/supabase';
import type { UserType } from '../types/database';

export const userTypeService = {
  async getAll(): Promise<UserType[]> {
    const { data, error } = await supabase
      .from('user_types')
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  }
};
