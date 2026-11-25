import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ProductEventRow = Prisma.ProductEventCreateManyInput;

@Injectable()
export class ProductEventsRepository {
  // Injeção explícita, como no SessionsRepository: a limpeza roda também na ingestão com tsx.
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async gameIdsBySlug(slugs: readonly string[]) {
    const games = await this.prisma.game.findMany({
      where: { slug: { in: [...new Set(slugs)] } },
      select: { id: true, slug: true },
    });
    return new Map(games.map(({ slug, id }) => [slug, id]));
  }

  async createMany(rows: ProductEventRow[]) {
    if (rows.length === 0) return 0;
    const { count } = await this.prisma.productEvent.createMany({ data: rows });
    return count;
  }

  async deleteOlderThan(cutoff: Date) {
    const { count } = await this.prisma.productEvent.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    });
    return count;
  }
}
