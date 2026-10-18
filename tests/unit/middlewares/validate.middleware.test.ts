import { describe, it, expect, vi } from 'vitest';
import { validateBody } from '../../../src/middlewares/validate.middleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

describe('Validate Middleware Tests (src/middlewares/validate.middleware.ts)', () => {
  const testSchema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
  });

  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  const createMockNext = () => vi.fn() as NextFunction;

  it('should call next() and assign parsed data to req.body when input is valid', () => {
    const req = {
      body: {
        email: 'test@example.com',
        age: 21,
      },
    } as Request;
    const res = createMockRes();
    const next = createMockNext();

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ email: 'test@example.com', age: 21 });
  });

  it('should return 400 and error details when required fields are missing or invalid', () => {
    const req = {
      body: {
        email: 'invalid-email-format',
        age: 15, // Less than min 18
      },
    } as Request;
    const res = createMockRes();
    const next = createMockNext();

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validasi input gagal',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'age' }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
