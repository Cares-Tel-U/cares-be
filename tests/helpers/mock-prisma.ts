import { vi } from 'vitest';

export const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },
  facility: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  report: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  reportPhoto: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  notification: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $transaction: vi.fn((cb: any) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
});

export const mockPrisma = createMockPrisma();

export const resetMockPrisma = () => {
  Object.values(mockPrisma.user).forEach((fn: any) => fn.mockReset());
  Object.values(mockPrisma.facility).forEach((fn: any) => fn.mockReset());
  Object.values(mockPrisma.report).forEach((fn: any) => fn.mockReset());
  Object.values(mockPrisma.reportPhoto).forEach((fn: any) => fn.mockReset());
  Object.values(mockPrisma.notification).forEach((fn: any) => fn.mockReset());
};
