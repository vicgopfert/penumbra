import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError, sampleUser, stubFetch } from '@/test/fetch';
import { renderWithQuery } from '@/test/render';
import { RegisterForm } from './register-form';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => router.replace.mockReset());

async function submit(password = 'senha-forte') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Nome de exibição'), 'Jogadora');
  await user.type(screen.getByLabelText('E-mail'), 'jogadora@example.com');
  await user.type(screen.getByLabelText(/^Senha/), password);
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
}

describe('RegisterForm', () => {
  it('leva aos termos e à política em outra aba, com a declaração de idade', () => {
    renderWithQuery(<RegisterForm redirectTo="/" />);

    expect(screen.getByText(/declara ter 18 anos ou mais/)).toBeInTheDocument();
    const terms = screen.getByRole('link', { name: /^Termos de uso ?\(abre em nova aba\)$/ });
    const policies = screen.getAllByRole('link', {
      name: /^Política de privacidade ?\(abre em nova aba\)$/,
    });
    expect(terms).toHaveAttribute('href', '/termos');
    expect(policies.map((link) => link.getAttribute('href'))).toEqual([
      '/privacidade#metricas-de-uso',
      '/privacidade',
    ]);
    for (const link of [terms, ...policies]) expect(link).toHaveAttribute('target', '_blank');
  });

  it('pede o consentimento das métricas de uso desmarcado, com a transferência para os EUA', () => {
    renderWithQuery(<RegisterForm redirectTo="/" />);

    const consent = screen.getByRole('checkbox', {
      name: 'Usar a minha conta nas métricas de uso (opcional)',
    });
    expect(consent).not.toBeChecked();
    expect(consent).toHaveAccessibleDescription(/ficam em servidores nos Estados Unidos/);
  });

  it.each([
    [false, 'sem marcar a caixa'],
    [true, 'com a caixa marcada'],
  ])('manda usageMetricsConsent %s %s', async (consent) => {
    const fetchMock = stubFetch(() => Response.json(sampleUser, { status: 201 }));
    renderWithQuery(<RegisterForm redirectTo="/" />);
    if (consent) await userEvent.setup().click(screen.getByRole('checkbox'));

    await submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<
      string,
      unknown
    >;
    expect(body.usageMetricsConsent).toBe(consent);
  });

  it('mostra o tamanho mínimo da senha e recusa uma curta sem chamar a API', async () => {
    const fetchMock = stubFetch(() => Response.json(sampleUser, { status: 201 }));
    renderWithQuery(<RegisterForm redirectTo="/" />);

    await submit('curta');

    expect(await screen.findByText('A senha tem no mínimo 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toHaveAccessibleDescription(
      'Mínimo de 8 caracteres. A senha tem no mínimo 8 caracteres.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cria a conta e segue para a partida a frio', async () => {
    stubFetch(() => Response.json(sampleUser, { status: 201 }));
    renderWithQuery(<RegisterForm redirectTo="/" />);

    await submit();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/boas-vindas'));
  });

  it('a partida a frio guarda o destino de onde a pessoa veio', async () => {
    stubFetch(() => Response.json(sampleUser, { status: 201 }));
    renderWithQuery(<RegisterForm redirectTo="/jogos/celeste" />);

    await submit();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/boas-vindas?next=%2Fjogos%2Fceleste'),
    );
  });

  it('e-mail já cadastrado aparece no campo de e-mail', async () => {
    stubFetch(() => apiError(409, 'E-mail já cadastrado'));
    renderWithQuery(<RegisterForm redirectTo="/" />);

    await submit();

    await waitFor(() =>
      expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('E-mail já cadastrado'),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('erros de validação da API vão para os campos', async () => {
    stubFetch(() => apiError(400, ['displayName: Nome recusado.']));
    renderWithQuery(<RegisterForm redirectTo="/" />);

    await submit();

    await waitFor(() =>
      expect(screen.getByLabelText('Nome de exibição')).toHaveAccessibleDescription(
        'Nome recusado.',
      ),
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('mostra e oculta a senha pelo botão dentro do campo', async () => {
    renderWithQuery(<RegisterForm redirectTo="/" />);
    const field = screen.getByLabelText(/^Senha/);
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });

    await userEvent.setup().click(toggle);

    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveAttribute('autocomplete', 'new-password');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
