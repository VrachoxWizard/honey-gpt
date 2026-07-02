export function mapHttpStatusToMessage(status: number, fallback?: string): string {
  switch (status) {
    case 400:
      return fallback || 'Neispravan zahtjev. Provjeri poruku i pokušaj ponovno.';
    case 413:
      return 'Zahtjev je prevelik. Skrati poruku ili ukloni sliku.';
    case 429:
      return 'Previše molitvi u kratkom vremenu. Pričekaj trenutak prije novog pitanja.';
    case 503:
      return 'Haničar je privremeno nedostupan. Pokušaj za minutu.';
    case 504:
      return 'Haničar je predugo molio. Pokušaj s kraćim pitanjem.';
    default:
      if (status >= 500) {
        return fallback || 'Server nije uspio dobiti odgovor. Haničar trese lampu.';
      }
      return fallback || 'Nešto se zapetljalo. Pokušaj ponovno.';
  }
}

export function formatChatError(message: string, requestId?: string): string {
  if (!requestId) return message;
  return `${message} (ID: ${requestId})`;
}
