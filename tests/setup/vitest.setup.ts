import { beforeEach, afterEach, vi } from 'vitest';

// Ensure test environment variables are established safely
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_cares_super_key_2026';
process.env.PORT = '5001';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
