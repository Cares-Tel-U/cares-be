import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Root & Documentation API Tests (src/app.ts)', () => {
  it('GET / should return welcome message and API metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      message: 'Welcome to CARES Backend API!',
      documentation: '/api-docs',
      version: 'v1.0.0',
    });
  });

  it('GET /api-docs should redirect or serve swagger documentation', async () => {
    const res = await request(app).get('/api-docs/');
    // Swagger UI returns 200 or 301
    expect([200, 301, 302]).toContain(res.status);
  });

  it('GET /docs should serve swagger documentation', async () => {
    const res = await request(app).get('/docs/');
    expect([200, 301, 302]).toContain(res.status);
  });
});
