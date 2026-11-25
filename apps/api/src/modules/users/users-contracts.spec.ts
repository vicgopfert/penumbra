import { UpdateMeSchema } from '@indie/contracts';
import { DiscoveryMode } from '../../generated/prisma/client';

describe('UpdateMeSchema', () => {
  it('aceita os três modos do banco', () => {
    for (const discoveryMode of Object.values(DiscoveryMode)) {
      expect(UpdateMeSchema.parse({ discoveryMode })).toEqual({ discoveryMode });
    }
  });

  it('recusa modo em minúsculas ou desconhecido', () => {
    for (const body of [{ discoveryMode: 'balanced' }, { discoveryMode: 'RANDOM' }]) {
      expect(UpdateMeSchema.safeParse(body).error?.issues[0]?.message).toBe(
        'Modo deve ser POPULAR, BALANCED ou DISCOVERY.',
      );
    }
  });

  it('aceita o consentimento das métricas de uso, sozinho ou com o modo', () => {
    expect(UpdateMeSchema.parse({ usageMetricsConsent: false })).toEqual({
      usageMetricsConsent: false,
    });
    expect(UpdateMeSchema.parse({ discoveryMode: 'POPULAR', usageMetricsConsent: true })).toEqual({
      discoveryMode: 'POPULAR',
      usageMetricsConsent: true,
    });
  });

  it('recusa consentimento que não é booleano', () => {
    expect(UpdateMeSchema.safeParse({ usageMetricsConsent: 'sim' }).error?.issues[0]?.message).toBe(
      'Informe true ou false.',
    );
  });

  it('recusa o corpo sem nenhum dos campos', () => {
    expect(UpdateMeSchema.safeParse({}).error?.issues[0]?.message).toBe(
      'Informe o modo de descoberta ou o consentimento das métricas de uso.',
    );
  });
});
