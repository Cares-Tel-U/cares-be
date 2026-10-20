import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockNotificationCreate } = vi.hoisted(() => ({
  mockNotificationCreate: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      notification = {
        create: mockNotificationCreate,
      };
    },
  };
});

import { createNotification } from '../../../src/utils/notification.util';

describe('Notification Utility Tests (src/utils/notification.util.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create notification in database', async () => {
    const mockCreated = {
      id: 'notif-1',
      userId: 'user-1',
      reportId: 'report-1',
      pesan: 'Status laporan telah diperbarui.',
      isRead: false,
      createdAt: new Date(),
    };
    mockNotificationCreate.mockResolvedValue(mockCreated);

    const result = await createNotification('user-1', 'report-1', 'Status laporan telah diperbarui.');

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        reportId: 'report-1',
        pesan: 'Status laporan telah diperbarui.',
      },
    });
    expect(result).toEqual(mockCreated);
  });

  it('should catch error and log message when database insertion fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockNotificationCreate.mockRejectedValue(new Error('DB connection failed'));

    const result = await createNotification('user-fail', 'report-fail', 'Pesan error');

    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Gagal membuat notifikasi:', expect.any(Error));
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
