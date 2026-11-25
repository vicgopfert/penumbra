'use client';

import { DeleteAccountSchema, PASSWORD_MAX_LENGTH } from '@indie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert } from '@/components/form/form-alert';
import { PasswordField } from '@/components/form/password-field';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { clearAccount, useDeleteAccount } from '@/features/auth/hooks';
import { PRIVACY_PATH } from '@/features/legal/paths';
import { isUnauthorized } from '@/lib/api-client';
import { showApiError } from '@/lib/form-errors';
import { ACCOUNT_DELETED_PATH } from './paths';

// Imediata e definitiva, confirmada pela senha atual (B-52).
export function DeleteAccountSection() {
  const id = useId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deletion = useDeleteAccount();
  const form = useForm({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: { password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await deletion.mutateAsync(input);
      router.replace(ACCOUNT_DELETED_PATH);
      clearAccount(queryClient);
    } catch (error) {
      if (isUnauthorized(error)) {
        clearAccount(queryClient);
        return;
      }
      showApiError(error, form.setError, { fields: ['password'] });
    }
  });

  return (
    <section aria-labelledby={`${id}-titulo`} className="space-y-3">
      <h2 id={`${id}-titulo`} className="text-xl font-semibold">
        Excluir conta
      </h2>
      <p className="text-sm">
        A exclusão é imediata e não dá para desfazer. Apagamos a sua conta (e-mail, nome e senha), a
        sua biblioteca (notas e listas), os seus gostos, as sessões abertas, os links enviados por
        e-mail e as métricas de uso ligadas à conta.
      </p>
      <p className="text-sm text-muted-foreground">
        Fora do banco, alguns registros ainda ficam por um tempo: a cópia de segurança do banco, por
        até 6 horas; os e-mails da conta no provedor de envio, por até 30 dias; os registros
        técnicos dos servidores, por até 7 dias; e, se você escreveu para o e-mail de contato, essas
        mensagens, por até 1 ano. Se o seu e-mail estiver confirmado, você recebe um último e-mail
        avisando da exclusão. Veja a{' '}
        <Link href={PRIVACY_PATH} className="underline">
          Política de privacidade
        </Link>
        .
      </p>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="max-w-sm">
        <FieldGroup>
          <FormAlert message={errors.root?.server?.message} />
          <PasswordField
            control={form.control}
            name="password"
            label="Senha atual"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            description="Para confirmar que é você."
          />
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? 'Excluindo…' : 'Excluir minha conta'}
          </Button>
        </FieldGroup>
      </form>
    </section>
  );
}
