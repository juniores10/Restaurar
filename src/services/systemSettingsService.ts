import { supabase } from '../lib/supabase';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export interface SystemSettings {
  id: string;
  company_logo_url: string | null;
  updated_at: string;
  updated_by: string | null;
}

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle();

  if (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }

  return data;
}

export async function uploadCompanyLogo(file: File, authUserId: string): Promise<string> {
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  const fileExt = file.name.split('.').pop();
  const fileName = `company-logo-${Date.now()}.${fileExt}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading logo:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('company-assets')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('system_settings')
    .update({
      company_logo_url: publicUrl,
      updated_at: new Date().toISOString(),
      updated_by: employee?.id || null
    })
    .eq('id', SETTINGS_ID);

  if (updateError) {
    console.error('Error updating system settings:', updateError);
    throw updateError;
  }

  return publicUrl;
}

export async function deleteOldLogo(logoUrl: string | null): Promise<void> {
  if (!logoUrl) return;

  try {
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split('/company-assets/');
    if (pathParts.length > 1) {
      const filePath = pathParts[1];
      await supabase.storage
        .from('company-assets')
        .remove([filePath]);
    }
  } catch (error) {
    console.error('Error deleting old logo:', error);
  }
}
