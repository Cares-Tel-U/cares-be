import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Realtime API Tests (/api/v1/realtime/*)', () => {
  it('GET /api/v1/realtime/status should return active connections count with 200 status', async () => {
    const res = await request(app).get('/api/v1/realtime/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(typeof res.body.activeConnections).toBe('number');
  });

  it('POST /api/v1/realtime/broadcast should broadcast event with 200 status', async () => {
    const res = await request(app)
      .post('/api/v1/realtime/broadcast')
      .send({
        type: 'PING',
        data: { message: 'test' },
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.type).toBe('PING');
  });

  it('POST /api/v1/realtime/broadcast should return 400 if type is missing', async () => {
    const res = await request(app)
      .post('/api/v1/realtime/broadcast')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Field type wajib diisi');
  });
});
