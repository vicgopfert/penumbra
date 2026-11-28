import { siteConfig } from '@/config/site';

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();
