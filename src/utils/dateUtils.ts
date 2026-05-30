const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

export function formatDateTimeBRT(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    return date.toLocaleString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatDateBRT(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    return date.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatTimeBRT(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    return date.toLocaleTimeString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

export function getCurrentDateTimeBRT(): Date {
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE }));
  return brasiliaTime;
}
