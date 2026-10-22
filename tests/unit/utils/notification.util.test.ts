import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockNotificationCreate, mockUserFindUnique } = vi.hoisted(() => ({
  mockNotificationCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = {
        findUnique: mockUserFindUnique,
      };
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

  it('should successfully create notification when user preference is true', async () => {
    mockUserFindUnique.mockResolvedValue({ notificationPreference: true });
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

  it('should NOT create notification when user has disabled notifications (notificationPreference === false)', async () => {
    mockUserFindUnique.mockResolvedValue({ notificationPreference: false });

    const result = await createNotification('user-disabled', 'report-1', 'Pesan tidak boleh dikirim');

    expect(result).toBeNull();
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('should catch error and log message when database insertion fails', async () => {
    mockUserFindUnique.mockResolvedValue({ notificationPreference: true });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockNotificationCreate.mockRejectedValue(new Error('DB connection failed'));

    const result = await createNotification('user-fail', 'report-fail', 'Pesan error');

    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Gagal membuat notifikasi:', expect.any(Error));
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
