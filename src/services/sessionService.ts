import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'admin@piongplus.com';

interface SessionData {
  userId: string;
  email: string;
  sessionToken: string;
  browserInfo?: string;
  ipAddress?: string;
}

export const sessionService = {
  async checkExistingSession(email: string): Promise<boolean> {
    if (email === ADMIN_EMAIL) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing session:', error);
      return false;
    }

    return !!data;
  },

  async invalidateUserSessions(email: string): Promise<void> {
    if (email === ADMIN_EMAIL) {
      return;
    }

    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('email', email)
      .eq('is_active', true);

    if (error) {
      console.error('Error invalidating sessions:', error);
      throw error;
    }
  },

  async createSession(sessionData: SessionData): Promise<void> {
    const browserInfo = sessionData.browserInfo || navigator.userAgent;

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: sessionData.userId,
        email: sessionData.email,
        session_token: sessionData.sessionToken,
        browser_info: browserInfo,
        ip_address: sessionData.ipAddress,
        is_active: true,
      });

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async updateSessionActivity(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating session activity:', error);
    }
  },

  async updateSessionToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        session_token: newToken,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('session_token', oldToken)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating session token:', error);
    }
  },

  async ensureSessionValid(userId: string, email: string, sessionToken: string): Promise<boolean> {
    if (this.isAdminEmail(email)) {
      return true;
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      const { data: userSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (userSession) {
        await supabase
          .from('user_sessions')
          .update({ session_token: sessionToken, last_activity: new Date().toISOString() })
          .eq('id', userSession.id);
        return true;
      }

      await this.createSession({ userId, email, sessionToken });
      return true;
    }

    return true;
  },

  async invalidateSession(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Error invalidating session:', error);
    }
  },

  async getActiveSessions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }

    return data || [];
  },

  isAdminEmail(email: string): boolean {
    return email === ADMIN_EMAIL;
  },
};
