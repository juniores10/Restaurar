import { supabase } from '../lib/supabase';

export async function uploadFileWithRetry(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Erro ao obter sessão: ' + sessionError.message);
    }

    if (!sessionData.session) {
      throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = sessionData.session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    console.log(`Token expires in ${timeUntilExpiry} seconds`);
    console.log(`Current time: ${now}, Expires at: ${expiresAt}`);

    if (timeUntilExpiry <= 0 || timeUntilExpiry < 300) {
      console.log('Token expired or expiring soon, refreshing...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing token:', refreshError);
        throw new Error('Não foi possível renovar a sessão. Por favor, faça login novamente.');
      }
      if (!refreshData.session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(refreshData.session.access_token);
      if (userError || !user) {
        console.error('User validation error:', userError);
        throw new Error('Não foi possível validar o usuário. Por favor, faça login novamente.');
      }

      console.log('Token refreshed and user validated successfully');
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(sessionData.session.access_token);
      if (userError || !user) {
        console.error('User validation error, token might be invalid:', userError);
        console.log('Attempting to refresh token...');

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        const { data: { user: revalidatedUser }, error: revalidateError } = await supabase.auth.getUser(refreshData.session.access_token);
        if (revalidateError || !revalidatedUser) {
          throw new Error('Não foi possível validar o usuário. Por favor, faça login novamente.');
        }

        console.log('Token refreshed and user validated after error');
      }
    }

    console.log(`Uploading file to bucket: ${bucket}, path: ${path}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        contentType: options?.contentType || file.type,
        upsert: options?.upsert ?? true,
      });

    if (error) {
      console.error('Upload error:', error);

      if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('Invalid')) {
        console.log('JWT error detected, attempting to refresh session...');

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshData.session) {
          console.error('Refresh failed:', refreshError);
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        console.log('Session refreshed, retrying upload...');

        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: options?.cacheControl || '3600',
            contentType: options?.contentType || file.type,
            upsert: options?.upsert ?? true,
          });

        if (retryError) {
          console.error('Retry upload error:', retryError);
          throw retryError;
        }

        console.log('Retry upload successful');
        return { data: retryData, error: null };
      }

      throw error;
    }

    console.log('Upload successful');
    return { data, error: null };
  } catch (error: any) {
    console.error('Upload error (catch block):', error);
    return { data: null, error };
  }
}

export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function downloadFile(bucket: string, path: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      if (error.message.includes('JWT') || error.message.includes('expired')) {
        await supabase.auth.refreshSession();

        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .download(path);

        if (retryError) throw retryError;
        return { data: retryData, error: null };
      }

      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Download error:', error);
    return { data: null, error };
  }
}

export async function deleteFile(bucket: string, paths: string[]) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      if (error.message.includes('JWT') || error.message.includes('expired')) {
        await supabase.auth.refreshSession();

        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .remove(paths);

        if (retryError) throw retryError;
        return { data: retryData, error: null };
      }

      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Delete error:', error);
    return { data: null, error };
  }
}
