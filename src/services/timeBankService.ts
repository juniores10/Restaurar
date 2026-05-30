import { supabase } from '../lib/supabase';
import type { TimeBank, Employee } from '../types/database';

export interface TimeBankWithEmployee extends TimeBank {
  employee?: Employee;
}

export const timeBankService = {
  async getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<TimeBank[]> {
    let query = supabase
      .from('time_bank')
      .select('*')
      .eq('employee_id', employeeId)
      .order('work_date', { ascending: false });

    if (startDate) {
      query = query.gte('work_date', startDate);
    }

    if (endDate) {
      query = query.lte('work_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getByMonth(year: number, month: number): Promise<TimeBankWithEmployee[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('time_bank')
      .select(`
        *,
        employee:employees(id, name, registration_number)
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(timeBank: Partial<TimeBank>): Promise<TimeBank> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('time_bank')
      .insert({
        ...timeBank,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, timeBank: Partial<TimeBank>): Promise<TimeBank> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('time_bank')
      .update({
        ...timeBank,
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
      .from('time_bank')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  calculateWorkedHours(timeBank: TimeBank): number {
    let totalMinutes = 0;

    const timeToMinutes = (time: string | null): number => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    for (let i = 1; i <= 6; i++) {
      const entry = timeBank[`entry_time_${i}` as keyof TimeBank] as string | null;
      const exit = timeBank[`exit_time_${i}` as keyof TimeBank] as string | null;

      if (entry && exit) {
        totalMinutes += timeToMinutes(exit) - timeToMinutes(entry);
      }
    }

    return Math.floor(totalMinutes / 60);
  }
};
