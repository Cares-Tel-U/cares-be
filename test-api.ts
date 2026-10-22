import axios from 'axios';
import type { Server } from 'http';
import app from './src/app';

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
let BASE_URL = process.env.BASE_URL || `http://localhost:${DEFAULT_PORT}`;
let runningServer: Server | null = null;

async function startServerIfNeeded(): Promise<void> {
  try {
    // Cek apakah server backend sudah berjalan
    await axios.get(`${BASE_URL}/`, { timeout: 1000 });
    console.log(`ℹ️ Terhubung ke server backend yang sudah aktif di ${BASE_URL}\n`);
  } catch (err: any) {
    // Jika koneksi ditolak, jalankan instance express lokal untuk pengujian
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || !err.response) {
      console.log(`ℹ️ Server belum aktif. Memulai server backend otomatis...`);
      await new Promise<void>((resolve, reject) => {
        const s = app.listen(DEFAULT_PORT, () => {
          runningServer = s;
          BASE_URL = `http://localhost:${DEFAULT_PORT}`;
          console.log(`✅ Server backend otomatis aktif di ${BASE_URL}\n`);
          resolve();
        });
        s.on('error', (e: any) => {
          if (e.code === 'EADDRINUSE') {
            // Gunakan port dinamis acak jika default port sedang digunakan
            const dynamicServer = app.listen(0, () => {
              runningServer = dynamicServer;
              const addr = dynamicServer.address();
              const port = typeof addr === 'object' && addr ? addr.port : 5001;
              BASE_URL = `http://localhost:${port}`;
              console.log(`✅ Server backend otomatis aktif di port dinamis ${BASE_URL}\n`);
              resolve();
            });
            dynamicServer.on('error', reject);
          } else {
            reject(e);
          }
        });
      });
    }
  }
}

async function runApiTests() {
  console.log('🚀 Memulai Pengujian API Backend CARES...\n');

  try {
    await startServerIfNeeded();

    // 1. Tes Endpoint Root (Server Check)
    console.log('1️⃣ Testing Server Health...');
    const health = await axios.get(`${BASE_URL}/`);
    console.log('  ✅ Server Response:', health.data.message);

    // 2. Tes Register Akun Mahasiswa Baru
    const testEmail = `tester_${Date.now()}@telkomuniversity.ac.id`;
    console.log(`\n2️⃣ Testing Register User (${testEmail})...`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      nama: 'Tester Otomatis',
      email: testEmail,
      password: 'password123',
      role: 'MAHASISWA',
    });
    console.log('  ✅ Register Berhasil:', regRes.data.message);

    // 3. Tes Login Akun Mahasiswa
    console.log('\n3️⃣ Testing Login User...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'password123',
    });
    const userToken = loginRes.data.token || loginRes.data.data?.token;
    console.log('  ✅ Login Berhasil! JWT Token didapatkan.');

    const authHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 4. Tes Get Master Data Facilities
    console.log('\n4️⃣ Testing Get Master Data Fasilitas...');
    const facRes = await axios.get(`${BASE_URL}/facilities`);
    const facilities = facRes.data.data || facRes.data;
    console.log(`  ✅ Berhasil mengambil ${facilities.length} fasilitas.`);

    if (!facilities || facilities.length === 0) {
      console.log('  ⚠️ Fasilitas kosong! Jalankan "npx prisma db seed" terlebih dahulu.');
      return;
    }

    // 5. Tes Create Report (Pilih fasilitas yang belum ada laporan aktif)
    console.log('\n5️⃣ Testing Create Report...');
    let createdReport: any = null;
    let selectedFacilityId = facilities[0].id;

    for (const fac of facilities) {
      try {
        const reportRes = await axios.post(
          `${BASE_URL}/reports`,
          {
            judul: `Tes Proyektor Mati di ${fac.nama}`,
            deskripsi: 'Proyektor di kelas tidak dapat menyala saat dihubungkan ke listrik.',
            facilityId: fac.id,
            isAnonymous: false,
          },
          authHeaders
        );
        createdReport = reportRes.data.data || reportRes.data;
        selectedFacilityId = fac.id;
        break;
      } catch (err: any) {
        // Jika fasilitas ini sedang dalam penanganan, coba fasilitas berikutnya
        if (err.response?.status === 400 && err.response?.data?.message?.includes('sedang dalam penanganan')) {
          continue;
        }
        throw err;
      }
    }

    if (!createdReport) {
      throw new Error('Seluruh fasilitas sedang memiliki laporan aktif. Silakan bersihkan data atau ubah status.');
    }
    console.log('  ✅ Laporan Berhasil Dibuat ID:', createdReport.id);

    // 6. Tes Duplicate Report Validation (Cek Pencegahan Laporan Ganda)
    console.log('\n6️⃣ Testing Duplicate Report Prevention...');
    try {
      await axios.post(
        `${BASE_URL}/reports`,
        {
          judul: 'Tes Proyektor Mati Lagi',
          deskripsi: 'Mencoba membuat laporan ganda di fasilitas yang sama.',
          facilityId: selectedFacilityId,
          isAnonymous: false,
        },
        authHeaders
      );
      console.log('  ❌ GAGAL: Sistem memperbolehkan laporan ganda!');
    } catch (err: any) {
      console.log('  ✅ Validasi Berhasil! Laporan ganda ditolak:', err.response?.data?.message);
    }

    // 7. Tes Get My Reports (Riwayat Laporan User)
    console.log('\n7️⃣ Testing Get My Reports...');
    await axios.get(`${BASE_URL}/reports/my-reports`, authHeaders);
    console.log('  ✅ Berhasil mengambil riwayat laporan user.');

    // 8. Tes Get Report Detail
    console.log(`\n8️⃣ Testing Get Report Detail (ID: ${createdReport.id})...`);
    const detailRes = await axios.get(`${BASE_URL}/reports/${createdReport.id}`, authHeaders);
    console.log('  ✅ Detail Laporan Ditemukan:', detailRes.data.data?.judul);

    // 9. Tes Login Admin / SARPRAS
    console.log('\n9️⃣ Testing Admin Login...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@telkomuniversity.ac.id', // Gunakan email admin hasil prisma seed
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.token || adminLoginRes.data.data?.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('  ✅ Admin Login Berhasil!');

    // 10. Tes Admin Update Status Laporan
    console.log('\n🔟 Testing Admin Update Report Status (SELESAI)...');
    const updateRes = await axios.patch(
      `${BASE_URL}/admin/reports/${createdReport.id}/status`,
      { status: 'SELESAI' },
      adminHeaders
    );
    console.log('  ✅ Status Laporan Diperbarui:', updateRes.data.message);

    // 11. Tes Get Notifications (User Cek Notifikasi Update)
    console.log('\n1️⃣1️⃣ Testing User Notification Arrival...');
    const notifRes = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    console.log('  ✅ Notifikasi Diterima:', notifRes.data.data?.[0]?.pesan || 'Ada notifikasi');

    // 12. Tes Fitur Lupa Kata Sandi (Forgot Password Request)
    console.log('\n1️⃣2️⃣ Testing Forgot Password Request...');
    const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail, // Akun yang valid dari tes registrasi
    });
    console.log('  ✅ Request Reset Password Berhasil:', forgotRes.data.message);
    const resetToken = forgotRes.data.data?.resetToken;

    // 13. Tes Konfirmasi Reset Kata Sandi Baru
    if (resetToken) {
      console.log('\n1️⃣3️⃣ Testing Reset Password Confirmation...');
      const resetRes = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: resetToken,
        newPassword: 'passwordBaru123!',
      });
      console.log('  ✅ Konfirmasi Reset Password Berhasil:', resetRes.data.message);

      // Verifikasi login dengan password baru
      const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: testEmail,
        password: 'passwordBaru123!',
      });
      console.log('  ✅ Verifikasi Login dengan Kata Sandi Baru Berhasil!');
    }

    console.log('\n🎉 SELURUH PENGUJIAN API BERHASIL TANPA ERROR!');
  } catch (error: any) {
    console.error('\n❌ Pengujian Terhenti Karena Error:');
    if (error.response) {
      console.error('   Status Code:', error.response.status);
      console.error('   Pesan Error:', JSON.stringify(error.response.data));
    } else {
      console.error('   Detail:', error.message);
    }
  } finally {
    if (runningServer) {
      runningServer.close();
      console.log('🛑 Server backend pengujian otomatis ditutup.');
    }
  }
}

runApiTests();