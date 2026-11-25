import { ApiErrorSchema } from '@indie/contracts';
import type { z } from 'zod';
import { apiUrl } from '@/config/api';

export const UNEXPECTED_ERROR_MESSAGE =
  'Não foi possível falar com o servidor; tente de novo em instantes.';

const FIELD_MESSAGE = /^(\w+): (.+)$/;

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
    readonly requestId?: string,
  ) {
    super(messages.join(' '));
    this.name = 'ApiRequestError';
  }

  // Erros de validação da API chegam como "campo: mensagem", um por campo.
  fieldMessages(): { field: string; message: string }[] {
    return this.messages.flatMap((text) => {
      const match = FIELD_MESSAGE.exec(text);
      return match ? [{ field: match[1]!, message: match[2]! }] : [];
    });
  }
}

export const isUnauthorized = (error: unknown) =>
  error instanceof ApiRequestError && error.status === 401;

export const isNotFound = (error: unknown) =>
  error instanceof ApiRequestError && error.status === 404;

export function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : UNEXPECTED_ERROR_MESSAGE;
}

// Dado público lido no servidor e guardado no cache de dados do Next (B-102): só respostas 200
// entram, e uma revalidação que falha mantém o dado anterior.
export type PublicCache = { revalidate: number; tags: string[] };

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  cache?: PublicCache;
};

export function apiFetch(path: string, options?: RequestOptions): Promise<void>;
export function apiFetch<T>(
  path: string,
  options: RequestOptions & { schema: z.ZodType<T> },
): Promise<T>;
export async function apiFetch<T>(
  path: string,
  { schema, ...options }: RequestOptions & { schema?: z.ZodType<T> } = {},
): Promise<T | void> {
  const parse = async (response: Response) => {
    if (!response.ok) throw await toError(response);
    return schema?.safeParse(await readJson(response));
  };
  const response = await send(path, options);
  const parsed = await parse(response);
  if (!parsed || parsed.success) return parsed?.data;
  // O dado guardado pode ser de antes de um deploy que mudou o contrato: busca de novo, sem cache.
  if (options.cache) {
    const fresh = await parse(await send(path, { ...options, cache: 'no-store' }));
    if (fresh?.success) return fresh.data;
  }
  throw new ApiRequestError(response.status, [UNEXPECTED_ERROR_MESSAGE]);
}

async function send(
  path: string,
  {
    method = 'GET',
    body,
    signal,
    cache,
  }: Omit<RequestOptions, 'cache'> & {
    cache?: PublicCache | 'no-store';
  },
) {
  const init: RequestInit = { method, credentials: 'same-origin' };
  if (signal) init.signal = signal;
  if (cache === 'no-store') init.cache = 'no-store';
  else if (cache) init.next = { revalidate: cache.revalidate, tags: cache.tags };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  try {
    return await fetch(`${apiBase()}${path}`, init);
  } catch {
    throw new ApiRequestError(0, [UNEXPECTED_ERROR_MESSAGE]);
  }
}

// No navegador, a mesma origem (o rewrite repassa); no servidor, a API direto.
function apiBase() {
  return typeof window === 'undefined' ? `${apiUrl}/api` : '/api';
}

async function toError(response: Response) {
  const parsed = ApiErrorSchema.safeParse(await readJson(response));
  if (!parsed.success) return new ApiRequestError(response.status, [UNEXPECTED_ERROR_MESSAGE]);
  const { message, requestId } = parsed.data;
  return new ApiRequestError(response.status, [message].flat(), requestId);
}

function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => undefined);
}
