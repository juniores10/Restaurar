import { supabase } from '../lib/supabase';

interface FetchExternalAPIParams {
  apiUrl: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export async function fetchExternalAPI(params: FetchExternalAPIParams) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-external-api`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch from API');
    }

    return result;
  } catch (error) {
    throw error;
  }
}
