import nodemailer from 'nodemailer';

interface SendResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
  resetLink: string;
}

export const createEmailTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

export const generateResetEmailHtml = (name: string, resetLink: string): string => {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Ulang Kata Sandi - CARES</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          <!-- Header Banner Merah CARES -->
          <tr>
            <td style="background: linear-gradient(135deg, #ba181b 0%, #dc2626 100%); padding: 32px 36px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">CARES</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.2px;">Bersama Menjaga Fasilitas Kampus - Telkom University</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Isi Pesan -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Permintaan Atur Ulang Kata Sandi</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                Halo <strong>${name}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0;">
                Kami menerima permintaan untuk mengatur ulang kata sandi akun CARES Anda. Silakan klik tombol merah di bawah ini untuk melanjutkan pembuatan kata sandi baru Anda:
              </p>

              <!-- Tombol Merah CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #dc2626;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #dc2626; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);">
                      Atur Ulang Kata Sandi
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12.5px; line-height: 1.5; color: #6b7280; margin: 0 0 14px 0;">
                Jika tombol di atas tidak dapat diklik, Anda dapat menyalin dan membuka tautan berikut di peramban Anda:
              </p>
              <p style="font-size: 12px; line-height: 1.5; color: #ba181b; word-break: break-all; margin: 0 0 24px 0; background-color: #fef2f2; padding: 10px 14px; border-radius: 6px; border: 1px solid #fee2e2;">
                ${resetLink}
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #ba181b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #4b5563; margin: 0; line-height: 1.5;">
                  <strong>Penting:</strong> Tautan pemulihan kata sandi ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dengan aman.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #4b5563; margin: 0;">
                Salam hangat,<br>
                <strong>Tim Pengelola Sarana & Prasarana CARES</strong><br>
                Telkom University
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 36px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="font-size: 11.5px; color: #9ca3af; margin: 0; line-height: 1.5;">
                Email ini dikirim secara otomatis oleh Sistem Pelaporan Fasilitas Kampus CARES.<br>
                Mohon untuk tidak membalas email ini secara langsung.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const sendResetPasswordEmail = async ({
  to,
  name,
  resetToken,
  resetLink,
}: SendResetEmailParams): Promise<{ success: boolean; mocked?: boolean; error?: string }> => {
  const transporter = createEmailTransporter();
  const htmlContent = generateResetEmailHtml(name, resetLink);
  const sender = process.env.SMTP_FROM || 'CARES Telkom University <no-reply@telkomuniversity.ac.id>';

  if (!transporter) {
    // Mode pengembangan / kredensial belum diisi
    console.log('====================================================');
    console.log('[EMAIL SERVICE - SIMULASI GMAIL / GOOGLE]');
    console.log(`Kepada: ${to} (${name})`);
    console.log(`Tautan Reset: ${resetLink}`);
    console.log(`Token Reset: ${resetToken}`);
    console.log('Catatan: SMTP_USER dan SMTP_PASS belum diset di .env.');
    console.log('====================================================');
    return { success: true, mocked: true };
  }

  try {
    await transporter.sendMail({
      from: sender,
      to,
      subject: 'Instruksi Pengaturan Ulang Kata Sandi Akun CARES',
      html: htmlContent,
    });
    console.log(`[EMAIL SERVICE] Email pemulihan kata sandi berhasil dikirim ke: ${to}`);
    return { success: true, mocked: false };
  } catch (error: any) {
    console.error('[EMAIL SERVICE] Gagal mengirim email via Google SMTP:', error?.message || error);
    // Graceful: Jangan gagalkan respon jika koneksi SMTP bermasalah, tapi laporkan
    return { success: false, error: error?.message || 'Gagal mengirim email' };
  }
};
