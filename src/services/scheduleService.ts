import { supabase } from '../lib/supabase';
import type { Schedule, Employee } from '../types/database';

export interface ScheduleWithEmployee extends Schedule {
  employee?: Employee;
}

export const scheduleService = {
  async getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<Schedule[]> {
    let query = supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_datetime', { ascending: false });

    if (startDate) {
      query = query.gte('start_datetime', startDate);
    }

    if (endDate) {
      query = query.lte('end_datetime', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getByMonth(year: number, month: number): Promise<ScheduleWithEmployee[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString();

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees(id, name, registration_number)
      `)
      .gte('start_datetime', startDate)
      .lte('end_datetime', endDate)
      .order('start_datetime', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByLocation(locationId: string, startDate?: string, endDate?: string): Promise<ScheduleWithEmployee[]> {
    let query = supabase
      .from('schedules')
      .select(`
        *,
        employee:employees(id, name, registration_number)
      `)
      .eq('location_id', locationId)
      .order('start_datetime', { ascending: false });

    if (startDate) {
      query = query.gte('start_datetime', startDate);
    }

    if (endDate) {
      query = query.lte('end_datetime', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async create(schedule: Partial<Schedule>): Promise<Schedule> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('schedules')
      .insert({
        ...schedule,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('schedules')
      .update({
        ...schedule,
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
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }
};
