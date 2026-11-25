import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// As métricas de uso não saem nos testes; os do módulo de métricas conferem o envio pelo mock.
vi.mock('@/features/metrics/transport', () => ({ sendEvents: vi.fn() }));

afterEach(cleanup);
