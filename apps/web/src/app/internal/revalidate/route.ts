import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { PUBLIC_CACHE_TAGS } from '@/config/public-cache';

const SECRET_MIN_LENGTH = 32;

const digest = (value: string) => createHash('sha256').update(value).digest();

// Chamada pelo workflow da ingestão no fim de cada execução (B-102), com
// "Authorization: Bearer <REVALIDATE_SECRET>". Fora de /api, que a Vercel repassa ao Render. Com
// 'max', o próximo visitante ainda recebe o dado anterior enquanto o novo é buscado: ninguém espera
// a API por causa da revalidação.
export function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  if (secret.length < SECRET_MIN_LENGTH) {
    return Response.json({ message: 'Revalidação não configurada' }, { status: 503 });
  }
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  // Os resumos têm o mesmo tamanho, e a comparação em tempo constante não revela o que bate.
  if (!token || !timingSafeEqual(digest(token), digest(secret))) {
    return Response.json({ message: 'Segredo inválido' }, { status: 401 });
  }
  for (const tag of PUBLIC_CACHE_TAGS) revalidateTag(tag, 'max');
  return Response.json({ revalidated: PUBLIC_CACHE_TAGS });
}
