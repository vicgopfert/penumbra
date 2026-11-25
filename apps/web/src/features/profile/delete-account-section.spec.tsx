import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_QUERY_KEY } from '@/features/auth/hooks';
import { apiError, sampleUser, stubFetch } from '@/test/fetch';
import { renderWithQuery } from '@/test/render';
import { DeleteAccountSection } from './delete-account-section';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => router.replace.mockReset());

async function confirmWith(password: string) {
  const user = userEvent.setup();
  if (password) await user.type(screen.getByLabelText(/^Senha atual/), password);
  await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }));
}

describe('DeleteAccountSection', () => {
  it('diz o que é apagado, o que fica por um tempo e que não dá para desfazer', () => {
    renderWithQuery(<DeleteAccountSection />);

    const section = screen.getByRole('region', { name: 'Excluir conta' });
    expect(section).toHaveTextContent('A exclusão é imediata e não dá para desfazer.');
    expect(section).toHaveTextContent('por até 6 horas');
    expect(section).toHaveTextContent('por até 30 dias');
    expect(section).toHaveTextContent('essas mensagens, por até 1 ano');
    expect(screen.getByLabelText(/^Senha atual/)).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  it('exclui com a senha, leva à página da conta excluída e tira a conta do cache', async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }));
    const { queryClient } = renderWithQuery(<DeleteAccountSection />);
    queryClient.setQueryData(SESSION_QUERY_KEY, sampleUser);

    await confirmWith('senha-forte');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/conta-excluida'));
    const [path, init] = fetchMock.mock.calls[0]!;
    expect([path, init?.method, init?.body]).toEqual([
      '/api/me',
      'DELETE',
      JSON.stringify({ password: 'senha-forte' }),
    ]);
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it('senha errada aparece no campo, sem sair da página', async () => {
    stubFetch(() => apiError(400, 'password: Senha incorreta.'));
    renderWithQuery(<DeleteAccountSection />);

    await confirmWith('senha-errada');

    await waitFor(() =>
      expect(screen.getByLabelText(/^Senha atual/)).toHaveAccessibleDescription(
        'Para confirmar que é você. Senha incorreta.',
      ),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sem senha, avisa sem chamar a API', async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }));
    renderWithQuery(<DeleteAccountSection />);

    await confirmWith('');

    expect(await screen.findByText('Informe a sua senha.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com a sessão vencida, tira a conta do cache', async () => {
    stubFetch(() => apiError(401, 'Sessão ausente ou expirada'));
    const { queryClient } = renderWithQuery(<DeleteAccountSection />);
    queryClient.setQueryData(SESSION_QUERY_KEY, sampleUser);

    await confirmWith('senha-forte');

    await waitFor(() => expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull());
    expect(router.replace).not.toHaveBeenCalled();
  });
});
