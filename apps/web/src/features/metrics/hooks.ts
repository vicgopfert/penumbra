import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearAccount, SESSION_QUERY_KEY } from '@/features/auth/hooks';
import { isUnauthorized } from '@/lib/api-client';
import { saveUsageMetricsConsent } from './api';

// A sessão gravada no cache já muda o que o navegador envia (MetricsProvider).
export function useUsageMetricsConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveUsageMetricsConsent,
    onSuccess: (user) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
    onError: (error) => {
      if (isUnauthorized(error)) clearAccount(queryClient);
    },
  });
}
