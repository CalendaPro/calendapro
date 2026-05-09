/**
 * Structured logger for CalendaPro
 *
 * Behavior:
 *   - In development (NODE_ENV !== 'production'): forwards to the matching
 *     console.* method, preserving log levels and arguments.
 *   - In production: silences `debug`, `info`, and `warn` (no-op) to keep
 *     server logs clean. `error` is always forwarded so we keep production
 *     observability through Vercel logs / external sinks.
 *
 * Use this exclusively from app/, lib/, and components/. Do not call
 * console.* directly anywhere in the codebase.
 */

type LogFn = (...args: unknown[]) => void

const isDev = process.env.NODE_ENV !== 'production'

const noop: LogFn = () => {}

const wrap = (fn: LogFn): LogFn => (isDev ? fn : noop)

export interface Logger {
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
}

export const logger: Logger = {
  debug: wrap((...args) => console.debug(...args)),
  info: wrap((...args) => console.info(...args)),
  warn: wrap((...args) => console.warn(...args)),
  // Always forwarded so production errors stay observable.
  error: (...args) => console.error(...args),
}

export default logger
