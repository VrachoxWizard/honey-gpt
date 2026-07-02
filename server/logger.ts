type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, string | number | boolean | undefined>;

function writeLog(level: LogLevel, message: string, context: LogContext = {}): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function createRequestLogger(requestId: string) {
  return {
    info(message: string, context: LogContext = {}) {
      writeLog('info', message, { requestId, ...context });
    },
    warn(message: string, context: LogContext = {}) {
      writeLog('warn', message, { requestId, ...context });
    },
    error(message: string, context: LogContext = {}) {
      writeLog('error', message, { requestId, ...context });
    },
  };
}

export function createRequestId(): string {
  return crypto.randomUUID();
}
