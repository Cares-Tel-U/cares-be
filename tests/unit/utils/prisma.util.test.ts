import { describe, it, expect } from 'vitest';
import { prisma } from '../../../src/utils/prisma';

describe('Prisma Utility Tests (src/utils/prisma.ts)', () => {
  it('should export a valid prisma client instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });
});
