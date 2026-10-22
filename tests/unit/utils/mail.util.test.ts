import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nodemailer from 'nodemailer';
import {
  createEmailTransporter,
  generateResetEmailHtml,
  sendResetPasswordEmail,
} from '../../../src/utils/mail.util';

describe('Mail Utility Tests (src/utils/mail.util.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createEmailTransporter', () => {
    it('should return null if SMTP_USER or SMTP_PASS is not defined', () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.SMTP_PASSWORD;

      const transporter = createEmailTransporter();
      expect(transporter).toBeNull();
    });

    it('should return gmail transporter when host is gmail.com', () => {
      process.env.SMTP_USER = 'cares@gmail.com';
      process.env.SMTP_PASS = 'app-password';
      process.env.SMTP_HOST = 'smtp.gmail.com';

      const createSpy = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({} as any);

      const transporter = createEmailTransporter();

      expect(createSpy).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'cares@gmail.com',
          pass: 'app-password',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      expect(transporter).toBeDefined();
    });

    it('should return custom SMTP transporter when custom host is provided', () => {
      process.env.SMTP_USER = 'smtp-user';
      process.env.SMTP_PASS = 'smtp-pass';
      process.env.SMTP_HOST = 'smtp.custommail.org';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';

      const createSpy = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({} as any);

      const transporter = createEmailTransporter();

      expect(createSpy).toHaveBeenCalledWith({
        host: 'smtp.custommail.org',
        port: 465,
        secure: true,
        auth: {
          user: 'smtp-user',
          pass: 'smtp-pass',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      expect(transporter).toBeDefined();
    });
  });

  describe('generateResetEmailHtml', () => {
    it('should generate valid HTML containing user name and reset link', () => {
      const name = 'Budi Santoso';
      const resetLink = 'http://localhost:5173/reset-password?token=test-token-123';

      const html = generateResetEmailHtml(name, resetLink);

      expect(html).toContain('Budi Santoso');
      expect(html).toContain(resetLink);
      expect(html).toContain('Permintaan Atur Ulang Kata Sandi');
      expect(html).toContain('CARES');
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should run in simulated mock mode when transporter is null', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.SMTP_PASSWORD;

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendResetPasswordEmail({
        to: 'pelapor@telkomuniversity.ac.id',
        name: 'Pelapor Telkom',
        resetToken: 'token-abc',
        resetLink: 'http://localhost:5173/reset-password?token=token-abc',
      });

      expect(result).toEqual({ success: true, mocked: true });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL SERVICE - SIMULASI'));
    });

    it('should send email successfully when transporter is configured', async () => {
      process.env.SMTP_USER = 'test@gmail.com';
      process.env.SMTP_PASS = 'pass123';
      process.env.SMTP_HOST = 'smtp.gmail.com';

      const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg-123' });
      vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendResetPasswordEmail({
        to: 'user@telkomuniversity.ac.id',
        name: 'User Test',
        resetToken: 'token-xyz',
        resetLink: 'http://localhost:5173/reset-password?token=token-xyz',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@telkomuniversity.ac.id',
          subject: 'Instruksi Pengaturan Ulang Kata Sandi Akun CARES',
        })
      );
      expect(result).toEqual({ success: true, mocked: false });
    });

    it('should catch error gracefully when transporter.sendMail fails', async () => {
      process.env.SMTP_USER = 'test@gmail.com';
      process.env.SMTP_PASS = 'pass123';
      process.env.SMTP_HOST = 'smtp.gmail.com';

      const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP connection timeout'));
      vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: mockSendMail,
      } as any);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await sendResetPasswordEmail({
        to: 'user@telkomuniversity.ac.id',
        name: 'User Test',
        resetToken: 'token-err',
        resetLink: 'http://localhost:5173/reset-password?token=token-err',
      });

      expect(result).toEqual({
        success: false,
        error: 'SMTP connection timeout',
      });
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
