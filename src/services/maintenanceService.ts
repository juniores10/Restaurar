import { supabase } from '../lib/supabase';
import type { MaintenanceOrder, MaintenanceComment } from '../types/maintenance';

export const maintenanceService = {
  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `MNT-${yearMonth}-`;

    const { data } = await supabase
      .from('maintenance_orders')
      .select('order_number')
      .like('order_number', `${prefix}%`)
      .order('order_number', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].order_number.split('-').pop() || '0', 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  async listOrders(): Promise<MaintenanceOrder[]> {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getOrder(id: string): Promise<MaintenanceOrder | null> {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOrder(order: Omit<MaintenanceOrder, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<MaintenanceOrder> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert({ ...order, created_by: user?.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, updates: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async listComments(orderId: string): Promise<MaintenanceComment[]> {
    const { data, error } = await supabase
      .from('maintenance_comments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addComment(orderId: string, comment: string): Promise<MaintenanceComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('maintenance_comments')
      .insert({ order_id: orderId, user_id: user.id, comment })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async notifyManagersAndAdmins(orderId: string): Promise<void> {
    const { data: targets, error } = await supabase
      .from('employees')
      .select('auth_user_id, name, user_types(name)')
      .eq('status', 0)
      .not('auth_user_id', 'is', null);

    if (error || !targets) return;

    const eligible = targets.filter((e: any) => {
      const typeName = e.user_types?.name ?? '';
      return ['administrador', 'gestor', 'lider', 'admin'].some(t =>
        typeName.toLowerCase().includes(t)
      );
    });

    if (eligible.length === 0) return;

    const notifications = eligible.map((e: any) => ({
      order_id: orderId,
      recipient_auth_user_id: e.auth_user_id,
      recipient_name: e.name,
    }));

    await supabase.from('maintenance_request_notifications').insert(notifications);
  },

  async getPendingNotificationsForUser(authUserId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('maintenance_request_notifications')
      .select('*, maintenance_orders(*)')
      .eq('recipient_auth_user_id', authUserId)
      .eq('actioned', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async approveOrder(orderId: string, approverName: string, notificationId: string): Promise<void> {
    await supabase
      .from('maintenance_orders')
      .update({
        approval_status: 'approved',
        approval_action_by: approverName,
        approval_action_at: new Date().toISOString(),
        status: 'Aberto',
      })
      .eq('id', orderId);

    await supabase
      .from('maintenance_request_notifications')
      .update({ actioned: true, action_taken: 'approved' })
      .eq('id', notificationId);
  },

  async rejectOrder(orderId: string, approverName: string, notificationId: string, reason: string): Promise<void> {
    await supabase
      .from('maintenance_orders')
      .update({
        approval_status: 'rejected',
        approval_action_by: approverName,
        approval_action_at: new Date().toISOString(),
        rejection_reason: reason,
        status: 'Cancelado',
      })
      .eq('id', orderId);

    await supabase
      .from('maintenance_request_notifications')
      .update({ actioned: true, action_taken: 'rejected' })
      .eq('id', notificationId);
  },

  async saveServiceOrderData(orderId: string, serviceData: any): Promise<void> {
    const { error } = await supabase
      .from('maintenance_orders')
      .update({ service_order_data: serviceData })
      .eq('id', orderId);

    if (error) throw error;
  },
};
