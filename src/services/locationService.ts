import { supabase } from '../lib/supabase';
import type { Location } from '../types/database';

export const LocationType = {
  BRANCH: 1,
  WORKPLACE: 2
} as const;

export const locationService = {
  async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 0)
      .order('legal_name');

    if (error) throw error;
    return data || [];
  },

  async getAllIncludingInactive(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('legal_name');

    if (error) throw error;
    return data || [];
  },

  async getByType(type: number): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', type)
      .eq('status', 0)
      .order('trade_name');

    if (error) throw error;
    return data || [];
  },

  async getByTypeIncludingInactive(type: number): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', type)
      .order('trade_name');

    if (error) throw error;
    return data || [];
  },

  async getWorkplaces(): Promise<Location[]> {
    return this.getByType(LocationType.WORKPLACE);
  },

  async getBranches(): Promise<Location[]> {
    return this.getByType(LocationType.BRANCH);
  },

  async getById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(location: Partial<Location>): Promise<Location> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('locations')
      .insert({
        ...location,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, location: Partial<Location>): Promise<Location> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('locations')
      .update({
        ...location,
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
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
