import { UserSchema } from '@indie/contracts';
import { apiFetch } from '@/lib/api-client';

// Desligar apaga, na API, os eventos de uso ligados à conta.
export const saveUsageMetricsConsent = (usageMetricsConsent: boolean) =>
  apiFetch('/me', { method: 'PATCH', body: { usageMetricsConsent }, schema: UserSchema });
