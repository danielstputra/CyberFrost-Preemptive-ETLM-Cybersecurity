/**
 * Pino Structured Logger
 * =======================
 * Centralized logger factory for all backend services.
 * - JSON output in production (parsable by ELK/Datadog)
 * - Pretty-print in development
 * - Auto-redacts secrets (Authorization, passwords, tokens)
 */

import pino from 'pino';

type LoggerOptions = {
  serviceName: string;
  level?: string;
};

export function createLogger(opts: LoggerOptions) {
  const { serviceName, level = process.env.LOG_LEVEL || 'info' } = opts;

  return pino({
    name: serviceName,
    level,
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    formatters: {
      level: (label) => ({ level: label }),
    },
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordHash',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'totpSecret',
        'jwt',
      ],
      censor: '[REDACTED]',
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;
