'use client';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, RegisterSchema } from '@indie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useId } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert } from '@/components/form/form-alert';
import { PasswordField } from '@/components/form/password-field';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { PRIVACY_PATH, TERMS_PATH } from '@/features/legal/paths';
import {
  USAGE_METRICS_ANCHOR,
  USAGE_METRICS_LABEL,
  UsageMetricsDescription,
} from '@/features/metrics/consent';
import { onboardingHref } from '@/features/onboarding/paths';
import { showApiError } from '@/lib/form-errors';
import { useRegister } from './hooks';

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const register = useRegister();
  const consentId = useId();
  const form = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { displayName: '', email: '', password: '', usageMetricsConsent: false },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await register.mutateAsync(input);
      router.replace(onboardingHref(redirectTo));
    } catch (error) {
      showApiError(error, form.setError, {
        fields: ['displayName', 'email', 'password'],
        fieldByStatus: { 409: 'email' },
      });
    }
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <FieldGroup>
        <FormAlert message={errors.root?.server?.message} />
        <TextField
          control={form.control}
          name="displayName"
          label="Nome de exibição"
          autoComplete="nickname"
        />
        <TextField
          control={form.control}
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
        />
        <PasswordField
          control={form.control}
          name="password"
          label="Senha"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          description={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        />
        <div className="flex items-start gap-3">
          <input
            id={consentId}
            type="checkbox"
            aria-describedby={`${consentId}-descricao`}
            className="mt-1 size-4"
            {...form.register('usageMetricsConsent')}
          />
          <div className="space-y-1">
            <label htmlFor={consentId} className="text-sm font-medium">
              {USAGE_METRICS_LABEL}
            </label>
            <p id={`${consentId}-descricao`} className="space-y-1 text-sm text-muted-foreground">
              <UsageMetricsDescription
                policyLink={
                  <NewTabLink href={`${PRIVACY_PATH}#${USAGE_METRICS_ANCHOR}`}>
                    Política de privacidade
                  </NewTabLink>
                }
              />
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Ao criar a conta, você concorda com os{' '}
          <NewTabLink href={TERMS_PATH}>Termos de uso</NewTabLink>, declara ter 18 anos ou mais e
          confirma que leu a <NewTabLink href={PRIVACY_PATH}>Política de privacidade</NewTabLink>.
        </p>
      </FieldGroup>
    </form>
  );
}

// Em outra aba, para quem já preencheu o formulário não perder o que digitou.
function NewTabLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" rel="noopener" className="underline">
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </Link>
  );
}
