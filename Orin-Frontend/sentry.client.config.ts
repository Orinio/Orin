// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use sourcesMapStore for automatic source map upload
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set this to true to disable Sentry in development
  enabled: process.env.NODE_ENV === 'production',

  // Replay sessions for error debugging
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // If you wish to use Spotlightjs
  // spotlight: process.env.NODE_ENV === 'development',
});
