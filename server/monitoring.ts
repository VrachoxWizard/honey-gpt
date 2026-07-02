import { getEnv } from './env.js';

let sentryInitialized = false;

export async function initMonitoring(): Promise<void> {
  const { sentryDsn, isProduction } = getEnv();
  if (!sentryDsn || sentryInitialized) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: sentryDsn,
      environment: isProduction ? 'production' : 'development',
      tracesSampleRate: 0.1,
    });
    sentryInitialized = true;
  } catch {
    console.warn('[Hanicar] Sentry nije dostupan — preskačem inicijalizaciju.');
  }
}

export async function captureException(
  error: unknown,
  context?: Record<string, string>
): Promise<void> {
  const { sentryDsn } = getEnv();
  if (!sentryDsn || !sentryInitialized) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.withScope((scope) => {
      if (context) {
        for (const [key, value] of Object.entries(context)) {
          scope.setTag(key, value);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // Monitoring ne smije srušiti zahtjev.
  }
}
