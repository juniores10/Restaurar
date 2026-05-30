export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function handleSupabaseError(error: SupabaseError): AppError {
  const errorMap: Record<string, string> = {
    '23505': 'Este registro já existe no sistema.',
    '23503': 'Não é possível excluir este registro pois ele está sendo usado.',
    '42501': 'Você não tem permissão para realizar esta ação.',
    'PGRST116': 'Nenhum registro encontrado.',
    '42P01': 'Erro de configuração do sistema. Contate o administrador.',
  };

  const userMessage = error.code ? errorMap[error.code] : undefined;

  return new AppError(
    error.message,
    error.code,
    userMessage || 'Ocorreu um erro ao processar sua solicitação.'
  );
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export function logError(error: unknown, context?: string) {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }
}
