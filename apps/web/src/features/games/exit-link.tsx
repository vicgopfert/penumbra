'use client';

import type { ProductEvent } from '@indie/contracts';
import type { ComponentProps } from 'react';
import { track } from '@/features/metrics/tracker';
import { externalLink } from './external-link';

type ExitEvent = Omit<Extract<ProductEvent, { kind: 'EXIT_CLICK' }>, 'kind'>;

// Link para fora da plataforma que conta o clique de saída (o antigo B-49) sem segurar a
// navegação: o evento sai na hora, com keepalive.
export function ExitLink({ event, ...props }: ComponentProps<'a'> & { event: ExitEvent }) {
  return (
    <a
      {...props}
      {...externalLink}
      onClick={() => track({ kind: 'EXIT_CLICK', ...event }, { now: true })}
    />
  );
}
