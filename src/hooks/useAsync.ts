import { useState, useCallback } from 'react';

interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    data: null,
    error: null,
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await asyncFn();
      setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ loading: false, data: null, error: err });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, data: null, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
