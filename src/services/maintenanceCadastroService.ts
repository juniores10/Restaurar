import { supabase } from '../lib/supabase';

export interface MaintenanceEquipment {
  id: string;
  name: string;
  tag_code: string;
  location_id: string | null;
  sector: string;
  manufacturer: string;
  serial_number: string;
  model: string;
  installation_date: string | null;
  hourly_cost: number;
  manual_url: string;
  available_from: string | null;
  available_to: string | null;
  inactivated_at: string | null;
  inactivation_reason: string;
  status: number;
  created_at: string;
  updated_at: string;
  maintenance_locations?: { name: string } | null;
}

export interface MaintenanceOccurrence {
  id: string;
  name: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceMaterial {
  id: string;
  name: string;
  unit: string;
  equipment_id: string | null;
  warehouse_code: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
  maintenance_equipment?: { id: string; name: string; tag_code: string } | null;
  equipment_ids?: string[];
  linked_equipment?: { id: string; name: string; tag_code: string }[];
}

export interface MaintenanceTechnician {
  id: string;
  name: string;
  specialty_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  maintenance_specialties?: { name: string } | null;
}

export interface MaintenanceSpecialty {
  id: string;
  name: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLocation {
  id: string;
  name: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export const maintenanceCadastroService = {
  async getEquipment() {
    const { data, error } = await supabase
      .from('maintenance_equipment')
      .select('*, maintenance_locations(name)')
      .order('name');
    if (error) throw error;
    return data as MaintenanceEquipment[];
  },

  async createEquipment(payload: {
    name: string;
    tag_code: string;
    location_id: string | null;
    sector?: string;
    manufacturer?: string;
    serial_number?: string;
    model?: string;
    installation_date?: string | null;
    manual_url?: string;
  }) {
    const { data, error } = await supabase.from('maintenance_equipment').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateEquipment(id: string, payload: Partial<{
    name: string;
    tag_code: string;
    location_id: string | null;
    sector: string;
    manufacturer: string;
    serial_number: string;
    model: string;
    installation_date: string | null;
    manual_url: string;
    inactivated_at: string | null;
    inactivation_reason: string;
    status: number;
  }>) {
    const { data, error } = await supabase.from('maintenance_equipment').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase.from('maintenance_equipment').delete().eq('id', id);
    if (error) throw error;
  },

  async getOccurrences() {
    const { data, error } = await supabase.from('maintenance_occurrences').select('*').order('name');
    if (error) throw error;
    return data as MaintenanceOccurrence[];
  },

  async createOccurrence(payload: { name: string; description: string }) {
    const { data, error } = await supabase.from('maintenance_occurrences').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateOccurrence(id: string, payload: Partial<{ name: string; description: string; status: number }>) {
    const { data, error } = await supabase.from('maintenance_occurrences').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteOccurrence(id: string) {
    const { error } = await supabase.from('maintenance_occurrences').delete().eq('id', id);
    if (error) throw error;
  },

  async getMaterials() {
    const { data, error } = await supabase
      .from('maintenance_materials')
      .select('*, maintenance_equipment(id, name, tag_code), maintenance_material_equipment(equipment_id, maintenance_equipment(id, name, tag_code))')
      .order('name');
    if (error) throw error;
    return (data || []).map((m: any) => ({
      ...m,
      equipment_ids: (m.maintenance_material_equipment || []).map((r: any) => r.equipment_id),
      linked_equipment: (m.maintenance_material_equipment || []).map((r: any) => r.maintenance_equipment).filter(Boolean),
    })) as MaintenanceMaterial[];
  },

  async createMaterial(payload: {
    name: string;
    unit: string;
    equipment_id?: string | null;
    warehouse_code?: string;
    description?: string;
  }, equipmentIds?: string[]) {
    const { data, error } = await supabase.from('maintenance_materials').insert(payload).select().single();
    if (error) throw error;
    if (equipmentIds && equipmentIds.length > 0) {
      const links = equipmentIds.map(eid => ({ material_id: data.id, equipment_id: eid }));
      await supabase.from('maintenance_material_equipment').insert(links);
    }
    return data;
  },

  async updateMaterial(id: string, payload: Partial<{
    name: string;
    unit: string;
    equipment_id: string | null;
    warehouse_code: string;
    description: string;
    status: number;
  }>, equipmentIds?: string[]) {
    const { data, error } = await supabase.from('maintenance_materials').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    if (equipmentIds !== undefined) {
      await supabase.from('maintenance_material_equipment').delete().eq('material_id', id);
      if (equipmentIds.length > 0) {
        const links = equipmentIds.map(eid => ({ material_id: id, equipment_id: eid }));
        await supabase.from('maintenance_material_equipment').insert(links);
      }
    }
    return data;
  },

  async deleteMaterial(id: string) {
    const { error } = await supabase.from('maintenance_materials').delete().eq('id', id);
    if (error) throw error;
  },

  async getTechnicians() {
    const { data, error } = await supabase
      .from('maintenance_technicians')
      .select('*, maintenance_specialties(name)')
      .order('name');
    if (error) throw error;
    return data as MaintenanceTechnician[];
  },

  async createTechnician(payload: { name: string; specialty_id: string | null }) {
    const { data, error } = await supabase.from('maintenance_technicians').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateTechnician(id: string, payload: Partial<{ name: string; specialty_id: string | null; status: number }>) {
    const { data, error } = await supabase.from('maintenance_technicians').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTechnician(id: string) {
    const { error } = await supabase.from('maintenance_technicians').delete().eq('id', id);
    if (error) throw error;
  },

  async getSpecialties() {
    const { data, error } = await supabase.from('maintenance_specialties').select('*').order('name');
    if (error) throw error;
    return data as MaintenanceSpecialty[];
  },

  async createSpecialty(payload: { name: string; description: string }) {
    const { data, error } = await supabase.from('maintenance_specialties').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateSpecialty(id: string, payload: Partial<{ name: string; description: string; status: number }>) {
    const { data, error } = await supabase.from('maintenance_specialties').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSpecialty(id: string) {
    const { error } = await supabase.from('maintenance_specialties').delete().eq('id', id);
    if (error) throw error;
  },

  async getLocations() {
    const { data, error } = await supabase.from('maintenance_locations').select('*').order('name');
    if (error) throw error;
    return data as MaintenanceLocation[];
  },

  async createLocation(payload: { name: string; description: string }) {
    const { data, error } = await supabase.from('maintenance_locations').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateLocation(id: string, payload: Partial<{ name: string; description: string; status: number }>) {
    const { data, error } = await supabase.from('maintenance_locations').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteLocation(id: string) {
    const { error } = await supabase.from('maintenance_locations').delete().eq('id', id);
    if (error) throw error;
  },
};
