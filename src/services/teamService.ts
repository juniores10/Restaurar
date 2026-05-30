import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const teamService = {
  async getAll(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(team: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: team.name,
        description: team.description || null,
        is_active: team.is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, team: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({
        ...team,
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
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
