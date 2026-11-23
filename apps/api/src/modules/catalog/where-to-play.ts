import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type GameStore, STORES } from '@indie/contracts';
import { z } from 'zod';
import type { Store } from '../../generated/prisma/client';

export const platformsConfigSchema = z.object({
  namesRationale: z.string().min(1),
  names: z.array(
    z.object({ igdbId: z.number().int(), igdbName: z.string(), name: z.string().trim().min(1) }),
  ),
});

export const storesConfigSchema = z.object({
  stores: z.object(
    Object.fromEntries(
      STORES.map((store) => [store, z.object({ name: z.string().min(1), button: z.boolean() })]),
    ) as Record<Store, z.ZodObject<{ name: z.ZodString; button: z.ZodBoolean }>>,
  ),
  buttonRationale: z.string().min(1),
  namesRationale: z.string().min(1),
});

export type PlatformsConfig = z.infer<typeof platformsConfigSchema>;
export type StoresConfig = z.infer<typeof storesConfigSchema>;

export const PLATFORMS_FILE = resolve(process.cwd(), 'config/platforms.json');
export const STORES_FILE = resolve(process.cwd(), 'config/stores.json');

export interface PlatformRow {
  igdbId: number;
  slug: string;
  name: string;
  abbreviation: string | null;
}

export interface StoreLinkRow {
  store: Store;
  url: string;
}

const alphabetical = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'pt-BR', { numeric: true, sensitivity: 'base' });

// O "Onde jogar" da ficha (F-34): plataformas com o nome curto e só as lojas com botão, as duas
// listas em ordem alfabética, sem destaque para nenhuma (neutralidade).
export class WhereToPlay {
  private readonly platformNames: ReadonlyMap<number, string>;

  constructor(
    platforms: PlatformsConfig,
    private readonly stores: StoresConfig,
  ) {
    this.platformNames = new Map(platforms.names.map(({ igdbId, name }) => [igdbId, name]));
  }

  static fromFiles(platformsFile = PLATFORMS_FILE, storesFile = STORES_FILE) {
    const read = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as unknown;
    return new WhereToPlay(
      platformsConfigSchema.parse(read(platformsFile)),
      storesConfigSchema.parse(read(storesFile)),
    );
  }

  // Fora do arquivo, vale a abreviação da IGDB e, sem ela, o nome.
  platformsOf(rows: readonly PlatformRow[]): { slug: string; name: string }[] {
    return rows
      .map(({ igdbId, slug, name, abbreviation }) => ({
        slug,
        name: this.platformNames.get(igdbId) ?? abbreviation ?? name,
      }))
      .sort(alphabetical);
  }

  storesOf(links: readonly StoreLinkRow[]): GameStore[] {
    return links
      .filter(({ store }) => this.stores.stores[store].button)
      .map(({ store, url }) => ({ store, name: this.stores.stores[store].name, url }))
      .sort(alphabetical);
  }
}
