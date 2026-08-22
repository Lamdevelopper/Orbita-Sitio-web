/**
 * Tipos mínimos del runtime Cloudflare Workers usados por este proyecto.
 *
 * Se declaran aquí en vez de referenciar @cloudflare/workers-types porque ese
 * paquete pisa los globales del DOM (Response.json pasa de any a unknown y
 * rompe la inferencia de toda la app). Los shapes cubren sólo los métodos que
 * el código invoca directo; drizzle-orm/d1 acepta cualquier D1Database global
 * presente vía su tipo IfNotImported.
 *
 * `Cloudflare.Env` alimenta `env` importado desde "cloudflare:workers".
 * Las bindings son opcionales a propósito: en local pueden estar ausentes y
 * el código de producción falla cerrado cuando faltan (ver db/index.ts).
 */
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    MEDIA?: R2Bucket;
  }
}

declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

interface Fetcher {
  fetch(request: Request | string | URL): Promise<Response>;
}

interface R2HttpMetadata {
  contentType?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(columnName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

interface R2ObjectBody {
  key: string;
  body: ReadableStream;
  httpMetadata?: R2HttpMetadata;
  size?: number;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: R2HttpMetadata },
  ): Promise<R2ObjectBody>;
}
