import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { logRequests } from './request-logger.middleware';

function logOneRequest() {
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  const request = {
    requestId: 'req-1',
    method: 'PUT',
    path: '/api/me/ratings/hades',
    ip: '203.0.113.7',
    get: (header: string) => (header === 'x-forwarded-for' ? '203.0.113.7, 10.0.0.1' : undefined),
  } as unknown as Request;
  const response = Object.assign(new EventEmitter(), { statusCode: 204 }) as unknown as Response;

  logRequests(request, response, jest.fn());
  response.emit('finish');
  return log;
}

describe('logRequests', () => {
  it('registra os metadados do pedido e o tamanho do X-Forwarded-For', () => {
    const log = logOneRequest();

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        method: 'PUT',
        path: '/api/me/ratings/hades',
        status: 204,
        forwardedFor: 2,
      }),
    );
  });

  it('não registra o IP de quem pediu', () => {
    const log = logOneRequest();

    expect(JSON.stringify(log.mock.calls)).not.toContain('203.0.113.7');
  });
});
